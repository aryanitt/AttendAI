# Smart Attendance — Multi-class face recognition

Local-first attendance for teachers: multiple isolated classes, MongoDB storage, per-class face embeddings (pickle), and a React dashboard styled with a clean “Stitch-like” UI (soft surfaces, rounded cards, indigo/violet accents, dark mode).

**Stack (free / open source):**

- **Backend:** Flask, PyMongo, JWT (Bearer), bcrypt, DeepFace (Facenet) + OpenCV Haar for multi-face crops, openpyxl
- **Frontend:** Vite, React 19, React Router 7, Tailwind CSS, react-webcam, Recharts, axios
- **Database:** MongoDB

Design reference: [Stitch preview](https://stitch.withgoogle.com/preview/153073985745296876?node-id=5854249894004a9ab1c9cbc60b0685a4) (layout and polish aligned to that aesthetic; exact tokens depend on your Stitch export).

---

## Prerequisites

- Python 3.10+ recommended  
- Node.js 18+  
- MongoDB running locally (`mongodb://localhost:27017`) or Atlas URI  
- Webcam (for live attendance)

---

## 1. MongoDB

Install and start MongoDB, or use Atlas. Create a database name in the URI (default: `smart_attendance_db`):

```text
mongodb://localhost:27017/smart_attendance_db
```

### MongoDB Atlas troubleshooting

1. **Test the URI** (from the `backend` folder): `python scripts/check_mongo.py`  
   - **“bad auth”** means the **database username or password in `MONGO_URI` does not match** Atlas. Open **Atlas → Database Access**, confirm the **username** is exactly what appears before the first `:` in the URI, then **Edit password** and paste the new password into `backend/.env`.  
   - Characters like `@ : / ? #` in the password must be **URL-encoded** in the connection string (e.g. `@` → `%40`).  
2. **Network Access:** **Atlas → Network Access** must allow your PC (your IP) or, for quick tests only, `0.0.0.0/0`.  
3. **SRV:** Install **`dnspython`**: `pip install dnspython`  
4. With the API running, open **http://127.0.0.1:5000/api/health/db** — it returns JSON explaining whether MongoDB accepted the connection.

---

## 2. Backend setup

```powershell
cd MultiClass_Face_Attendance\backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and set secrets:

```powershell
copy .env.example .env
```

Edit `JWT_SECRET`, `SECRET_KEY`, and `MONGO_URI` as needed.

Run API:

```powershell
python run.py
```

Server: `http://127.0.0.1:5000` — health: `GET /api/health`

**Note:** First registered user becomes **admin**; later signups are **teachers**. Admins can view global stats and change roles under **Settings**.

**Face models:** DeepFace downloads weights on first use (internet required once). TensorFlow installs with DeepFace; first run can take a few minutes.

---

## 3. Frontend setup

```powershell
cd MultiClass_Face_Attendance\frontend
npm install
npm run dev
```

App: `http://localhost:5173` — Vite proxies `/api` to the Flask server.

---

## 4. Data model (MongoDB)

| Collection    | Purpose |
|---------------|---------|
| `teachers`    | `name`, `email`, `password_hash`, `role` (`admin` / `teacher`) |
| `classes`     | `teacher_id`, `class_name`, `subject`, `year_semester` |
| `students`    | `class_id`, `name`, `roll_number`, `has_face`, optional `face_enrolled_at` |
| `attendance`  | `class_id`, `student_id`, `date` (YYYY-MM-DD), `time`, `status` |

Unique indexes: teacher email; `(class_id, roll_number)`; `(class_id, student_id, date)` for attendance.

---

## 5. Per-class face isolation

- Embeddings file: `backend/data/embeddings/<class_id>.pkl`  
- Reference photos: `backend/data/uploads/<class_id>/<student_id>.jpg`  

Only the selected class’s pickle is loaded when recognizing faces, so students in other classes are never matched.

Tune similarity with `FACE_THRESHOLD` in `.env` (cosine similarity, higher = stricter).

---

## 6. API overview

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Teacher signup |
| POST | `/api/auth/login` | JWT |
| GET | `/api/auth/me` | Current user |
| GET | `/api/dashboard/stats` | Totals + today’s present count |
| GET/POST | `/api/classes` | List / create |
| GET/PATCH/DELETE | `/api/classes/:id` | Class CRUD |
| GET/POST | `/api/classes/:id/students` | Students |
| PATCH/DELETE | `/api/classes/:id/students/:sid` | Update / delete |
| POST | `/api/classes/:id/students/:sid/enroll-face` | Multipart `file` |
| POST | `/api/classes/:id/attendance/recognize` | Single face image |
| POST | `/api/classes/:id/attendance/group-photo` | Class photo, multiple faces |
| GET | `/api/classes/:id/attendance?date=&student_id=` | Filtered records |
| POST | `/api/classes/:id/attendance/manual` | JSON `student_id`, `status` |
| POST | `/api/classes/:id/attendance/liveness-check` | Two frames `a`, `b` (heuristic) |
| GET | `/api/classes/:id/reports/daily` | Excel |
| GET | `/api/classes/:id/reports/monthly?month=YYYY-MM` | Excel |
| GET | `/api/classes/:id/reports/student/:sid` | Excel |
| GET | `/api/classes/:id/analytics/summary` | 14-day bar data + today rate |
| GET | `/api/analytics/cross-class` | Compare classes (same teacher) |
| GET | `/api/admin/stats` | Admin |
| GET | `/api/admin/teachers` | Admin |
| PATCH | `/api/admin/teachers/:id/role` | Admin |

Authorize with header: `Authorization: Bearer <token>`.

---

## 7. Optional: email alerts

Set `SMTP_*` variables in `.env` (see `.env.example`). The codebase includes a small helper for future hooks; wire it from attendance routes if you want mail on each mark.

---

## 8. Production notes

- Use a strong `JWT_SECRET` and HTTPS.  
- Prefer `gunicorn` or `waitress` behind a reverse proxy instead of Flask `debug=True`.  
- Serve the built frontend (`npm run build`) as static files or from a CDN; align `CORS_ORIGINS` with your domain.

---

## License

Use and modify freely for educational and institutional projects; respect licenses of dependencies (TensorFlow, DeepFace, MongoDB, etc.).
