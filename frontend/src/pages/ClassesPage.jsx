import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import client from "../api/client.js";

export default function ClassesPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await client.get("/classes");
      setClasses(data.classes || []);
    } catch {
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id, name) => {
    if (!window.confirm(`Delete class "${name}" and all its data?`)) return;
    try {
      await client.delete(`/classes/${id}`);
      toast.success("Class deleted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Delete failed");
    }
  };

  if (loading) {
    return <p className="text-slate-500">Loading classes…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
          Your classes
        </h2>
        <Link to="/#create" className="btn-primary text-sm">
          + New class
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {classes.map((c) => (
          <div key={c.id} className="card-stitch flex flex-col p-6">
            <div className="flex-1">
              <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                {c.class_name}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {[c.subject, c.year_semester].filter(Boolean).join(" · ") ||
                  "No subject set"}
              </p>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                {c.student_count} students
              </p>
            </div>
            <div className="mt-4 flex gap-2 border-t border-stitch-border pt-4 dark:border-slate-700/80">
              <Link
                to={`/classes/${c.id}/live`}
                className="btn-primary flex-1 justify-center text-sm"
              >
                Open
                <ChevronRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                className="btn-ghost p-2.5 text-rose-500 hover:bg-rose-500/10"
                onClick={() => remove(c.id, c.class_name)}
                aria-label="Delete class"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      {classes.length === 0 && (
        <p className="text-center text-slate-500">
          No classes yet. Create one from the dashboard.
        </p>
      )}
    </div>
  );
}
