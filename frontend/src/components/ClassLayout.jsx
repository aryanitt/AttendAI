import { NavLink, Outlet, useParams } from "react-router-dom";
import {
  BarChart3,
  Camera,
  ImageUp,
  LayoutList,
  PieChart,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import client from "../api/client.js";
import { cn } from "../lib/cn.js";

const tabs = [
  { to: "live", label: "Live", icon: Camera },
  { to: "upload", label: "Upload", icon: ImageUp },
  { to: "students", label: "Students", icon: Users },
  { to: "records", label: "Records", icon: LayoutList },
  { to: "reports", label: "Reports", icon: PieChart },
  { to: "analytics", label: "Analytics", icon: BarChart3 },
];

export default function ClassLayout() {
  const { classId } = useParams();
  const [cls, setCls] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await client.get(`/classes/${classId}`);
        if (!cancelled) setCls(data.class);
      } catch {
        if (!cancelled) setCls(null);
      }
    })();
    return () => { cancelled = true; };
  }, [classId]);

  const enrolled = cls?.student_count ?? 0;
  const enrolledPct = Math.min(100, ((enrolled / 50) * 100));

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* ── Class hero card ── */}
      <div className="card-stitch overflow-hidden">
        <div className="hero-gradient px-6 py-5 sm:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
                Class · Section
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
                {cls?.class_name || "Loading…"}
              </h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {cls?.subject && (
                  <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-medium text-white">
                    {cls.subject}
                  </span>
                )}
                {cls?.year_semester && (
                  <span className="rounded-full bg-white/15 px-3 py-0.5 text-xs font-medium text-white/80">
                    {cls.year_semester}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="font-display text-3xl font-bold text-white">
                {enrolled}
              </p>
              <p className="text-xs text-white/70">
                student{enrolled !== 1 ? "s" : ""} enrolled
              </p>
              <div className="mt-2 h-1.5 w-32 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white/80 transition-all duration-1000"
                  style={{ width: `${enrolledPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex flex-wrap gap-1 px-4 py-3 sm:px-6 border-t border-white/10 bg-stitch-surface">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-all",
                  isActive
                    ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60"
                )
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </NavLink>
          ))}
        </div>
      </div>

      <Outlet />
    </div>
  );
}
