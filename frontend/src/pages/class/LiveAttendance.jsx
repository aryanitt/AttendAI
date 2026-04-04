import { useCallback, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Webcam from "react-webcam";
import toast from "react-hot-toast";
import client from "../../api/client.js";

export default function LiveAttendance() {
  const { classId } = useParams();
  const cam = useRef(null);
  const [camError, setCamError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState(null);

  const capture = useCallback(async () => {
    const shot = cam.current?.getScreenshot();
    if (!shot) {
      toast.error(camError || "Camera not ready");
      return;
    }
    setBusy(true);
    try {
      const blob = await (await fetch(shot)).blob();
      const fd = new FormData();
      fd.append("file", blob, "frame.jpg");
      const { data } = await client.post(
        `/classes/${classId}/attendance/recognize`,
        fd
      );
      setLast(data);
      if (data.marked) {
        toast.success(`Marked present: ${data.match?.name || "Student"}`);
      } else if (data.match == null) {
        toast.error("No confident match in this class");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Recognition failed");
    } finally {
      setBusy(false);
    }
  }, [classId, camError]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card-stitch overflow-hidden p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Webcam (this class only)
          </p>
          {camError && (
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-indigo-500 hover:underline"
            >
              Reload Page
            </button>
          )}
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-black/80">
          <Webcam
            ref={cam}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "user" }}
            onUserMediaError={(err) => {
              console.error("CAMERA ERROR:", err);
              setCamError(String(err));
            }}
            onUserMedia={() => setCamError(null)}
            className="aspect-video w-full object-cover"
          />
          {camError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-4 text-center">
              <p className="text-sm text-white">
                Camera access failed: <br />
                <span className="font-mono text-rose-400">{camError}</span>
              </p>
            </div>
          )}
        </div>
        <button
          type="button"
          className="btn-primary mt-4 w-full"
          onClick={capture}
          disabled={busy || !!camError}
        >
          {busy ? "Processing…" : "Capture and mark attendance"}
        </button>
      </div>
      <div className="card-stitch p-6">
        <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
          Last result
        </h3>
        {!last && (
          <p className="mt-4 text-sm text-slate-500">
            Capture a clear frontal face. Students must be enrolled with a
            reference photo for this class.
          </p>
        )}
        {last && (
          <div className="mt-4 space-y-2 text-sm">
            <p>
              <span className="text-slate-500">Match: </span>
              <span className="font-medium">{last.match?.name || "None"}</span>
            </p>
            <p>
              <span className="text-slate-500">Roll: </span>
              {last.match?.roll_number || "—"}
            </p>
            <p>
              <span className="text-slate-500">Confidence: </span>
              {last.confidence != null
                ? `${(last.confidence * 100).toFixed(1)}%`
                : "—"}
            </p>
            <p>
              <span className="text-slate-500">Marked: </span>
              {last.marked ? "Yes" : "No"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
