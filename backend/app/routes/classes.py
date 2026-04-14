import os
import shutil
from datetime import datetime, timezone

from bson import ObjectId
from flask import Blueprint, current_app, jsonify, request

from ..auth_utils import require_auth
from ..db import get_db
from ..face_service import embedding_path
from ..utils import parse_oid, serialize_doc

bp = Blueprint("classes", __name__)


def _class_owned(db, class_id: ObjectId, teacher_id: ObjectId):
    return db.classes.find_one({"_id": class_id, "teacher_id": teacher_id})


@bp.get("")
@require_auth
def list_classes():
    db = get_db()
    tid = request.teacher["_id"]
    rows = list(db.classes.find({"teacher_id": tid}).sort("created_at", -1))
    out = []
    for c in rows:
        cid = c["_id"]
        n = db.students.count_documents({"class_id": cid})
        item = serialize_doc(c) or {}
        item["student_count"] = n
        out.append(item)
    return jsonify({"classes": out})


@bp.post("")
@require_auth
def create_class():
    data = request.get_json(silent=True) or {}
    name = (data.get("class_name") or data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "Class name is required"}), 400
    subject = (data.get("subject") or "").strip() or None
    year_semester = (data.get("year_semester") or data.get("semester") or "").strip()
    db = get_db()
    doc = {
        "teacher_id": request.teacher["_id"],
        "class_name": name,
        "subject": subject,
        "year_semester": year_semester or None,
        "created_at": datetime.now(timezone.utc),
    }
    res = db.classes.insert_one(doc)
    doc["_id"] = res.inserted_id
    return jsonify({"class": serialize_doc(doc)}), 201


@bp.get("/<class_id>")
@require_auth
def get_class(class_id):
    db = get_db()
    try:
        cid = parse_oid(class_id)
    except ValueError:
        return jsonify({"error": "Invalid class id"}), 400
    c = _class_owned(db, cid, request.teacher["_id"])
    if not c:
        return jsonify({"error": "Not found"}), 404
    item = serialize_doc(c) or {}
    item["student_count"] = db.students.count_documents({"class_id": cid})
    return jsonify({"class": item})


@bp.patch("/<class_id>")
@require_auth
def patch_class(class_id):
    db = get_db()
    try:
        cid = parse_oid(class_id)
    except ValueError:
        return jsonify({"error": "Invalid class id"}), 400
    c = _class_owned(db, cid, request.teacher["_id"])
    if not c:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json(silent=True) or {}
    updates = {}
    if "class_name" in data:
        updates["class_name"] = str(data["class_name"]).strip()
    if "subject" in data:
        updates["subject"] = (str(data["subject"]).strip() or None)
    if "year_semester" in data:
        updates["year_semester"] = (str(data["year_semester"]).strip() or None)
    if updates:
        updates["updated_at"] = datetime.now(timezone.utc)
        db.classes.update_one({"_id": cid}, {"$set": updates})
    c = db.classes.find_one({"_id": cid})
    return jsonify({"class": serialize_doc(c)})


@bp.delete("/<class_id>")
@require_auth
def delete_class(class_id):
    db = get_db()
    try:
        cid = parse_oid(class_id)
    except ValueError:
        return jsonify({"error": "Invalid class id"}), 400
    c = _class_owned(db, cid, request.teacher["_id"])
    if not c:
        return jsonify({"error": "Not found"}), 404
    db.students.delete_many({"class_id": cid})
    db.attendance.delete_many({"class_id": cid})
    db.classes.delete_one({"_id": cid})
    ep = embedding_path(str(cid))
    if os.path.isfile(ep):
        os.remove(ep)
    folder = os.path.join(current_app.config["UPLOAD_ROOT"], str(cid))
    if os.path.isdir(folder):
        shutil.rmtree(folder, ignore_errors=True)
    return jsonify({"ok": True})
