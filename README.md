# Smart Attendance Pro (AI-Powered)

A professional, offline-first Smart Attendance System using MTCNN, FaceNet, and MongoDB Atlas.

## 🚀 Features
- **Real-time Face Recognition**: High-speed scanning using MTCNN and FaceNet.
- **Batch Processing**: Upload group photos to mark attendance for multiple students at once.
- **Modern Dashboard**: Professional UI with dark mode, charts, and statistics.
- **Cloud Database**: Integrated with MongoDB Atlas for secure, reliable storage.
- **Exports**: Generate and download attendance reports.

## 🛠️ Tech Stack
- **Backend**: FastAPI (Python), MongoDB (Motor), MTCNN, FaceNet (TensorFlow).
- **Frontend**: React.js, Vite, Tailwind CSS, Lucide Icons.

## 📂 Structure
- `backend/`: API server and AI pipeline.
- `frontend/`: React dashboard application.
- `embeddings/`: Stored facial features (.pkl).
- `reports/`: Generated Excel reports.

## 🚦 How to Run

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```
*The server will start at http://localhost:8000. Note: The first run will download AI models (~100MB).*

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
*Access the dashboard at the URL provided by Vite (usually http://localhost:5173).*

## 📖 Usage Guide
1. **Register**: Go to "Manage Students" and upload 3-5 clear photos of a student to "train" the system.
2. **Scan**: Use "Live Camera" for real-time check-ins or "Upload Photo" for group shots.
3. **Analyze**: View daily stats on the Dashboard and full logs in the "Attendance Logs" section.
