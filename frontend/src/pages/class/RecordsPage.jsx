import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import client from "../../api/client.js";

export default function RecordsPage() {
  const { classId } = useParams();
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [date, setDate] = useState("");
  const [studentId, setStudentId] = useState("");

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
    return () => {
      cancelled = true;
    };
  }, [classId]);

  useEffect(() => {
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
    return () => {
      cancelled = true;
    };
  }, [classId, date, studentId]);

  return (
    <div className="space-y-4">
      <div className="card-stitch flex flex-wrap gap-4 p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Date
          </label>
          <input
            type="date"
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
          className="btn-ghost self-end text-sm"
          onClick={() => {
            setDate("");
            setStudentId("");
          }}
        >
          Clear filters
        </button>
      </div>

      <div className="card-stitch overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-stitch-border text-xs uppercase text-slate-500 dark:border-slate-700">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Roll</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  No records for this filter.
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-stitch-border/60 dark:border-slate-800"
                >
                  <td className="px-4 py-3">{r.date}</td>
                  <td className="px-4 py-3">{r.time}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {r.roll_number}
                  </td>
                  <td className="px-4 py-3">{r.student_name}</td>
                  <td className="px-4 py-3 capitalize">{r.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
