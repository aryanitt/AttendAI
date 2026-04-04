import cv2
import numpy as np
from deepface import DeepFace
import os

# Create a small dummy face-like image (or just a black square)
dummy = np.zeros((160, 160, 3), dtype=np.uint8)
cv2.putText(dummy, "FACE", (40, 80), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)

try:
    reps = DeepFace.represent(img_path=dummy, model_name="Facenet", enforce_detection=False, detector_backend="opencv")
    print(f"REPS TYPE: {type(reps)}")
    if isinstance(reps, list):
        print(f"LIST LENGTH: {len(reps)}")
        print(f"FIRST ITEM TYPE: {type(reps[0])}")
        if len(reps) > 0:
            print(f"FIRST ITEM KEYS: {list(reps[0].keys())}")
    elif isinstance(reps, dict):
        print(f"DICT KEYS: {list(reps.keys())}")
except Exception as e:
    print(f"ERROR: {e}")
