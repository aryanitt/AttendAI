import { useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import client from "../../api/client.js";

export default function UploadAttendance() {
  const { classId } = useParams();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await client.post(
        `/classes/${classId}/attendance/group-photo`,
        fd
      );
      setResult(data);
      toast.success(`Marked ${data.marked_count} student(s)`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Upload failed");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  return (
    <div className="card-stitch p-6">
      <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
        Group photo attendance
      </h3>
      <p className="mt-2 text-sm text-slate-500">
        Upload a class photo. Faces are detected with OpenCV; each crop is
        matched only against students enrolled in this class.
      </p>
      <label className="btn-primary mt-6 inline-flex cursor-pointer">
        {busy ? "Processing…" : "Choose image"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFile}
          disabled={busy}
        />
      </label>
      {result && (
        <div className="mt-6 rounded-2xl border border-stitch-border bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/50">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Matches ({result.marked_count})
          </p>
          <ul className="mt-2 max-h-64 space-y-2 overflow-y-auto text-sm">
            {(result.matches || []).map((m, i) => (
              <li
                key={i}
                className="flex justify-between gap-2 rounded-xl bg-white/80 px-3 py-2 dark:bg-slate-800/80"
              >
                <span>
                  {m.student?.name}{" "}
                  <span className="text-slate-500">
                    ({m.student?.roll_number})
                  </span>
                </span>
                <span className="text-slate-500">
                  {m.confidence != null
                    ? (m.confidence * 100).toFixed(0) + "%"
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
