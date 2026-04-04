import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import client from "../../api/client.js";

export default function StudentsPage() {
  const { classId } = useParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", roll_number: "" });

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

  useEffect(() => {
    load();
  }, [classId]);

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

  const enroll = async (studentId, e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (files.length > 4) {
      toast.error("Maximum 4 photos allowed");
      e.target.value = "";
      return;
    }
    
    const fd = new FormData();
    files.forEach(f => fd.append("file", f));
    
    const tId = toast.loading(`Enrolling face(s) - Processing ${files.length} images...`);
    try {
      await client.post(
        `/classes/${classId}/students/${studentId}/enroll-face`,
        fd
      );
      toast.success("Biometrics enrolled successfully", { id: tId });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Enrollment failed", { id: tId });
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
          Students in this class
        </h3>
        <button
          type="button"
          className="btn-primary text-sm"
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

      <div className="card-stitch overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-stitch-border text-xs uppercase text-slate-500 dark:border-slate-700">
            <tr>
              <th className="px-4 py-3">Roll</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Face</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            ) : (
              rows.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-stitch-border/60 dark:border-slate-800"
                >
                  <td className="px-4 py-3 font-mono text-xs">{s.roll_number}</td>
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">
                    {s.has_face ? (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                        Enrolled
                      </span>
                    ) : (
                      <label className="group cursor-pointer text-xs font-medium text-indigo-500 hover:text-indigo-600">
                        Upload face(s)
                        <span className="ml-1 text-[10px] text-slate-400 opacity-0 transition group-hover:opacity-100">
                          (up to 4)
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(ev) => enroll(s.id, ev)}
                        />
                      </label>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="btn-ghost mr-1 p-2 text-xs"
                      onClick={() => startEdit(s)}
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="btn-ghost p-2 text-xs text-rose-500 hover:bg-rose-500/10"
                      onClick={() => remove(s.id, s.name)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card-stitch w-full max-w-md p-6 shadow-stitch-lg">
            <h4 className="font-display text-lg font-semibold">
              {editId ? "Edit student" : "Add student"}
            </h4>
            <form onSubmit={save} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium">Name</label>
                <input
                  className="input-stitch"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">
                  Roll number
                </label>
                <input
                  className="input-stitch"
                  value={form.roll_number}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, roll_number: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    setShow(false);
                    setEditId(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
