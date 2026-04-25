import logging
import os
import pickle
from typing import Any

import cv2
import numpy as np
from flask import current_app

logger = logging.getLogger(__name__)

# ── Detector backend: "ssd" is fast on CPU and far more accurate than "opencv" ──
_DETECTOR_BACKEND = "ssd"

_DEEPFACE = None


def _deepface():
    global _DEEPFACE
    if _DEEPFACE is None:
        from deepface import DeepFace

        _DEEPFACE = DeepFace
    return _DEEPFACE


def _model_name() -> str:
    return current_app.config.get("FACE_MODEL", "Facenet")


def _threshold() -> float:
    return float(current_app.config.get("FACE_THRESHOLD", 0.50))


# ---------------------------------------------------------------------------
#  Warmup – call once at startup to pre-download & cache the model weights
# ---------------------------------------------------------------------------
def warmup():
    """Pre-load the face-detection and embedding models so the first real
    request doesn't incur a 30-60 s download penalty."""
    logger.info("⏳ Warming up DeepFace (downloading / loading model weights)…")
    DeepFace = _deepface()
    # Create a small dummy image (100×100 black) and run it through the pipeline
    dummy = np.zeros((100, 100, 3), dtype=np.uint8)
    # Draw a simple oval to give the detector *something* face-like
    cv2.ellipse(dummy, (50, 45), (30, 40), 0, 0, 360, (180, 180, 180), -1)
    cv2.circle(dummy, (38, 38), 4, (60, 60, 60), -1)   # left eye
    cv2.circle(dummy, (62, 38), 4, (60, 60, 60), -1)   # right eye
    cv2.ellipse(dummy, (50, 58), (12, 6), 0, 0, 360, (100, 100, 100), -1)  # mouth
    try:
        DeepFace.represent(
            img_path=dummy,
            model_name="Facenet",
            enforce_detection=False,
            detector_backend=_DETECTOR_BACKEND,
        )
    except Exception:
        # It's OK if the dummy doesn't produce a real face – we just need
        # the model files downloaded and loaded into memory.
        pass
    logger.info("✅ DeepFace warmup complete – model cached in memory.")


# ---------------------------------------------------------------------------
#  Embedding storage (per-class pickle files)
# ---------------------------------------------------------------------------
def embedding_path(class_id: str) -> str:
    root = current_app.config["EMBEDDING_ROOT"]
    os.makedirs(root, exist_ok=True)
    return os.path.join(root, f"{class_id}.pkl")


def load_embeddings(class_id: str) -> dict[str, np.ndarray]:
    path = embedding_path(class_id)
    if not os.path.isfile(path):
        return {}
    try:
        with open(path, "rb") as f:
            raw = pickle.load(f)
        out = {}
        for sid, vec in raw.items():
            out[str(sid)] = np.asarray(vec, dtype=np.float64)
        return out
    except Exception as e:
        if hasattr(current_app, 'logger'):
            current_app.logger.error(f"Failed to load embeddings from {path}: {str(e)}")
        return {}


def save_embeddings(class_id: str, data: dict[str, np.ndarray]) -> None:
    path = embedding_path(class_id)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    serial = {k: v.tolist() for k, v in data.items()}
    with open(path, "wb") as f:
        pickle.dump(serial, f)


def remove_student_embedding(class_id: str, student_id: str) -> None:
    data = load_embeddings(class_id)
    data.pop(str(student_id), None)
    save_embeddings(class_id, data)


# ---------------------------------------------------------------------------
#  Image helpers
# ---------------------------------------------------------------------------
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


def _preprocess_for_detection(img_bgr: np.ndarray) -> np.ndarray:
    """Apply CLAHE histogram equalization to improve face detection in
    poor / uneven lighting (typical classroom environment)."""
    lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    enhanced = cv2.merge([l, a, b])
    return cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)


