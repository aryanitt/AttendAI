import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ChevronRight, Pencil, Plus, Trash2, Users, X } from "lucide-react";
import toast from "react-hot-toast";
import client from "../api/client.js";

const hues = [
  "from-indigo-500 to-violet-500",
  "from-violet-500 to-purple-500",
  "from-blue-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-rose-500 to-pink-500",
  "from-amber-500 to-orange-500",
];

export default function ClassesPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editClass, setEditClass] = useState(null);
  const [form, setForm] = useState({ class_name: "", subject: "", year_semester: "" });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await client.get("/classes");
      setClasses(data.classes || []);
    } catch {
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditClass(null);
    setForm({ class_name: "", subject: "", year_semester: "" });
    setShowCreate(true);
  };

  const openEdit = (c) => {
    setEditClass(c);
    setForm({ class_name: c.class_name, subject: c.subject || "", year_semester: c.year_semester || "" });
    setShowCreate(true);
  };

  const saveClass = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (editClass) {
        await client.patch(`/classes/${editClass.id}`, form);
        toast.success("Class updated");
      } else {
        await client.post("/classes", form);
        toast.success("Class created");
      }
      setShowCreate(false);
      setEditClass(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id, name) => {
    if (!window.confirm(`Delete class "${name}" and all its data? This cannot be undone.`)) return;
    try {
      await client.delete(`/classes/${id}`);
      toast.success("Class deleted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Delete failed");
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-stitch p-6 space-y-4">
            <div className="skeleton h-5 w-1/2 rounded-xl" />
            <div className="skeleton h-4 w-3/4 rounded-xl" />
            <div className="skeleton h-4 w-1/3 rounded-xl" />
            <div className="skeleton h-10 w-full rounded-2xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Your classes
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {classes.length} class{classes.length !== 1 ? "es" : ""} · click to open
          </p>
        </div>
        <button
          type="button"
          id="classes-create-btn"
          className="btn-primary"
          onClick={openCreate}
        >
          <Plus className="h-4 w-4" />
          New class
        </button>
      </div>

      {classes.length === 0 ? (
        <div className="card-stitch flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-500/10">
            <BookOpen className="h-8 w-8 text-indigo-500" />
          </div>
          <h3 className="mt-4 font-display text-lg font-semibold text-slate-900 dark:text-white">
            No classes yet
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Create your first class to get started with attendance.
          </p>
          <button type="button" className="btn-primary mt-6" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Create first class
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((c, i) => {
            const gradient = hues[i % hues.length];
            const enrolled = c.student_count || 0;
            return (
              <div
                key={c.id}
                className="card-stitch group flex flex-col overflow-hidden animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* Gradient top bar */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />

                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-lg font-bold text-slate-900 truncate dark:text-white">
                        {c.class_name}
                      </h3>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {c.subject && (
                          <span className="badge bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                            {c.subject}
                          </span>
                        )}
                        {c.year_semester && (
                          <span className="badge bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            {c.year_semester}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-ghost shrink-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => openEdit(c)}
                      aria-label="Edit class"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      {enrolled} student{enrolled !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Enrollment progress */}
                  {enrolled > 0 && (
                    <div className="mt-3 progress-bar">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-1000`}
                        style={{ width: `${Math.min(100, (enrolled / 50) * 100)}%` }}
                      />
                    </div>
                  )}

                  <div className="mt-5 flex gap-2 pt-4 border-t border-stitch-border dark:border-slate-700/80">
                    <Link
                      to={`/classes/${c.id}/live`}
                      className="btn-primary flex-1 justify-center text-sm"
                    >
                      Open
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      className="btn-ghost p-2.5 text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30"
                      onClick={() => remove(c.id, c.class_name)}
                      aria-label="Delete class"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create / Edit modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="card-stitch w-full max-w-lg p-6 shadow-stitch-lg animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                {editClass ? "Edit class" : "New class / section"}
              </h3>
              <button
                type="button"
                onClick={() => { setShowCreate(false); setEditClass(null); }}
                className="btn-ghost p-2"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={saveClass} className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Class name *
                </label>
                <input
                  id="class-form-name"
                  className="input-stitch"
                  placeholder="e.g. CSE-A, IT-B"
                  value={form.class_name}
                  onChange={(e) => setForm((f) => ({ ...f, class_name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Subject
                </label>
                <input
                  id="class-form-subject"
                  className="input-stitch"
                  placeholder="e.g. Data Structures"
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Year / Semester
                </label>
                <input
                  id="class-form-semester"
                  className="input-stitch"
                  placeholder="e.g. 2026 · Sem 4"
                  value={form.year_semester}
                  onChange={(e) => setForm((f) => ({ ...f, year_semester: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => { setShowCreate(false); setEditClass(null); }}
                >
                  Cancel
                </button>
                <button type="submit" id="class-form-submit" className="btn-primary" disabled={busy}>
                  {busy ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Saving…
                    </span>
                  ) : (
                    editClass ? "Save changes" : "Create class"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
