from datetime import datetime, timezone

import numpy as np
from bson import ObjectId
from flask import Blueprint, jsonify, request

from ..auth_utils import require_auth
from ..db import get_db
from ..face_service import (
    extract_face_crops_bgr,
    get_embedding_from_bgr,
    image_bytes_to_bgr,
    load_embeddings,
    match_embedding,
)
from ..utils import parse_oid, serialize_doc

bp = Blueprint("attendance", __name__)


def _owned_class(db, class_id: str, teacher_id: ObjectId):
    try:
        cid = parse_oid(class_id)
    except ValueError:
        return None, None
    c = db.classes.find_one({"_id": cid, "teacher_id": teacher_id})
    return c, cid


def _upsert_mark(db, cid: ObjectId, sid: ObjectId, status: str = "present"):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    now = datetime.now(timezone.utc).strftime("%H:%M:%S")
    db.attendance.update_one(
        {"class_id": cid, "student_id": sid, "date": today},
        {
            "$set": {"time": now, "status": status},
            "$setOnInsert": {"class_id": cid, "student_id": sid, "date": today},
        },
        upsert=True,
    )


@bp.post("/classes/<class_id>/attendance/recognize")
@require_auth
def recognize_one(class_id):
    db = get_db()
    c, cid = _owned_class(db, class_id, request.teacher["_id"])
    if not c:
        return jsonify({"error": "Class not found"}), 404
    if "file" not in request.files:
        return jsonify({"error": "file required"}), 400
    raw = request.files["file"].read()
    if not raw:
        return jsonify({"error": "Empty file"}), 400
    try:
        bgr = image_bytes_to_bgr(raw)
        emb = get_embedding_from_bgr(bgr)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    roster = load_embeddings(str(cid))
    if not roster:
        return jsonify({"error": "No enrolled faces for this class"}), 400
    sid_str, sim = match_embedding(emb, roster)
    if not sid_str:
        return jsonify({"match": None, "confidence": float(sim), "marked": False})
    sid = ObjectId(sid_str)
    st = db.students.find_one({"_id": sid, "class_id": cid})
    if not st:
        return jsonify({"error": "Matched student not in roster"}), 400
    _upsert_mark(db, cid, sid, "present")
    return jsonify(
        {
            "match": serialize_doc(st),
            "confidence": float(sim),
            "marked": True,
        }
    )


@bp.post("/classes/<class_id>/attendance/group-photo")
@require_auth
def group_photo(class_id):
    db = get_db()
    c, cid = _owned_class(db, class_id, request.teacher["_id"])
    if not c:
        return jsonify({"error": "Class not found"}), 404
    if "file" not in request.files:
        return jsonify({"error": "file required"}), 400
    raw = request.files["file"].read()
    if not raw:
        return jsonify({"error": "Empty file"}), 400
    roster = load_embeddings(str(cid))
    if not roster:
        return jsonify({"error": "No enrolled faces for this class"}), 400
    try:
        bgr = image_bytes_to_bgr(raw)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    crops = extract_face_crops_bgr(bgr)
    if not crops:
        return jsonify({"error": "No faces detected in image"}), 400
    results = []
    seen = set()
    for crop in crops:
        try:
            emb = get_embedding_from_bgr(crop)
        except Exception:
            continue
        sid_str, sim = match_embedding(emb, roster)
        if not sid_str or sid_str in seen:
            continue
        sid = ObjectId(sid_str)
        st = db.students.find_one({"_id": sid, "class_id": cid})
        if not st:
            continue
        _upsert_mark(db, cid, sid, "present")
        seen.add(sid_str)
        results.append(
            {
                "student": serialize_doc(st),
                "confidence": float(sim),
            }
        )
    return jsonify({"marked_count": len(results), "matches": results})


@bp.get("/classes/<class_id>/attendance")
@require_auth
def list_attendance(class_id):
    db = get_db()
    c, cid = _owned_class(db, class_id, request.teacher["_id"])
    if not c:
        return jsonify({"error": "Class not found"}), 404
    q = {"class_id": cid}
    date_f = request.args.get("date")
    student_f = request.args.get("student_id")
    if date_f:
        q["date"] = date_f
    if student_f:
        try:
            q["student_id"] = parse_oid(student_f)
        except ValueError:
            return jsonify({"error": "Invalid student_id"}), 400
    rows = list(db.attendance.find(q).sort([("date", -1), ("time", -1)]))
    out = []
    for r in rows:
        st = db.students.find_one({"_id": r["student_id"]})
        item = serialize_doc(r) or {}
        item["student_name"] = st["name"] if st else ""
        item["roll_number"] = st["roll_number"] if st else ""
        out.append(item)
    return jsonify({"records": out})


@bp.post("/classes/<class_id>/attendance/manual")
@require_auth
def manual_mark(class_id):
    db = get_db()
    c, cid = _owned_class(db, class_id, request.teacher["_id"])
    if not c:
        return jsonify({"error": "Class not found"}), 404
    data = request.get_json(silent=True) or {}
    try:
        sid = parse_oid(data.get("student_id", ""))
    except ValueError:
        return jsonify({"error": "student_id required"}), 400
    st = db.students.find_one({"_id": sid, "class_id": cid})
    if not st:
        return jsonify({"error": "Student not found"}), 404
    status = (data.get("status") or "present").lower()
    if status not in ("present", "absent", "late"):
        status = "present"
    _upsert_mark(db, cid, sid, status)
    r = db.attendance.find_one(
        {
            "class_id": cid,
            "student_id": sid,
            "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        }
    )
    return jsonify({"record": serialize_doc(r)})


@bp.post("/classes/<class_id>/attendance/liveness-check")
@require_auth
def liveness_check(class_id):
    db = get_db()
    c, cid = _owned_class(db, class_id, request.teacher["_id"])
    if not c:
        return jsonify({"error": "Class not found"}), 404
    if "a" not in request.files or "b" not in request.files:
        return jsonify({"error": "Upload two frames as fields a and b"}), 400
    try:
        bgr_a = image_bytes_to_bgr(request.files["a"].read())
        bgr_b = image_bytes_to_bgr(request.files["b"].read())
        e1 = get_embedding_from_bgr(bgr_a)
        e2 = get_embedding_from_bgr(bgr_b)
    except Exception as e:
        return jsonify({"error": str(e), "pass": False}), 400
    dist = float(np.linalg.norm(e1 - e2))
    # Same person, slight movement → moderate distance; identical frames → very low
    pass_ = 0.02 < dist < 1.2
    return jsonify(
        {
            "embedding_distance": dist,
            "pass": pass_,
            "note": "Heuristic only; not a certified liveness system.",
        }
    )
