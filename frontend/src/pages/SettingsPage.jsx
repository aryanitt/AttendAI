import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import client from "../api/client.js";
import { swrFetch, cacheDelete } from "../lib/cache.js";
import {
  User,
  Sun,
  Moon,
  Shield,
  Users,
  BookOpen,
  Database,
  ClipboardList,
  Mail,
  BadgeCheck,
} from "lucide-react";

export default function SettingsPage() {
  const { teacher, isAdmin } = useAuth();
  const { dark, setDark } = useTheme();
  const [adminStats, setAdminStats] = useState(null);
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    if (!isAdmin) return;
    swrFetch(
      "admin_settings_data",
      async () => {
        const [s, t] = await Promise.all([
          client.get("/admin/stats"),
          client.get("/admin/teachers"),
        ]);
        return { stats: s.data, teachers: t.data.teachers || [] };
      },
      (data) => {
        setAdminStats(data.stats);
        setTeachers(data.teachers);
      },
      5 * 60 * 1000
    );
  }, [isAdmin]);

  const setRole = async (id, role) => {
    try {
      await client.patch(`/admin/teachers/${id}/role`, { role });
      toast.success("Role updated");
      cacheDelete("admin_settings_data");
      const { data } = await client.get("/admin/teachers");
      setTeachers(data.teachers || []);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed");
    }
  };

  const adminStatCards = adminStats
    ? [
        { label: "Teachers", value: adminStats.teachers, icon: Users, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
        { label: "Classes", value: adminStats.classes, icon: BookOpen, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
        { label: "Students", value: adminStats.students, icon: Users, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
        { label: "Attendance Rows", value: adminStats.attendance_records, icon: Database, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
      ]
    : [];

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in-up">

      {/* ── Profile Card ── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700/50 dark:bg-slate-800/80">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500" />
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25">
            <User className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              Profile
            </h2>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2.5">
                <User className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{teacher?.name}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-sm text-slate-500 dark:text-slate-400">{teacher?.email}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <BadgeCheck className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-500 dark:text-indigo-300 uppercase tracking-wide">
                  {teacher?.role}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Appearance Card ── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700/50 dark:bg-slate-800/80">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500" />
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25">
            {dark ? <Moon className="h-6 w-6 text-white" /> : <Sun className="h-6 w-6 text-white" />}
          </div>
          <div className="flex-1">
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              Appearance
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Choose your preferred theme.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all ${
                  !dark
                    ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25"
                    : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                }`}
                onClick={() => setDark(false)}
              >
                <Sun className="h-4 w-4" />
                Light
              </button>
              <button
                type="button"
                className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all ${
                  dark
                    ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25"
                    : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                }`}
                onClick={() => setDark(true)}
              >
                <Moon className="h-4 w-4" />
                Dark
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Admin Section ── */}
      {isAdmin && adminStats && (
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700/50 dark:bg-slate-800/80">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="flex items-start gap-4 mb-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                Admin Overview
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                System-wide statistics and teacher management.
              </p>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {adminStatCards.map(({ label, value, icon: Icon, color, bg }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 dark:border-slate-700 dark:bg-slate-900/50"
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${bg}`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <div>
                  <p className="font-display text-lg font-bold text-slate-900 dark:text-white">{value}</p>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Teachers list */}
          <div className="border-t border-slate-200 pt-5 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="h-4 w-4 text-slate-400" />
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Teachers & Roles
              </h3>
            </div>
            <div className="space-y-2">
              {teachers.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:bg-slate-800"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-bold text-white uppercase">
                      {t.name?.charAt(0) || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-slate-900 truncate dark:text-white">{t.name}</p>
                      <p className="text-xs text-slate-500 truncate">{t.email}</p>
                    </div>
                  </div>
                  <select
                    className="input-stitch w-auto py-1.5 text-xs font-medium"
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
        </div>
      )}
    </div>
  );
}
