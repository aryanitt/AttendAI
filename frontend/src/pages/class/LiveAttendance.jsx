import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Webcam from "react-webcam";
import toast from "react-hot-toast";
import { Camera, CheckCircle2, RefreshCw, Timer, XCircle } from "lucide-react";
import client from "../../api/client.js";

export default function LiveAttendance() {
  const { classId } = useParams();
  const cam = useRef(null);
  const intervalRef = useRef(null);
  const [processing, setProcessing] = useState(false);
  const [last, setLast] = useState(null);
  const [camReady, setCamReady] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [sessionMarked, setSessionMarked] = useState(new Set());
  const [countdown, setCountdown] = useState(5);

  const capture = useCallback(async () => {
    const shot = cam.current?.getScreenshot();
    if (!shot) { toast.error("Camera frame empty"); return; }
    if (processing) return;
    setProcessing(true);
    try {
      const blob = await (await fetch(shot)).blob();
      const fd = new FormData();
      fd.append("file", blob, "frame.jpg");
      const { data } = await client.post(
        `/classes/${classId}/attendance/recognize`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setLast(data);
      
      if (data.marked) {
        const sid = data.match?.id || data.match?._id;
        if (!autoMode || (sid && !sessionMarked.has(sid))) {
          toast.success(`✓ Present: ${data.match?.name || "Student"}`);
          if (sid) {
            setSessionMarked((prev) => new Set(prev).add(sid));
          }
        }
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Recognition failed";
      if (msg.includes("face") || msg.includes("Face") || msg.includes("detect") || msg.includes("No enrolled")) {
        setLast({ match: null, confidence: null, marked: false, error: "No clear face detected" });
      } else {
        if (!autoMode) toast.error(msg);
        setLast({ match: null, confidence: null, marked: false, error: msg });
      }
    } finally {
      setProcessing(false);
    }
  }, [classId, autoMode, processing]);

  // Continuous tracking: capture every 1.5 seconds
  useEffect(() => {
    if (autoMode) {
      capture(); // immediate first capture
      const tick = setInterval(() => {
        capture();
      }, 1500);
      intervalRef.current = tick;
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [autoMode, capture]);

  const conf = last?.confidence != null ? Math.round(last.confidence * 100) : null;
  const confColor =
    conf === null ? "from-slate-300 to-slate-400"
    : conf >= 70 ? "from-emerald-400 to-teal-500"
    : conf >= 50 ? "from-amber-400 to-orange-500"
    : "from-rose-400 to-rose-500";

  return (
    <div className="grid gap-6 animate-fade-in-up lg:grid-cols-2">
      {/* ── Webcam panel ── */}
      <div className="card-stitch overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stitch-border px-5 py-4 dark:border-slate-700/80">
          <div className="flex items-center gap-2.5">
            {/* Live dot */}
            {camReady && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
            )}
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {camReady ? "Live webcam" : "Starting camera…"}
            </span>
          </div>
          {camReady && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAutoMode((v) => !v)}
                className={
                  autoMode
                    ? "inline-flex items-center gap-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 transition-all"
                    : "inline-flex items-center gap-1.5 rounded-xl border border-stitch-border px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-all dark:hover:bg-slate-800/60"
                }
              >
                <RefreshCw className={`h-3.5 w-3.5 ${autoMode ? "animate-spin" : ""}`} />
                {autoMode ? "Auto-scanning" : "Continuous Scan"}
              </button>
            </div>
          )}
        </div>

        {/* Webcam */}
        <div className="relative overflow-hidden bg-slate-950">
          <Webcam
            ref={cam}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "user", width: 640, height: 480 }}
            className="aspect-video w-full object-cover"
            onUserMedia={() => setCamReady(true)}
            onUserMediaError={() => {
              setCamReady(false);
              toast.error("Camera access denied");
            }}
          />
          {!camReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
              <Camera className="h-12 w-12 animate-pulse text-slate-500" />
            </div>
          )}
        </div>

        <div className="p-4">
          <button
            type="button"
            id="live-capture-btn"
            className="btn-primary w-full py-3"
            onClick={capture}
            disabled={!camReady || processing}
          >
            {processing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Processing request...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Camera className="h-4 w-4" />
                Capture &amp; mark attendance
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Result panel ── */}
      <div className="card-stitch flex flex-col p-6">
        <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
          Recognition result
        </h3>

        {!last ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-14 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800/60">
              <Camera className="h-8 w-8 text-slate-400" />
            </div>
            <p className="max-w-xs text-sm text-slate-500">
              Capture a clear frontal face. Students must be enrolled with a face photo for this class.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-5 animate-scale-in">
            {/* Student info */}
            {last.match && (
              <div className="rounded-2xl border border-stitch-border bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/30">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 font-display text-lg font-bold text-white">
                    {last.match.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {last.match.name}
                    </p>
                    <p className="text-xs text-slate-500 font-mono">
                      Roll: {last.match.roll_number}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Confidence bar & Match Percentage */}
            {(conf !== null || last.error) && (
              <div className="rounded-2xl border border-stitch-border bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/40">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Match Percentage
                  </span>
                  <span className="font-display text-3xl font-bold text-slate-900 dark:text-white">
                    {conf !== null ? `${conf}%` : "—"}
                  </span>
                </div>
                {conf !== null ? (
                  <div className="mt-4">
                    <div className="progress-bar h-3">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${confColor} transition-all duration-700`}
                        style={{ width: `${conf}%` }}
                      />
                    </div>
                    <p className="mt-2 text-right text-xs font-medium text-slate-500">
                      Threshold: 40% ({conf >= 40 ? "Match" : "No Match"})
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-400">{last.error || JSON.stringify(last)}</p>
                )}
              </div>
            )}
            
            {conf === null && !last.error && (
               <div className="p-3 text-xs bg-slate-100 rounded-xl overflow-auto text-slate-500 font-mono">
                  No match data structure found: {JSON.stringify(last)}
               </div>
            )}

            {!autoMode && (
              <button
                type="button"
                className="btn-ghost w-full text-sm mt-4"
                onClick={() => setLast(null)}
              >
                Clear result
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
