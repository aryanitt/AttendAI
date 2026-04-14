import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { CheckCircle2, Clock, Filter, XCircle } from "lucide-react";
import client from "../../api/client.js";

const statusConfig = {
  present: {
    label: "Present",
    cls: "badge-present",
    icon: CheckCircle2,
  },
  absent: {
    label: "Absent",
    cls: "badge-absent",
    icon: XCircle,
  },
  late: {
    label: "Late",
    cls: "badge-late",
    icon: Clock,
  },
};

export default function RecordsPage() {
  const { classId } = useParams();
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [date, setDate] = useState("");
  const [studentId, setStudentId] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await client.get(`/classes/${classId}/students`);
        if (!cancelled) setStudents(data.students || []);
      } catch {
        if (!cancelled) setStudents([]);
      }
    })();
    return () => { cancelled = true; };
  }, [classId]);

  useEffect(() => {
    setPage(1);
    let cancelled = false;
    (async () => {
      const params = new URLSearchParams();
      if (date) params.set("date", date);
      if (studentId) params.set("student_id", studentId);
      const q = params.toString();
      try {
        const { data } = await client.get(
          `/classes/${classId}/attendance${q ? `?${q}` : ""}`
        );
        if (!cancelled) setRecords(data.records || []);
      } catch {
        if (!cancelled) setRecords([]);
      }
    })();
    return () => { cancelled = true; };
  }, [classId, date, studentId]);

  const manualMark = async (sid, status) => {
    try {
      await client.post(`/classes/${classId}/attendance/manual`, {
        student_id: sid,
        status,
      });
      toast.success(`Marked ${status}`);
      // Refresh
      const params = new URLSearchParams();
      if (date) params.set("date", date);
      if (studentId) params.set("student_id", studentId);
      const q = params.toString();
      const { data } = await client.get(
        `/classes/${classId}/attendance${q ? `?${q}` : ""}`
      );
      setRecords(data.records || []);
    } catch (err) {
      toast.error(err.response?.data?.error || "Mark failed");
    }
  };

  const paged = records.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(records.length / PER_PAGE);

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* ── Filters ── */}
      <div className="card-stitch p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <Filter className="h-4 w-4" />
            Filters
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Date
            </label>
            <input
              type="date"
              id="records-date-filter"
              className="input-stitch w-auto py-2"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Student
            </label>
            <select
              id="records-student-filter"
              className="input-stitch min-w-[200px] py-2"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            >
              <option value="">All students</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.roll_number} — {s.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            id="records-clear-filters"
            className="btn-ghost self-end text-sm"
            onClick={() => { setDate(""); setStudentId(""); }}
          >
            Clear
          </button>
          <p className="ml-auto self-end text-xs text-slate-400">
            {records.length} record{records.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card-stitch overflow-x-auto">
        <table className="table-stitch min-w-[760px]">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Roll</th>
              <th>Name</th>
              <th>Status</th>
              <th className="text-right">Mark</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-500">
                  No records for this filter.
                </td>
              </tr>
            ) : (
              paged.map((r) => {
                const cfg = statusConfig[r.status] || statusConfig.present;
                const CfgIcon = cfg.icon;
                return (
                  <tr key={r.id}>
                    <td className="font-mono text-xs">{r.date}</td>
                    <td className="font-mono text-xs text-slate-500">{r.time}</td>
                    <td>
                      <span className="font-mono text-xs text-slate-500">{r.roll_number}</span>
                    </td>
                    <td className="font-medium">{r.student_name}</td>
                    <td>
                      <span className={cfg.cls}>
                        <CfgIcon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {["present", "late", "absent"].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => manualMark(r.student_id, s)}
                            className={
                              r.status === s
                                ? s === "present"
                                  ? "rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                                  : s === "absent"
                                  ? "rounded-xl bg-rose-500/15 border border-rose-500/30 px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400"
                                  : "rounded-xl bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400"
                                : "rounded-xl border border-stitch-border px-2.5 py-1 text-xs text-slate-400 hover:bg-slate-50 transition-colors dark:hover:bg-slate-800/40"
                            }
                          >
                            {s[0].toUpperCase() + s.slice(1)}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            className="btn-ghost px-3 py-1.5 text-sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={
                p === page
                  ? "rounded-xl bg-indigo-500 px-3 py-1.5 text-sm font-semibold text-white"
                  : "btn-ghost px-3 py-1.5 text-sm"
              }
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            className="btn-ghost px-3 py-1.5 text-sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
