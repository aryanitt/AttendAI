from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import connect_to_mongo, close_mongo_connection, db
from face_engine import face_engine
import cv2
import numpy as np
import io
from datetime import datetime
import pandas as pd
from typing import List
import os

app = FastAPI(title="Smart Attendance Pro API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

@app.get("/health")
async def health():
    return {"status": "ok", "db": "connected" if db.client else "disconnected"}

@app.post("/students/register")
async def register_student(name: str = Form(...), roll_number: str = Form(...), files: List[UploadFile] = File(...)):
    if len(files) < 1 or len(files) > 5:
        raise HTTPException(status_code=400, detail="Please upload between 1 and 5 photos.")
    
    # 1. Store student in MongoDB
    student = {
        "name": name,
        "roll_number": roll_number,
        "created_at": datetime.now()
    }
    await db.db.students.update_one({"roll_number": roll_number}, {"$set": student}, upsert=True)
    
    # 2. Extract embeddings
    embeddings = []
    for file in files:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None: continue
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        faces = face_engine.get_embeddings(rgb_img)
        if faces:
            embeddings.append(faces[0]['embedding'])
    
    if not embeddings:
        raise HTTPException(status_code=400, detail="No faces detected in uploaded images.")
    
    # 3. Update local embedding store
    face_engine.update_known_faces(name, embeddings)
    
    return {"message": f"Student {name} registered successfully with {len(embeddings)} samples."}

@app.get("/students")
async def list_students():
    cursor = db.db.students.find().sort("name", 1)
    students = await cursor.to_list(length=1000)
    for s in students: s["_id"] = str(s["_id"])
    return students

@app.delete("/students/{roll_number}")
async def delete_student(roll_number: str):
    student = await db.db.students.find_one({"roll_number": roll_number})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    
    # Remove from MongoDB
    await db.db.students.delete_one({"roll_number": roll_number})
    # Optional: Delete attendance
    await db.db.attendance.delete_many({"student_name": student["name"]})
    
    # Remove from Neural Engine
    face_engine.delete_student_embeddings(student["name"])
    
    return {"message": f"Student {student['name']} and their records removed."}

@app.post("/attendance/scan")
async def scan_attendance(file: UploadFile = File(...)):
    print(f"Received scan request: {file.filename}")
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        print("Error: Failed to decode image.")
        return {"detected": 0, "recorded": []}
        
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    faces = face_engine.get_embeddings(rgb_img)
    print(f"Detected {len(faces)} faces.")
    recorded = []
    
    today = datetime.now().strftime("%Y-%m-%d")
    
    for face in faces:
        name, dist = face_engine.recognize(face['embedding'])
        print(f"Recognition: {name} (Dist: {dist:.4f})")
        if name != "Unknown":
            log = {
                "student_name": name,
                "date": today,
                "time": datetime.now().strftime("%H:%M:%S"),
                "confidence": float(face['confidence'])
            }
            existing = await db.db.attendance.find_one({"student_name": name, "date": today})
            if not existing:
                await db.db.attendance.insert_one(log)
                recorded.append(name)
    
    return {"detected": len(faces), "recorded": recorded}

@app.get("/attendance/logs")
async def get_logs(date: str = None):
    query = {"date": date} if date else {}
    cursor = db.db.attendance.find(query).sort("time", -1)
    logs = await cursor.to_list(length=1000)
    for log in logs:
        log["_id"] = str(log["_id"])
    return logs

@app.get("/stats")
async def get_stats():
    today = datetime.now().strftime("%Y-%m-%d")
    total_students = await db.db.students.count_documents({})
    present_today = await db.db.attendance.count_documents({"date": today})
    
    return {
        "total_students": total_students,
        "present_today": present_today,
        "absent_today": max(0, total_students - present_today),
        "attendance_rate": (present_today / total_students * 100) if total_students > 0 else 0
    }

from fastapi.responses import StreamingResponse

@app.get("/attendance/export")
async def export_attendance():
    cursor = db.db.attendance.find().sort("date", -1)
    logs = await cursor.to_list(length=5000)
    
    if not logs:
        raise HTTPException(status_code=404, detail="No logs found to export.")
    
    # Clean data for Excel
    data = []
    for log in logs:
        data.append({
            "Student Name": log.get("student_name"),
            "Date": log.get("date"),
            "Time": log.get("time"),
            "Confidence": f"{log.get('confidence', 0)*100:.2f}%"
        })
    
    df = pd.DataFrame(data)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Attendance')
    
    output.seek(0)
    
    headers = {
        'Content-Disposition': 'attachment; filename="attendance_report.xlsx"'
    }
    return StreamingResponse(output, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

@app.get("/attendance/export/student/{student_name}")
async def export_student_attendance(student_name: str):
    cursor = db.db.attendance.find({"student_name": student_name}).sort("date", -1)
    logs = await cursor.to_list(length=1000)
    
    if not logs:
        raise HTTPException(status_code=404, detail="No attendance logs found for this student.")
        
    df = pd.DataFrame(logs)
    # Remove MongoDB ID
    if "_id" in df.columns:
        df = df.drop(columns=["_id"])
    
    # Reorder columns for better look
    cols = ["student_name", "date", "time", "confidence"]
    df = df[cols]
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name=f"{student_name}_History")
    
    output.seek(0)
    headers = {
        'Content-Disposition': f'attachment; filename="Attendance_{student_name}.xlsx"'
    }
    return StreamingResponse(output, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
