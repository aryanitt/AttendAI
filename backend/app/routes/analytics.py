from collections import defaultdict
from datetime import datetime, timedelta, timezone

from bson import ObjectId
from flask import Blueprint, jsonify, request

from ..auth_utils import require_auth
from ..db import get_db
from ..utils import parse_oid

bp = Blueprint("analytics", __name__)


def _owned_class(db, class_id: str, teacher_id: ObjectId):
    try:
        cid = parse_oid(class_id)
    except ValueError:
        return None, None
    c = db.classes.find_one({"_id": cid, "teacher_id": teacher_id})
    return c, cid


@bp.get("/classes/<class_id>/analytics/summary")
@require_auth
def class_analytics(class_id):
    db = get_db()
    c, cid = _owned_class(db, class_id, request.teacher["_id"])
    if not c:
        return jsonify({"error": "Class not found"}), 404
    students = list(db.students.find({"class_id": cid}))
    total = len(students)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    present_today = db.attendance.count_documents(
        {
            "class_id": cid,
            "date": today,
            "status": {"$in": ["present", "late"]},
        }
    )
    # Last 14 days trend
    start = (datetime.now(timezone.utc) - timedelta(days=13)).strftime("%Y-%m-%d")
    recs = list(
        db.attendance.find(
            {
                "class_id": cid,
                "date": {"$gte": start},
                "status": {"$in": ["present", "late"]},
            }
        )
    )
    by_day: dict[str, int] = defaultdict(int)
    for r in recs:
        by_day[r["date"]] += 1
    trend = [{"date": d, "present_count": by_day[d]} for d in sorted(by_day.keys())]
    rate_today = (present_today / total * 100) if total else 0.0
    return jsonify(
        {
            "total_students": total,
            "present_today": present_today,
            "attendance_rate_today_pct": round(rate_today, 2),
            "trend_14d": trend,
        }
    )


@bp.get("/analytics/cross-class")
@require_auth
def cross_class():
    db = get_db()
    tid = request.teacher["_id"]
    classes = list(db.classes.find({"teacher_id": tid}))
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    out = []
    for c in classes:
        cid = c["_id"]
        n = db.students.count_documents({"class_id": cid})
        p = db.attendance.count_documents(
            {
                "class_id": cid,
                "date": today,
                "status": {"$in": ["present", "late"]},
            }
        )
        out.append(
            {
                "class_id": str(cid),
                "class_name": c.get("class_name"),
                "students": n,
                "present_today": p,
                "rate_today_pct": round((p / n * 100) if n else 0, 2),
            }
        )
    return jsonify({"comparison": out})
