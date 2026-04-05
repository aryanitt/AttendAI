import os
import pickle
from typing import Any

import cv2
import numpy as np
from flask import current_app

_DEEPFACE = None


def _deepface():
    global _DEEPFACE
    if _DEEPFACE is None:
        print("DEBUG: Pre-loading DeepFace and AI models...")
        from deepface import DeepFace
        _DEEPFACE = DeepFace
        # Warmup with a tiny dummy image to force model loading into memory
        try:
            dummy = np.zeros((160, 160, 3), dtype=np.uint8)
            _DEEPFACE.represent(img_path=dummy, model_name="Facenet", enforce_detection=False)
            print("DEBUG: AI Models warmed up and ready!")
        except Exception as e:
            print(f"DEBUG: Warmup notice (non-fatal): {e}")
    return _DEEPFACE


def warmup_models():
    """Call this from app startup to avoid first-request delay"""
    _deepface()


def _model_name() -> str:
    return current_app.config.get("FACE_MODEL", "Facenet")


def _threshold() -> float:
    return float(current_app.config.get("FACE_THRESHOLD", 0.55))


def _grid_filename(class_id: str) -> str:
    return f"embeddings_{class_id}.pkl"


def load_embeddings(class_id: str) -> dict[str, np.ndarray]:
    from app.db import get_gridfs
    fs = get_gridfs()
    fn = _grid_filename(class_id)
    try:
        f = fs.find_one({"filename": fn})
        if not f:
            return {}
        raw = pickle.loads(f.read())
        out = {}
        for sid, vec in raw.items():
            out[str(sid)] = np.asarray(vec, dtype=np.float64)
        return out
    except Exception as e:
        print(f"DEBUG: Error loading GridFS embeddings: {e}")
        return {}


def save_embeddings(class_id: str, data: dict[str, np.ndarray]) -> None:
    from app.db import get_gridfs
    fs = get_gridfs()
    fn = _grid_filename(class_id)
    
    serial = {k: v.tolist() for k, v in data.items()}
    blob = pickle.dumps(serial)
    
    # Remove old version if exists
    old = fs.find_one({"filename": fn})
    if old:
        fs.delete(old._id)
        
    fs.put(blob, filename=fn)


def remove_student_embedding(class_id: str, student_id: str) -> None:
    data = load_embeddings(class_id)
    if str(student_id) in data:
        data.pop(str(student_id))
        save_embeddings(class_id, data)


def _cosine(a: np.ndarray, b: np.ndarray) -> float:
    na = np.linalg.norm(a)
    nb = np.linalg.norm(b)
    if na < 1e-9 or nb < 1e-9:
        return 0.0
    return float(np.dot(a, b) / (na * nb))


def image_bytes_to_bgr(data: bytes) -> np.ndarray:
    arr = np.frombuffer(data, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Invalid image data")
    return img


def get_embedding_from_bgr(img_bgr: np.ndarray) -> np.ndarray:
    import time
    t0 = time.time()
    
    # Performance Optimization: Resize large images to speed up detection
    h, w = img_bgr.shape[:2]
    max_dim = 640
    if max(h, w) > max_dim:
        scale = max_dim / max(h, w)
        img_bgr = cv2.resize(img_bgr, (int(w * scale), int(h * scale)))
        print(f"DEBUG: Resized image from {w}x{h} to {img_bgr.shape[1]}x{img_bgr.shape[0]} for speed")
        
    DeepFace = _deepface()
    rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    
    try:
        reps = DeepFace.represent(
            img_path=rgb,
            model_name=_model_name(),
            enforce_detection=True,
            detector_backend="opencv",
        )
    except Exception as e:
        print(f"DEBUG: opencv fallback triggered ({e})")
        reps = DeepFace.represent(
            img_path=rgb,
            model_name=_model_name(),
            enforce_detection=False,
            detector_backend="skip",
        )
    
    if not reps:
        print("DEBUG: DeepFace.represent returned no results")
        raise ValueError("No face detected")
        
    dur = time.time() - t0
    print(f"DEBUG: AI inference took {dur:.3f}s")
    
    emb = np.asarray(reps[0]["embedding"], dtype=np.float64)
    return emb


def detect_face_crops_opencv(img_bgr: np.ndarray) -> list[np.ndarray]:
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    cascade_path = (
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )
    cascade = cv2.CascadeClassifier(cascade_path)
    rects = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)
    h, w = img_bgr.shape[:2]
    crops = []
    for x, y, rw, rh in rects:
        pad = int(0.12 * max(rw, rh))
        x0, y0 = max(0, x - pad), max(0, y - pad)
        x1, y1 = min(w, x + rw + pad), min(h, y + rh + pad)
        crops.append(img_bgr[y0:y1, x0:x1])
    return crops


def extract_face_crops_bgr(img_bgr: np.ndarray) -> list[np.ndarray]:
    crops = detect_face_crops_opencv(img_bgr)
    if crops:
        return crops
    DeepFace = _deepface()
    rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    try:
        faces = DeepFace.extract_faces(
            img_path=rgb,
            detector_backend="opencv",
            enforce_detection=False,
        )
    except Exception:
        return []
    out = []
    for item in faces:
        face = item.get("face")
        if face is None:
            continue
        if face.dtype != np.uint8:
            face = (
                (face * 255).astype(np.uint8)
                if float(face.max()) <= 1.0
                else face.astype(np.uint8)
            )
        if len(face.shape) == 3 and face.shape[2] == 3:
            out.append(cv2.cvtColor(face, cv2.COLOR_RGB2BGR))
    return out


def match_embedding(
    emb: np.ndarray, roster: dict[str, np.ndarray]
) -> tuple[str | None, float]:
    best_id = None
    best_sim = -1.0
    thr = _threshold()
    for sid, ref in roster.items():
        sim = _cosine(emb, ref)
        if sim > best_sim:
            best_sim = sim
            best_id = sid
    if best_id is not None and best_sim >= thr:
        return best_id, best_sim
    return None, best_sim


def enroll_student_face(class_id: str, student_id: str, images_list: list[bytes]) -> None:
    embeddings = []
    for raw in images_list:
        try:
            bgr = image_bytes_to_bgr(raw)
            emb = get_embedding_from_bgr(bgr)
            embeddings.append(emb)
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"DEBUG: Error processing one image for {student_id}: {e}")
            continue
            
    if not embeddings:
        raise ValueError("No faces detected in any of the uploaded images")
        
    # Average all embeddings to create a more robust single vector
    final_emb = np.mean(embeddings, axis=0)
    
    # Re-normalize (optional but recommended for cosine similarity)
    norm = np.linalg.norm(final_emb)
    if norm > 1e-9:
        final_emb = final_emb / norm
        
    data = load_embeddings(class_id)
    data[str(student_id)] = final_emb
    save_embeddings(class_id, data)
