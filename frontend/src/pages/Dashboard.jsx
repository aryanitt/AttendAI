import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  ChevronRight,
  Plus,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import client from "../api/client.js";

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (value === null || value === undefined) return;
    const target = Number(value);
    const duration = 800;
    const start = Date.now();
    const startVal = 0;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(startVal + (target - startVal) * eased));
      if (progress < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current);
  }, [value]);
  return <span>{value !== null && value !== undefined ? display : "—"}</span>;
}

const statCards = (stats) => [
  {
    label: "Total Classes",
    value: stats?.total_classes,
    icon: BookOpen,
    gradient: "from-indigo-500 to-violet-500",
    bg: "bg-indigo-500/10 dark:bg-indigo-500/15",
    text: "text-indigo-600 dark:text-indigo-300",
  },
  {
    label: "Total Students",
    value: stats?.total_students,
    icon: Users,
    gradient: "from-violet-500 to-purple-500",
    bg: "bg-violet-500/10 dark:bg-violet-500/15",
    text: "text-violet-600 dark:text-violet-300",
  },
  {
    label: "Present Today",
    value: stats?.today_present_marked,
    icon: TrendingUp,
    gradient: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    text: "text-emerald-600 dark:text-emerald-300",
    sub: stats?.today_date,
  },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [comparison, setComparison] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ class_name: "", subject: "", year_semester: "" });
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  const load = async () => {
    try {
      const { data } = await client.get("/dashboard/stats");
      setStats(data);
    } catch {
      setStats(null);
    }
  };

  useEffect(() => {
    load();
    let cancelled = false;
    (async () => {
      try {
        const { data } = await client.get("/analytics/cross-class");
        if (!cancelled) setComparison(data.comparison || []);
      } catch {
        if (!cancelled) setComparison([]);
      }
    })();
    return () => { cancelled = true; };
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
      toast.success("Class created!");
      setShow(false);
      setForm({ class_name: "", subject: "", year_semester: "" });
      nav(`/classes/${data.class.id}/students`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not create class");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* ── Welcome banner ── */}
      <div className="relative overflow-hidden rounded-3xl hero-gradient p-6 sm:p-8 shadow-stitch-lg">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-12 left-1/3 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
              AttendAI Dashboard
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
              Manage your classes
            </h1>
            <p className="mt-1.5 text-sm text-white/70">
              Track attendance, recognize faces, and export reports — all from one place.
            </p>
          </div>
          <button
            type="button"
            id="dashboard-create-class"
            className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-white/20 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all active:scale-[0.97]"
            onClick={() => setShow(true)}
          >
            <Plus className="h-4 w-4" />
            New class
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {statCards(stats).map(({ label, value, icon: Icon, gradient, bg, text, sub }, i) => (
          <div
            key={label}
            className="card-stitch p-6 animate-fade-in-up"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {label}
                </p>
                <p className="mt-2 font-display text-4xl font-bold text-slate-900 dark:text-white">
                  <AnimatedNumber value={value} />
                </p>
                {sub && (
                  <p className="mt-1 text-xs text-slate-400">{sub}</p>
                )}
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${bg}`}>
                <Icon className={`h-6 w-6 ${text}`} />
              </div>
            </div>
            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              {value !== null && value !== undefined && (
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-1000`}
                  style={{ width: value > 0 ? "100%" : "0%" }}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Actions ── */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          id="dashboard-create-btn"
          className="btn-primary"
          onClick={() => setShow(true)}
        >
          <Plus className="h-4 w-4" />
          Create class
        </button>
        <Link to="/classes" className="btn-ghost">
          View all classes
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* ── Cross-class comparison ── */}
      {comparison.length > 0 && (
        <div className="card-stitch p-6 animate-fade-in-up delay-200">
          <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            Today across classes
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Side-by-side attendance rates for your sections.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {comparison.map((c) => (
              <Link
                key={c.class_id}
                to={`/classes/${c.class_id}/live`}
                className="group rounded-2xl border border-stitch-border bg-slate-50/50 p-4 transition-all hover:border-indigo-400/50 hover:shadow-stitch dark:border-slate-700 dark:bg-slate-900/40"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {c.class_name}
                  </p>
                  <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {c.present_today} / {c.students} present
                </p>
                <div className="mt-3 progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${c.rate_today_pct}%` }}
                  />
                </div>
                <p className="mt-1 text-right text-xs font-semibold text-indigo-500">
                  {c.rate_today_pct}%
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Create class modal ── */}
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="card-stitch w-full max-w-lg p-6 shadow-stitch-lg animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                New class / section
              </h3>
              <button
                type="button"
                onClick={() => setShow(false)}
                className="btn-ghost p-2"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={createClass} className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Class name *
                </label>
                <input
                  id="new-class-name"
                  className="input-stitch"
                  placeholder="e.g. CSE-A, IT-B, Physics-III"
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
                  id="new-class-subject"
                  className="input-stitch"
                  placeholder="e.g. Data Structures, Physics"
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Year / Semester
                </label>
                <input
                  id="new-class-semester"
                  className="input-stitch"
                  placeholder="e.g. 2026 · Sem 4"
                  value={form.year_semester}
                  onChange={(e) => setForm((f) => ({ ...f, year_semester: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={() => setShow(false)}>
                  Cancel
                </button>
                <button type="submit" id="new-class-submit" className="btn-primary" disabled={busy}>
                  {busy ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Creating…
                    </span>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Create class
                    </>
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
