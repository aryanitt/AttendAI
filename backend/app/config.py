import os


def _origins():
    raw = os.getenv("CORS_ORIGINS", "http://localhost:5173")
    return [o.strip() for o in raw.split(",") if o.strip()]


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
    MONGO_URI = "mongodb+srv://dhruvgupta9713_db_user:YhsRHWYnGznooYHO@cluster0.p754fje.mongodb.net/smart_attendance_db?retryWrites=true&w=majority&appName=Cluster0"
    JWT_SECRET = os.getenv("JWT_SECRET", "dev-jwt-change-me")
    JWT_EXP_HOURS = int(os.getenv("JWT_EXP_HOURS", "72"))
    CORS_ORIGINS = _origins()
    FACE_MODEL = os.getenv("FACE_MODEL", "Facenet")
    FACE_THRESHOLD = float(os.getenv("FACE_THRESHOLD", "0.65"))
    BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    UPLOAD_ROOT = os.path.join(BASE_DIR, "data", "uploads")
    EMBEDDING_ROOT = os.path.join(BASE_DIR, "data", "embeddings")
