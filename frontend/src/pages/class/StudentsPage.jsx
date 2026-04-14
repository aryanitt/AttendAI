import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Webcam from "react-webcam";
import { Camera, Pencil, Trash2, Upload, UserPlus, X } from "lucide-react";
import client from "../../api/client.js";

export default function StudentsPage() {
  const { classId } = useParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", roll_number: "" });
  const [enrollId, setEnrollId] = useState(null); // studentId for webcam enrollment
  const [enrollBusy, setEnrollBusy] = useState(false);
  const camRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await client.get(`/classes/${classId}/students`);
      setRows(data.students || []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [classId]);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await client.patch(`/classes/${classId}/students/${editId}`, form);
        toast.success("Student updated");
      } else {
        await client.post(`/classes/${classId}/students`, form);
        toast.success("Student added");
      }
      setShow(false);
      setEditId(null);
      setForm({ name: "", roll_number: "" });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Save failed");
    }
  };

  const startEdit = (s) => {
    setEditId(s.id);
    setForm({ name: s.name, roll_number: s.roll_number });
    setShow(true);
  };

  const remove = async (id, name) => {
    if (!window.confirm(`Remove ${name} from this class?`)) return;
    try {
      await client.delete(`/classes/${classId}/students/${id}`);
      toast.success("Student removed");
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Delete failed");
    }
  };

  const enrollFile = async (studentId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await doEnroll(studentId, file);
    e.target.value = "";
  };

  const enrollCapture = useCallback(async () => {
    const shot = camRef.current?.getScreenshot();
    if (!shot) { toast.error("Camera not ready"); return; }
    setEnrollBusy(true);
    try {
      const blob = await (await fetch(shot)).blob();
      const file = new File([blob], "webcam.jpg", { type: "image/jpeg" });
      await doEnroll(enrollId, file);
      setEnrollId(null);
    } finally {
      setEnrollBusy(false);
    }
  }, [enrollId]);

  const doEnroll = async (studentId, file) => {
    const fd = new FormData();
    fd.append("file", file);
    try {
      await client.post(
        `/classes/${classId}/students/${studentId}/enroll-face`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      toast.success("Face enrolled ✓");
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Enrollment failed");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
            Students
          </h3>
          <p className="mt-0.5 text-sm text-slate-500">
            {rows.length} enrolled · click "Upload face" to enable recognition
          </p>
        </div>
        <button
          type="button"
          id="add-student-btn"
          className="btn-primary"
          onClick={() => {
            setEditId(null);
            setForm({ name: "", roll_number: "" });
            setShow(true);
          }}
        >
          <UserPlus className="h-4 w-4" />
          Add student
        </button>
      </div>

      {/* ── Table ── */}
      <div className="card-stitch overflow-x-auto">
        <table className="table-stitch min-w-[640px]">
          <thead>
            <tr>
              <th>Roll</th>
              <th>Name</th>
              <th>Face</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3].map((i) => (
                <tr key={i}>
                  <td colSpan={4}>
                    <div className="skeleton mx-4 my-2 h-8 rounded-xl" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-slate-500">
                  No students yet. Add your first student above.
                </td>
              </tr>
            ) : (
              rows.map((s) => (
                <tr key={s.id}>
                  <td>
                    <span className="font-mono text-xs text-slate-500">{s.roll_number}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/80 to-violet-500/80 font-display text-sm font-bold text-white">
                        {s.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white">{s.name}</span>
                    </div>
                  </td>
                  <td>
                    {s.has_face ? (
                      <div className="flex items-center gap-2">
                        <span className="badge-enrolled">
                          <Camera className="h-3 w-3" />
                          Enrolled
                        </span>
                        {s.face_enrolled_at && (
                          <span className="hidden text-xs text-slate-400 sm:inline">
                            {new Date(s.face_enrolled_at).toLocaleDateString()}
                          </span>
                        )}
                        {/* Re-enroll option */}
                        <label className="cursor-pointer text-xs text-indigo-500 hover:underline">
                          Update
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(ev) => enrollFile(s.id, ev)}
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-500/15 transition-colors dark:text-indigo-300">
                          <Upload className="h-3.5 w-3.5" />
                          Upload face
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(ev) => enrollFile(s.id, ev)}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setEnrollId(s.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-stitch-border px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors dark:hover:bg-slate-800/60"
                          title="Use webcam"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          Webcam
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      className="btn-ghost mr-1 p-2"
                      onClick={() => startEdit(s)}
                      aria-label="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="btn-danger p-2"
                      onClick={() => remove(s.id, s.name)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Add / Edit student modal ── */}
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="card-stitch w-full max-w-md p-6 shadow-stitch-lg animate-scale-in">
            <div className="flex items-center justify-between">
              <h4 className="font-display text-lg font-semibold">
                {editId ? "Edit student" : "Add student"}
              </h4>
              <button type="button" className="btn-ghost p-2" onClick={() => { setShow(false); setEditId(null); }}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={save} className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Full name
                </label>
                <input
                  id="student-form-name"
                  className="input-stitch"
                  placeholder="e.g. Arjun Sharma"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Roll number
                </label>
                <input
                  id="student-form-roll"
                  className="input-stitch font-mono"
                  placeholder="e.g. CSE2401"
                  value={form.roll_number}
                  onChange={(e) => setForm((f) => ({ ...f, roll_number: e.target.value }))}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="btn-ghost" onClick={() => { setShow(false); setEditId(null); }}>
                  Cancel
                </button>
                <button type="submit" id="student-form-submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Webcam face enrollment modal ── */}
      {enrollId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="card-stitch w-full max-w-lg p-6 shadow-stitch-lg animate-scale-in">
            <div className="flex items-center justify-between">
              <h4 className="font-display text-lg font-semibold">
                Webcam face enrollment
              </h4>
              <button type="button" className="btn-ghost p-2" onClick={() => setEnrollId(null)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1.5 text-sm text-slate-500">
              Ask the student to look directly at the camera, then capture.
            </p>
            <div className="mt-4 overflow-hidden rounded-2xl bg-slate-950">
              <Webcam
                ref={camRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "user", width: 480, height: 360 }}
                className="w-full"
              />
            </div>
            <div className="mt-4 flex gap-3">
              <button type="button" className="btn-ghost flex-1" onClick={() => setEnrollId(null)}>
                Cancel
              </button>
              <button
                type="button"
                id="webcam-enroll-capture"
                className="btn-primary flex-1"
                onClick={enrollCapture}
                disabled={enrollBusy}
              >
                {enrollBusy ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Enrolling…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Capture &amp; enroll
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
