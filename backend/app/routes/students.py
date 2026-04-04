import os
from datetime import datetime, timezone

from bson import ObjectId
from flask import Blueprint, current_app, jsonify, request

from ..auth_utils import require_auth
from ..db import get_db
from ..face_service import enroll_student_face, remove_student_embedding
from ..utils import parse_oid, serialize_doc, serialize_list

bp = Blueprint("students", __name__)


def _owned_class(db, class_id: str, teacher_id: ObjectId):
    try:
        cid = parse_oid(class_id)
    except ValueError:
        return None
    return db.classes.find_one({"_id": cid, "teacher_id": teacher_id}), cid


@bp.get("/classes/<class_id>/students")
@require_auth
def list_students(class_id):
    db = get_db()
    c, cid = _owned_class(db, class_id, request.teacher["_id"])
    if not c:
        return jsonify({"error": "Class not found"}), 404
    rows = list(db.students.find({"class_id": cid}).sort("roll_number", 1))
    return jsonify({"students": serialize_list(rows)})


@bp.post("/classes/<class_id>/students")
@require_auth
def create_student(class_id):
    db = get_db()
    c, cid = _owned_class(db, class_id, request.teacher["_id"])
    if not c:
        return jsonify({"error": "Class not found"}), 404
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    roll = (data.get("roll_number") or data.get("roll") or "").strip()
    if not name or not roll:
        return jsonify({"error": "Name and roll_number required"}), 400
    if db.students.find_one({"class_id": cid, "roll_number": roll}):
        return jsonify({"error": "Roll number already exists in this class"}), 409
    doc = {
        "class_id": cid,
        "name": name,
        "roll_number": roll,
        "has_face": False,
        "created_at": datetime.now(timezone.utc),
    }
    res = db.students.insert_one(doc)
    doc["_id"] = res.inserted_id
    return jsonify({"student": serialize_doc(doc)}), 201


@bp.patch("/classes/<class_id>/students/<student_id>")
@require_auth
def patch_student(class_id, student_id):
    db = get_db()
    c, cid = _owned_class(db, class_id, request.teacher["_id"])
    if not c:
        return jsonify({"error": "Class not found"}), 404
    try:
        sid = parse_oid(student_id)
    except ValueError:
        return jsonify({"error": "Invalid student id"}), 400
    st = db.students.find_one({"_id": sid, "class_id": cid})
    if not st:
        return jsonify({"error": "Student not found"}), 404
    data = request.get_json(silent=True) or {}
    updates = {}
    if "name" in data:
        updates["name"] = str(data["name"]).strip()
    if "roll_number" in data:
        new_roll = str(data["roll_number"]).strip()
        other = db.students.find_one(
            {"class_id": cid, "roll_number": new_roll, "_id": {"$ne": sid}}
        )
        if other:
            return jsonify({"error": "Roll number already in use"}), 409
        updates["roll_number"] = new_roll
    if updates:
        updates["updated_at"] = datetime.now(timezone.utc)
        db.students.update_one({"_id": sid}, {"$set": updates})
    st = db.students.find_one({"_id": sid})
    return jsonify({"student": serialize_doc(st)})


@bp.delete("/classes/<class_id>/students/<student_id>")
@require_auth
def delete_student(class_id, student_id):
    db = get_db()
    c, cid = _owned_class(db, class_id, request.teacher["_id"])
    if not c:
        return jsonify({"error": "Class not found"}), 404
    try:
        sid = parse_oid(student_id)
    except ValueError:
        return jsonify({"error": "Invalid student id"}), 400
    st = db.students.find_one({"_id": sid, "class_id": cid})
    if not st:
        return jsonify({"error": "Student not found"}), 404
    db.attendance.delete_many({"class_id": cid, "student_id": sid})
    db.students.delete_one({"_id": sid})
    remove_student_embedding(str(cid), str(sid))
    folder = os.path.join(current_app.config["UPLOAD_ROOT"], str(cid))
    for ext in (".jpg", ".jpeg", ".png", ".webp"):
        p = os.path.join(folder, f"{sid}{ext}")
        if os.path.isfile(p):
            os.remove(p)
    return jsonify({"ok": True})


@bp.post("/classes/<class_id>/students/<student_id>/enroll-face")
@require_auth
def enroll_face(class_id, student_id):
    db = get_db()
    c, cid = _owned_class(db, class_id, request.teacher["_id"])
    if not c:
        return jsonify({"error": "Class not found"}), 404
    try:
        sid = parse_oid(student_id)
    except ValueError:
        return jsonify({"error": "Invalid student id"}), 400
    st = db.students.find_one({"_id": sid, "class_id": cid})
    if not st:
        return jsonify({"error": "Student not found"}), 404
    if "file" not in request.files:
        return jsonify({"error": "file(s) required (multipart)"}), 400
        
    fs = request.files.getlist("file")
    if not fs or len(fs) > 4:
        return jsonify({"error": "Please upload between 1 and 4 photos"}), 400
        
    raw_list = []
    for f in fs:
        raw = f.read()
        if raw:
            raw_list.append(raw)
            
    if not raw_list:
        return jsonify({"error": "Empty file(s)"}), 400
        
    try:
        enroll_student_face(str(cid), str(sid), raw_list)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Face processing failed: {e!s}"}), 400
        
    # Save the first one as the profile shot
    os.makedirs(os.path.join(current_app.config["UPLOAD_ROOT"], str(cid)), exist_ok=True)
    path = os.path.join(current_app.config["UPLOAD_ROOT"], str(cid), f"{sid}.jpg")
    with open(path, "wb") as out:
        out.write(raw_list[0])
        
    db.students.update_one(
        {"_id": sid},
        {
            "$set": {
                "has_face": True,
                "face_enrolled_at": datetime.now(timezone.utc),
            }
        },
    )
    st = db.students.find_one({"_id": sid})
    return jsonify({"student": serialize_doc(st), "ok": True})
