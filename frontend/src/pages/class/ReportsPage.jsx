import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { downloadReport } from "../../api/client.js";
import client from "../../api/client.js";

export default function ReportsPage() {
  const { classId } = useParams();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [day, setDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get(`/classes/${classId}/students`);
        setStudents(data.students || []);
      } catch {
        setStudents([]);
      }
    })();
  }, [classId]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get(
          `/classes/${classId}/analytics/summary`
        );
        setSummary(data);
      } catch {
        setSummary(null);
      }
    })();
  }, [classId]);

  const dlDaily = async () => {
    try {
      await downloadReport(
        `/api/classes/${classId}/reports/daily?date=${encodeURIComponent(day)}`,
        `daily_${day}.xlsx`
      );
      toast.success("Download started");
    } catch {
      toast.error("Download failed");
    }
  };

  const dlMonthly = async () => {
    try {
      await downloadReport(
        `/api/classes/${classId}/reports/monthly?month=${encodeURIComponent(month)}`,
        `monthly_${month}.xlsx`
      );
      toast.success("Download started");
    } catch {
      toast.error("Download failed");
    }
  };

  const dlStudent = async () => {
    if (!studentId) {
      toast.error("Pick a student");
      return;
    }
    try {
      await downloadReport(
        `/api/classes/${classId}/reports/student/${studentId}`,
        "student_report.xlsx"
      );
      toast.success("Download started");
    } catch {
      toast.error("Download failed");
    }
  };

  return (
    <div className="space-y-6">
      {summary && (
        <div className="card-stitch p-6">
          <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            Class analytics
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Present today: {summary.present_today} / {summary.total_students} (
            {summary.attendance_rate_today_pct}%)
          </p>
          <div className="mt-6 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.trend_14d || []}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar
                  dataKey="present_count"
                  fill="url(#barGrad)"
                  radius={[6, 6, 0, 0]}
                />
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
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card-stitch p-6">
          <h4 className="font-medium text-slate-900 dark:text-white">
            Daily Excel
          </h4>
          <input
            type="date"
            className="input-stitch mt-3 py-2"
            value={day}
            onChange={(e) => setDay(e.target.value)}
          />
          <button type="button" className="btn-primary mt-4 w-full" onClick={dlDaily}>
            Download
          </button>
        </div>
        <div className="card-stitch p-6">
          <h4 className="font-medium text-slate-900 dark:text-white">
            Monthly Excel
          </h4>
          <input
            type="month"
            className="input-stitch mt-3 py-2"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
          <button
            type="button"
            className="btn-primary mt-4 w-full"
            onClick={dlMonthly}
          >
            Download
          </button>
        </div>
        <div className="card-stitch p-6">
          <h4 className="font-medium text-slate-900 dark:text-white">
            Student report
          </h4>
          <select
            className="input-stitch mt-3 py-2"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          >
            <option value="">Select student</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.roll_number} — {s.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn-primary mt-4 w-full"
            onClick={dlStudent}
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