# ---------------------------------------------------------------------------
#  Core face functions
# ---------------------------------------------------------------------------
def get_embedding_from_bgr(img_bgr: np.ndarray) -> np.ndarray:
    """Extract a single face embedding from a BGR image.
    Uses SSD detector + Facenet model.  Raises ValueError if no face found."""
    DeepFace = _deepface()

    # Pre-process for better detection in tricky lighting
    enhanced = _preprocess_for_detection(img_bgr)
    rgb = cv2.cvtColor(enhanced, cv2.COLOR_BGR2RGB)

    try:
        reps = DeepFace.represent(
            img_path=rgb,
            model_name=_model_name(),
            enforce_detection=False,          # don't crash – we check manually
            detector_backend=_DETECTOR_BACKEND,
        )
    except Exception as exc:
        logger.warning(f"DeepFace.represent failed: {exc}")
        raise ValueError("Face detection failed – try a clearer photo") from exc

    if not reps:
        raise ValueError("No face detected in the image")

    # DeepFace may return a result even with enforce_detection=False when
    # it can't find a face; the embedding will be near-zero.  Filter those.
    emb = np.asarray(reps[0]["embedding"], dtype=np.float64)
    if np.linalg.norm(emb) < 1e-6:
        raise ValueError("No clear face detected – ensure the face is visible and well-lit")

    return emb


def extract_face_crops_bgr(img_bgr: np.ndarray) -> list[np.ndarray]:
    """Detect all faces in a group photo and return cropped BGR images."""
    DeepFace = _deepface()

    enhanced = _preprocess_for_detection(img_bgr)
    rgb = cv2.cvtColor(enhanced, cv2.COLOR_BGR2RGB)

    try:
        faces = DeepFace.extract_faces(
            img_path=rgb,
            detector_backend=_DETECTOR_BACKEND,
            enforce_detection=False,
        )
    except Exception as exc:
        logger.warning(f"extract_faces failed: {exc}")
        return []

    h_img, w_img = img_bgr.shape[:2]
    crops: list[np.ndarray] = []

    for item in faces:
        # Skip low-confidence detections
        confidence = item.get("confidence", 0)
        if confidence is not None and float(confidence) < 0.50:
            continue

        face_region = item.get("facial_area", {})
        x = face_region.get("x", 0)
        y = face_region.get("y", 0)
        w = face_region.get("w", 0)
        h = face_region.get("h", 0)

        if w < 20 or h < 20:
            # Too small – likely a false positive
            continue

        # Add 15 % padding around the face for better embedding quality
        pad = int(0.15 * max(w, h))
        x0 = max(0, x - pad)
        y0 = max(0, y - pad)
        x1 = min(w_img, x + w + pad)
        y1 = min(h_img, y + h + pad)

        crop = img_bgr[y0:y1, x0:x1]
        if crop.size > 0:
            crops.append(crop)

    return crops


# ---------------------------------------------------------------------------
#  Matching
# ---------------------------------------------------------------------------
def match_embedding(
    emb: np.ndarray, roster: dict[str, np.ndarray]
) -> tuple[str | None, float]:
    best_id = None
    best_sim = -1.0
    thr = _threshold()

    emb_shape = emb.shape

    for sid, ref in roster.items():
        if ref.shape != emb_shape:
            # Shape mismatch indicates a different model was used for enrollment
            continue

        sim = _cosine(emb, ref)
        if sim > best_sim:
            best_sim = sim
            best_id = sid

    if best_id is not None and best_sim >= thr:
        return best_id, best_sim
    return None, best_sim


# ---------------------------------------------------------------------------
#  Enrollment
# ---------------------------------------------------------------------------
def enroll_student_face(class_id: str, student_id: str, image_bytes: bytes) -> None:
    bgr = image_bytes_to_bgr(image_bytes)
    emb = get_embedding_from_bgr(bgr)
    data = load_embeddings(class_id)
    data[str(student_id)] = emb
    save_embeddings(class_id, data)
