import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  ChevronRight,
  Plus,
  TrendingUp,
  Users,
  X,
  Zap,
  LayoutGrid,
} from "lucide-react";
import toast from "react-hot-toast";
import client from "../api/client.js";
import { swrFetch, cacheDelete } from "../lib/cache.js";

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (value === null || value === undefined) return;
    const target = Number(value);
    const duration = 800;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round((target) * eased));
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
    glow: "shadow-indigo-500/20",
    iconBg: "bg-indigo-500/15 border-indigo-500/20",
    iconColor: "text-indigo-400",
    bar: "from-indigo-500 to-violet-500",
  },
  {
    label: "Total Students",
    value: stats?.total_students,
    icon: Users,
    gradient: "from-violet-500 to-purple-500",
    glow: "shadow-violet-500/20",
    iconBg: "bg-violet-500/15 border-violet-500/20",
    iconColor: "text-violet-400",
    bar: "from-violet-500 to-purple-500",
  },
  {
    label: "Present Today",
    value: stats?.today_present_marked,
    icon: TrendingUp,
    gradient: "from-emerald-500 to-teal-500",
    glow: "shadow-emerald-500/20",
    iconBg: "bg-emerald-500/15 border-emerald-500/20",
    iconColor: "text-emerald-400",
    bar: "from-emerald-500 to-teal-500",
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

  useEffect(() => {
    // Dashboard stats — cached for instant display
    swrFetch(
      "dashboard_stats",
      async () => { const { data } = await client.get("/dashboard/stats"); return data; },
      (data) => setStats(data),
      3 * 60 * 1000 // 3 min TTL
    );

    // Cross-class comparison — cached separately
    swrFetch(
      "cross_class",
      async () => { const { data } = await client.get("/analytics/cross-class"); return data.comparison || []; },
      (data) => setComparison(data),
      3 * 60 * 1000
    );
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
      // Invalidate dashboard cache so it refreshes on next visit
      cacheDelete("dashboard_stats");
      cacheDelete("cross_class");
      cacheDelete("class_list");
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
    <div className="space-y-6 animate-fade-in-up">

      {/* ── Hero welcome banner ── */}
      <div className="relative overflow-hidden rounded-3xl p-7 shadow-2xl"
        style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%)" }}>
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }} />
        {/* Glow blobs */}
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="absolute -bottom-8 left-1/3 h-32 w-32 rounded-full bg-violet-400/20 blur-2xl" />
        <div className="absolute right-1/3 top-1/2 h-24 w-24 rounded-full bg-cyan-400/10 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-400/10 px-3 py-1 mb-3">
              <Zap className="h-3.5 w-3.5 text-indigo-300" />
              <span className="text-xs font-medium text-indigo-300">AttendAI Dashboard</span>
            </div>
            <h1 className="font-display text-3xl font-black text-white sm:text-4xl">
              Manage your classes
            </h1>
            <p className="mt-2 text-sm text-white/60 max-w-md">
              Track attendance, recognize faces, and export reports — all from one place.
            </p>
          </div>
          <button
            type="button"
            id="dashboard-create-class"
            className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-semibold text-white border border-white/20 hover:bg-white/25 transition-all active:scale-[0.97] backdrop-blur-sm"
            onClick={() => setShow(true)}
          >
            <Plus className="h-4 w-4" />
            New class
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {statCards(stats).map(({ label, value, icon: Icon, glow, iconBg, iconColor, bar, sub }, i) => (
          <div
            key={label}
            className={`relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-lg ${glow} dark:border-slate-700/50 dark:bg-slate-800/80 animate-fade-in-up`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {/* subtle top accent */}
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${bar}`} />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {label}
                </p>
                <p className="mt-2 font-display text-4xl font-black text-slate-900 dark:text-white">
                  <AnimatedNumber value={value} />
                </p>
                {sub && (
                  <p className="mt-1 text-xs text-slate-400">{sub}</p>
                )}
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${iconBg}`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
            </div>
            <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              {value !== null && value !== undefined && (
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${bar} transition-all duration-1000`}
                  style={{ width: value > 0 ? "100%" : "0%" }}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick actions ── */}
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
          <LayoutGrid className="h-4 w-4" />
          View all classes
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* ── Cross-class comparison ── */}
      {comparison.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700/50 dark:bg-slate-800/80 animate-fade-in-up delay-200">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <TrendingUp className="h-4 w-4 text-indigo-400" />
            </div>
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Today across classes
            </h3>
          </div>
          <p className="mb-5 text-sm text-slate-500 pl-11">
            Side-by-side attendance rates for your sections.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {comparison.map((c) => (
              <Link
                key={c.class_id}
                to={`/classes/${c.class_id}/live`}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all hover:border-indigo-400/50 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/50"
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                <p className="mt-1 text-right text-xs font-bold text-indigo-500">
                  {c.rate_today_pct}%
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Create class modal ── */}
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg animate-scale-in">
            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                    New class / section
                  </h3>
                  <p className="mt-0.5 text-sm text-slate-500">Fill in the details to create a new class.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShow(false)}
                  className="btn-ghost p-2"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={createClass} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
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
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
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
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
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
        </div>
      )}
    </div>
  );
}
