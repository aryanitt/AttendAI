from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from pymongo.errors import PyMongoError

from ..auth_utils import create_token, hash_password, require_auth, verify_password
from ..mongo_errors import json_for_mongo_error
from ..db import get_db
from ..utils import serialize_doc

bp = Blueprint("auth", __name__)


@bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    if not name or not email or len(password) < 6:
        return (
            jsonify(
                {"error": "Name, email, and password (min 6 chars) are required"}
            ),
            400,
        )
    doc = {
        "name": name,
        "email": email,
        "password_hash": hash_password(password),
        "role": "teacher",
        "created_at": datetime.now(timezone.utc),
    }
    try:
        db = get_db()
        if db.teachers.find_one({"email": email}):
            return jsonify({"error": "Email already registered"}), 409
        is_first = db.teachers.count_documents({}) == 0
        role = "admin" if is_first else "teacher"
        doc["role"] = role
        res = db.teachers.insert_one(doc)
        token = create_token(str(res.inserted_id), role)
    except PyMongoError as e:
        return json_for_mongo_error(e)
    doc["_id"] = res.inserted_id
    return (
        jsonify(
            {
                "token": token,
                "teacher": serialize_doc(doc),
            }
        ),
        201,
    )


@bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400
    try:
        db = get_db()
        teacher = db.teachers.find_one({"email": email})
    except PyMongoError as e:
        return json_for_mongo_error(e)
    if not teacher or not verify_password(password, teacher["password_hash"]):
        return jsonify({"error": "Invalid credentials"}), 401
    try:
        token = create_token(str(teacher["_id"]), teacher.get("role", "teacher"))
    except Exception:
        return jsonify({"error": "Could not create session. Check JWT_SECRET in backend/.env."}), 500
    return jsonify({"token": token, "teacher": serialize_doc(teacher)})


@bp.get("/me")
@require_auth
def me():
    return jsonify({"teacher": serialize_doc(request.teacher)})
