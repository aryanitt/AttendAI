import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import client from "../api/client.js";

export default function SettingsPage() {
  const { teacher, isAdmin } = useAuth();
  const { dark, setDark } = useTheme();
  const [adminStats, setAdminStats] = useState(null);
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      try {
        const [s, t] = await Promise.all([
          client.get("/admin/stats"),
          client.get("/admin/teachers"),
        ]);
        setAdminStats(s.data);
        setTeachers(t.data.teachers || []);
      } catch {
        setAdminStats(null);
      }
    })();
  }, [isAdmin]);

  const setRole = async (id, role) => {
    try {
      await client.patch(`/admin/teachers/${id}/role`, { role });
      toast.success("Role updated");
      const { data } = await client.get("/admin/teachers");
      setTeachers(data.teachers || []);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="card-stitch p-6">
        <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
          Profile
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {teacher?.name}
        </p>
        <p className="text-sm text-slate-500">{teacher?.email}</p>
        <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">
          Role: {teacher?.role}
        </p>
      </div>

      <div className="card-stitch p-6">
        <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
          Appearance
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Toggle dark mode (Stitch-inspired surfaces).
        </p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            className={!dark ? "btn-primary" : "btn-ghost"}
            onClick={() => setDark(false)}
          >
            Light
          </button>
          <button
            type="button"
            className={dark ? "btn-primary" : "btn-ghost"}
            onClick={() => setDark(true)}
          >
            Dark
          </button>
        </div>
      </div>

      {isAdmin && adminStats && (
        <div className="card-stitch p-6">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            Admin overview
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <li className="rounded-2xl bg-slate-100/80 px-4 py-3 dark:bg-slate-800/80">
              Teachers: {adminStats.teachers}
            </li>
            <li className="rounded-2xl bg-slate-100/80 px-4 py-3 dark:bg-slate-800/80">
              Classes: {adminStats.classes}
            </li>
            <li className="rounded-2xl bg-slate-100/80 px-4 py-3 dark:bg-slate-800/80">
              Students: {adminStats.students}
            </li>
            <li className="rounded-2xl bg-slate-100/80 px-4 py-3 dark:bg-slate-800/80">
              Attendance rows: {adminStats.attendance_records}
            </li>
          </ul>

          <h3 className="mt-8 font-medium text-slate-900 dark:text-white">
            Teachers & roles
          </h3>
          <div className="mt-3 space-y-2">
            {teachers.map((t) => (
              <div
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-stitch-border px-4 py-3 dark:border-slate-700"
              >
                <div>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.email}</p>
                </div>
                <select
                  className="input-stitch w-auto py-1.5 text-xs"
                  value={t.role}
                  onChange={(e) => setRole(t.id, e.target.value)}
                >
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
