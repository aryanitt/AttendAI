import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { CheckCircle2, ImageUp, RefreshCw, Users, X } from "lucide-react";
import client from "../../api/client.js";

export default function UploadAttendance() {
  const { classId } = useParams();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const processFile = async (file) => {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await client.post(
        `/classes/${classId}/attendance/group-photo`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setResult(data);
      if (data.marked_count > 0) {
        toast.success(`✓ Marked ${data.marked_count} student(s) present`);
      } else {
        toast("No enrolled students recognized in this photo");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Upload failed");
      setPreview(null);
    } finally {
      setBusy(false);
    }
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    processFile(file);
    e.target.value = "";
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) processFile(file);
    else toast.error("Please drop an image file");
  }, [classId]);

  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);

  const reset = () => {
    setPreview(null);
    setResult(null);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="card-stitch p-6">
        <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
          Group photo attendance
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Upload a class photo. Faces are detected with OpenCV and matched only against students enrolled in this class.
        </p>

        {!preview ? (
          /* ── Drop zone ── */
          <label
            className={`drop-zone mt-5 flex cursor-pointer flex-col items-center justify-center gap-3 ${
              dragOver ? "drag-over" : ""
            }`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
          >
            <div className={`flex h-16 w-16 items-center justify-center rounded-3xl transition-colors ${
              dragOver ? "bg-indigo-100 dark:bg-indigo-900/40" : "bg-slate-100 dark:bg-slate-800/60"
            }`}>
              <ImageUp className={`h-8 w-8 transition-colors ${
                dragOver ? "text-indigo-500" : "text-slate-400"
              }`} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Drag &amp; drop an image here
              </p>
              <p className="mt-1 text-xs text-slate-400">
                or{" "}
                <span className="font-medium text-indigo-500 underline underline-offset-2">
                  click to browse
                </span>
              </p>
              <p className="mt-2 text-xs text-slate-300 dark:text-slate-600">
                JPG, PNG, WEBP · Max 10 MB
              </p>
            </div>
            <input
              id="upload-photo-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFile}
              disabled={busy}
            />
          </label>
        ) : (
          /* ── Preview + processing ── */
          <div className="mt-5 space-y-4">
            <div className="relative overflow-hidden rounded-2xl border border-stitch-border">
              <img
                src={preview}
                alt="Class photo preview"
                className="max-h-80 w-full object-contain bg-slate-950"
              />
              {busy && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-sm">
                  <RefreshCw className="h-10 w-10 animate-spin text-indigo-300" />
                  <p className="text-sm font-semibold text-white">
                    Detecting and recognizing faces…
                  </p>
                </div>
              )}
              {!busy && (
                <button
                  type="button"
                  onClick={reset}
                  className="absolute right-3 top-3 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 transition-colors"
                  aria-label="Clear image"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Results ── */}
      {result && (
        <div className="card-stitch p-6 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10">
              <Users className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <h4 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                {result.marked_count} student{result.marked_count !== 1 ? "s" : ""} recognized
              </h4>
              <p className="text-sm text-slate-500">
                All matched students have been marked present for today.
              </p>
            </div>
          </div>

          {result.matches?.length > 0 && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {result.matches.map((m, i) => {
                const conf = m.confidence != null ? Math.round(m.confidence * 100) : null;
                const confColor = conf >= 70
                  ? "from-emerald-400 to-teal-500"
                  : conf >= 50
                  ? "from-amber-400 to-orange-500"
                  : "from-rose-400 to-rose-500";
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-2xl border border-stitch-border bg-slate-50/50 p-3.5 animate-fade-in dark:border-slate-700 dark:bg-slate-800/30"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 font-display font-bold text-white">
                      {m.student?.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-semibold text-slate-900 dark:text-white text-sm">
                        {m.student?.name}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">{m.student?.roll_number}</p>
                      {conf !== null && (
                        <div className="mt-1.5 progress-bar" style={{ height: "4px" }}>
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${confColor}`}
                            style={{ width: `${conf}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      {conf !== null && (
                        <p className="mt-0.5 text-xs font-semibold text-slate-500">{conf}%</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            type="button"
            className="btn-ghost mt-4 w-full text-sm"
            onClick={reset}
          >
            Upload another photo
          </button>
        </div>
      )}
    </div>
  );
}
