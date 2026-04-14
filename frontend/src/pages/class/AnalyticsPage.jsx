import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, TrendingDown, TrendingUp, Users } from "lucide-react";
import client from "../../api/client.js";

const DONUT_COLORS = ["#818cf8", "#e2e8f0"];
const DONUT_COLORS_DARK = ["#818cf8", "#1e293b"];

function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="card-stitch p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-slate-900 dark:text-white">
            {value ?? "—"}
          </p>
          {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

const CustomTooltipBar = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-stitch-border bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <p className="font-semibold text-slate-700 dark:text-slate-200">{label}</p>
      <p className="text-indigo-500">{payload[0].value} present</p>
    </div>
  );
};

export default function AnalyticsPage() {
  const { classId } = useParams();
  const [summary, setSummary] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [sumRes, stuRes, attRes] = await Promise.all([
          client.get(`/classes/${classId}/analytics/summary`),
          client.get(`/classes/${classId}/students`),
          client.get(`/classes/${classId}/attendance`),
        ]);
        if (!cancelled) {
          setSummary(sumRes.data);
          setStudents(stuRes.data.students || []);
          setAttendance(attRes.data.records || []);
        }
      } catch {
        if (!cancelled) setSummary(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [classId]);

  // Compute per-student present counts
  const studentStats = students.map((s) => {
    const count = attendance.filter(
      (a) => a.student_id === s.id && (a.status === "present" || a.status === "late")
    ).length;
    return { ...s, present_count: count };
  }).sort((a, b) => a.present_count - b.present_count);

  const worstAttenders = studentStats.slice(0, 5);

  const total = summary?.total_students ?? 0;
  const present = summary?.present_today ?? 0;
  const absent = Math.max(0, total - present);
  const rate = summary?.attendance_rate_today_pct ?? 0;

  const donutData = [
    { name: "Present", value: present || 0 },
    { name: "Absent", value: absent || 0 },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 animate-fade-in-up">
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-stitch p-5 space-y-3">
              <div className="skeleton h-4 w-1/2 rounded" />
              <div className="skeleton h-8 w-1/3 rounded" />
            </div>
          ))}
        </div>
        <div className="card-stitch p-6">
          <div className="skeleton h-56 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* ── Stat cards ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total students"
          value={total}
          icon={Users}
          color="bg-indigo-500/10 text-indigo-500"
        />
        <StatCard
          label="Present today"
          value={present}
          sub={`${rate}% attendance rate`}
          icon={TrendingUp}
          color="bg-emerald-500/10 text-emerald-500"
        />
        <StatCard
          label="Absent today"
          value={absent}
          icon={TrendingDown}
          color="bg-rose-500/10 text-rose-500"
        />
      </div>

      {/* ── Donut + 14-day trend row ── */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Donut chart */}
        <div className="card-stitch p-6 lg:col-span-2">
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Today's attendance
          </h3>
          <div className="mt-4 flex flex-col items-center">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {donutData.map((entry, i) => (
                    <Cell key={i} fill={DONUT_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => [v, ""]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex gap-6">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-indigo-400" />
                <span className="text-xs text-slate-500">Present ({present})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-slate-200 dark:bg-slate-700" />
                <span className="text-xs text-slate-500">Absent ({absent})</span>
              </div>
            </div>
          </div>
        </div>

        {/* 14-day bar chart */}
        <div className="card-stitch p-6 lg:col-span-3">
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            14-day attendance trend
          </h3>
          <p className="mt-1 text-xs text-slate-500">Students present per day</p>
          <div className="mt-4 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.trend_14d || []} barSize={18}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9 }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={24} />
                <Tooltip content={<CustomTooltipBar />} />
                <Bar dataKey="present_count" radius={[6, 6, 0, 0]}>
                  {(summary?.trend_14d || []).map((_, i) => (
                    <Cell key={i} fill="url(#barGrad)" />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#a78bfa" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Students needing attention ── */}
      {worstAttenders.length > 0 && (
        <div className="card-stitch p-6">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-rose-500" />
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Students needing attention
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Lowest attendance counts (all-time records)
          </p>
          <div className="mt-4 space-y-2.5">
            {worstAttenders.map((s, i) => {
              const maxCount = Math.max(...studentStats.map((x) => x.present_count), 1);
              const pct = Math.round((s.present_count / maxCount) * 100);
              return (
                <div key={s.id} className="flex items-center gap-3">
                  <span className="w-4 shrink-0 text-right text-xs text-slate-400">
                    {i + 1}
                  </span>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/70 to-violet-500/70 font-display text-sm font-bold text-white">
                    {s.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                        {s.name}
                      </p>
                      <span className="shrink-0 text-xs font-semibold text-slate-500">
                        {s.present_count} sessions
                      </span>
                    </div>
                    <div className="mt-1 progress-bar" style={{ height: "4px" }}>
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-500 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats with BarChart3 icon placeholder if empty trend */}
      {!summary?.trend_14d?.length && (
        <div className="card-stitch flex flex-col items-center justify-center py-14 text-center">
          <BarChart3 className="h-12 w-12 text-slate-300 dark:text-slate-600 animate-bounce-gentle" />
          <p className="mt-3 text-sm text-slate-500">
            No attendance data yet. Mark attendance to see analytics here.
          </p>
        </div>
      )}
    </div>
  );
}
