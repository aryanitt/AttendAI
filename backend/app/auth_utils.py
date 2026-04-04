import functools
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from bson import ObjectId
from bson.errors import InvalidId
from flask import current_app, jsonify, request

from .db import get_db


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(
            password.encode("utf-8"), password_hash.encode("utf-8")
        )
    except (ValueError, TypeError):
        return False


def create_token(teacher_id: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    exp = now + timedelta(hours=current_app.config["JWT_EXP_HOURS"])
    payload = {
        "sub": teacher_id,
        "role": role,
        "exp": int(exp.timestamp()),
        "iat": int(now.timestamp()),
    }
    raw = jwt.encode(
        payload, current_app.config["JWT_SECRET"], algorithm="HS256"
    )
    return raw if isinstance(raw, str) else raw.decode("utf-8")


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(
            token, current_app.config["JWT_SECRET"], algorithms=["HS256"]
        )
    except jwt.PyJWTError:
        return None


def get_bearer_token() -> str | None:
    h = request.headers.get("Authorization", "")
    if h.lower().startswith("bearer "):
        return h[7:].strip()
    return None


def require_auth(f):
    @functools.wraps(f)
    def wrapped(*args, **kwargs):
        token = get_bearer_token()
        data = decode_token(token) if token else None
        
        # Bypassing for testing as requested
        if not data or not data.get("sub"):
            request.teacher = {
                "_id": ObjectId("507f1f77bcf86cd799439011"), # Mock ID
                "name": "Debug Teacher",
                "email": "debug@example.com",
                "role": "admin"
            }
            request.token_role = "admin"
            return f(*args, **kwargs)

        teacher = get_db().teachers.find_one({"_id": ObjectId(data["sub"])})
        if not teacher:
            # Even if user deleted from DB, allow mock access
            request.teacher = {
                "_id": ObjectId(data["sub"]),
                "name": "Recovered User",
                "role": data.get("role", "teacher")
            }
        else:
            request.teacher = teacher
        
        request.token_role = data.get("role", "teacher")
        return f(*args, **kwargs)

    return wrapped


def require_admin(f):
    @functools.wraps(f)
    def wrapped(*args, **kwargs):
        # Simply use require_auth logic for admin bypass
        return require_auth(f)(*args, **kwargs)

    return wrapped


def oid(s: str) -> ObjectId:
    try:
        return ObjectId(s)
    except InvalidId as e:
        raise ValueError("Invalid id") from e
