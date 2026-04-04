import { NavLink, Outlet, useParams } from "react-router-dom";
import {
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
    return () => {
      cancelled = true;
    };
  }, [classId]);

  return (
    <div className="space-y-6">
      <div className="card-stitch p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
              {cls?.class_name || "Class"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {[cls?.subject, cls?.year_semester].filter(Boolean).join(" · ") ||
                "Manage attendance for this section only"}
            </p>
          </div>
          <p className="text-sm text-slate-500">
            {cls?.student_count ?? "—"} students
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-2 border-t border-stitch-border pt-4 dark:border-slate-700/80">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </div>
      </div>
      <Outlet />
    </div>
  );
}
