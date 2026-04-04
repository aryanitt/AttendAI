from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from ..auth_utils import require_auth
from ..db import get_db

bp = Blueprint("dashboard", __name__)


def _today_str():
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


@bp.get("/stats")
@require_auth
def stats():
    db = get_db()
    tid = request.teacher["_id"]
    classes = list(db.classes.find({"teacher_id": tid}))
    class_ids = [c["_id"] for c in classes]
    total_classes = len(classes)
    total_students = 0
    if class_ids:
        total_students = db.students.count_documents({"class_id": {"$in": class_ids}})
    today = _today_str()
    present_today = 0
    if class_ids:
        present_today = db.attendance.count_documents(
            {
                "class_id": {"$in": class_ids},
                "date": today,
                "status": {"$in": ["present", "late"]},
            }
        )
    return jsonify(
        {
            "total_classes": total_classes,
            "total_students": total_students,
            "today_present_marked": present_today,
            "today_date": today,
        }
    )
