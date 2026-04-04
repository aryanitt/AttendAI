from flask import Blueprint, jsonify, request

from ..auth_utils import require_admin
from ..db import get_db
from ..utils import serialize_doc, serialize_list

bp = Blueprint("admin", __name__)


@bp.get("/teachers")
@require_admin
def list_teachers():
    db = get_db()
    rows = list(db.teachers.find({}).sort("created_at", -1))
    return jsonify({"teachers": serialize_list(rows)})


@bp.get("/stats")
@require_admin
def admin_stats():
    db = get_db()
    return jsonify(
        {
            "teachers": db.teachers.count_documents({}),
            "classes": db.classes.count_documents({}),
            "students": db.students.count_documents({}),
            "attendance_records": db.attendance.count_documents({}),
        }
    )


@bp.patch("/teachers/<teacher_id>/role")
@require_admin
def set_role(teacher_id):
    from bson import ObjectId
    from ..utils import parse_oid

    data = request.get_json(silent=True) or {}
    role = (data.get("role") or "").lower()
    if role not in ("admin", "teacher"):
        return jsonify({"error": "role must be admin or teacher"}), 400
    db = get_db()
    try:
        tid = parse_oid(teacher_id)
    except ValueError:
        return jsonify({"error": "Invalid id"}), 400
    if tid == request.teacher["_id"] and role != "admin":
        return jsonify({"error": "Cannot demote yourself"}), 400
    res = db.teachers.update_one({"_id": tid}, {"$set": {"role": role}})
    if res.matched_count == 0:
        return jsonify({"error": "Not found"}), 404
    t = db.teachers.find_one({"_id": tid})
    return jsonify({"teacher": serialize_doc(t)})
