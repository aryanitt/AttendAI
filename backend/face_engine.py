import cv2
import numpy as np
from mtcnn import MTCNN
from keras_facenet import FaceNet
import pickle
import os

class FaceEngine:
    def __init__(self):
        # min_face_size=40 is much faster than default 20 for webcam/close-ups
        self.detector = MTCNN()
        self.embedder = FaceNet()
        self.embeddings_path = "embeddings/stored_embeddings.pkl"
        self.load_known_faces()

    def load_known_faces(self):
        if os.path.exists(self.embeddings_path):
            with open(self.embeddings_path, "rb") as f:
                self.known_faces = pickle.load(f)
        else:
            self.known_faces = {}

    def get_embeddings(self, image):
        # image should be in RGB
        # Downscale for faster detection if image is large
        h, w = image.shape[:2]
        max_dim = 640
        scale = 1.0
        if max(h, w) > max_dim:
            scale = max_dim / max(h, w)
            image_small = cv2.resize(image, (int(w * scale), int(h * scale)))
        else:
            image_small = image

        faces = self.detector.detect_faces(image_small)
        results = []
        for face in faces:
            x, y, w_box, h_box = face['box']
            
            # Rescale box back to original size
            x, y, w_box, h_box = [int(v / scale) for v in [x, y, w_box, h_box]]
            
            # Crop face with safety margin from original image
            x1, y1 = max(0, x), max(0, y)
            x2, y2 = min(image.shape[1], x + w_box), min(image.shape[0], y + h_box)
            face_img = image[y1:y2, x1:x2]
            
            if face_img.size == 0:
                continue
                
            # Resize for FaceNet (usually 160x160)
            face_img_resized = cv2.resize(face_img, (160, 160))
            face_img_final = np.expand_dims(face_img_resized, axis=0)
            
            # Get embeddings directly
            embeddings = self.embedder.embeddings(face_img_final)
            
            if len(embeddings) > 0:
                results.append({
                    "box": [x, y, w, h],
                    "embedding": embeddings[0],
                    "confidence": face['confidence']
                })
        return results

    def recognize(self, embedding, threshold=0.6):
        min_dist = float('inf')
        identity = "Unknown"
        
        for name, known_embeddings in self.known_faces.items():
            for known_emb in known_embeddings:
                dist = np.linalg.norm(embedding - known_emb)
                if dist < min_dist:
                    min_dist = dist
                    identity = name
        
        if min_dist < threshold:
            return identity, min_dist
        return "Unknown", min_dist

    def update_known_faces(self, name, new_embeddings):
        if name not in self.known_faces:
            self.known_faces[name] = []
        self.known_faces[name].extend(new_embeddings)
        self.save_to_disk()

    def delete_student_embeddings(self, name):
        if name in self.known_faces:
            del self.known_faces[name]
            self.save_to_disk()
            return True
        return False

    def save_to_disk(self):
        os.makedirs(os.path.dirname(self.embeddings_path), exist_ok=True)
        with open(self.embeddings_path, "wb") as f:
            pickle.dump(self.known_faces, f)

face_engine = FaceEngine()
