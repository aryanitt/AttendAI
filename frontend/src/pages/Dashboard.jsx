import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Plus, Users } from "lucide-react";
import toast from "react-hot-toast";
import client from "../api/client.js";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [comparison, setComparison] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({
    class_name: "",
    subject: "",
    year_semester: "",
  });
  const [busy, setBusy] = useState(false);

  const [error, setError] = useState(false);

  const load = async () => {
    try {
      const { data } = await client.get("/dashboard/stats");
      setStats(data);
      setError(false);
    } catch {
      setStats(null);
      setError(true);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await client.get("/analytics/cross-class");
        if (!cancelled) setComparison(data.comparison || []);
      } catch {
        if (!cancelled) setComparison([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (window.location.hash === "#create") {
      setShow(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const createClass = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await client.post("/classes", form);
      toast.success("Class created");
      setShow(false);
      setForm({ class_name: "", subject: "", year_semester: "" });
      await load();
      window.location.href = `/classes/${data.class.id}/live`;
    } catch (err) {
      console.error("FULL ERROR OBJECT:", err);
      if (err.response) {
        console.error("ERROR RESPONSE:", err.response.data);
      }
      toast.error(err.response?.data?.error || "Could not create class");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4 dark:border-red-500/20 dark:bg-red-500/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
              <span className="text-lg font-bold">!</span>
            </div>
            <div>
              <h3 className="font-display font-semibold text-red-900 dark:text-red-400">
                Server Connection Error
              </h3>
              <p className="text-sm text-red-700/80 dark:text-red-400/60">
                Cannot connect to the backend. Please ensure the Python server is running (python run.py).
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card-stitch p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Classes
          </p>
          <p className="mt-2 font-display text-3xl font-semibold text-slate-900 dark:text-white">
            {stats?.total_classes ?? "—"}
          </p>
          <BookOpen className="mt-4 h-8 w-8 text-indigo-400" />
        </div>
        <div className="card-stitch p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Students (all classes)
          </p>
          <p className="mt-2 font-display text-3xl font-semibold text-slate-900 dark:text-white">
            {stats?.total_students ?? "—"}
          </p>
          <Users className="mt-4 h-8 w-8 text-violet-400" />
        </div>
        <div className="card-stitch p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Present today (marked)
          </p>
          <p className="mt-2 font-display text-3xl font-semibold text-slate-900 dark:text-white">
            {stats?.today_present_marked ?? "—"}
          </p>
          <p className="mt-2 text-xs text-slate-500">{stats?.today_date}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn-primary" onClick={() => setShow(true)}>
          <Plus className="h-4 w-4" />
          Create class
        </button>
        <Link to="/classes" className="btn-ghost">
          View all classes
        </Link>
      </div>

      {comparison.length > 0 && (
        <div className="card-stitch p-6">
          <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            Today across classes
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Side-by-side attendance rates for your sections (same day).
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {comparison.map((c) => (
              <Link
                key={c.class_id}
                to={`/classes/${c.class_id}/live`}
                className="rounded-2xl border border-stitch-border bg-white/60 p-4 transition hover:border-indigo-400/50 dark:border-slate-700 dark:bg-slate-900/40"
              >
                <p className="font-medium text-slate-900 dark:text-white">
                  {c.class_name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {c.present_today} / {c.students} present · {c.rate_today_pct}%
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card-stitch max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 shadow-stitch-lg">
            <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
              New class / section
            </h3>
            <form onSubmit={createClass} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium">Class name *</label>
                <input
                  className="input-stitch"
                  placeholder="e.g. CSE-A"
                  value={form.class_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, class_name: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Subject</label>
                <input
                  className="input-stitch"
                  value={form.subject}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, subject: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">
                  Year / semester
                </label>
                <input
                  className="input-stitch"
                  placeholder="e.g. 2026 · Sem 4"
                  value={form.year_semester}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, year_semester: e.target.value }))
                  }
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShow(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={busy}>
                  {busy ? "Saving…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
