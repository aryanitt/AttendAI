import { Link } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  Camera,
  ChevronRight,
  ImageUp,
  LayoutDashboard,
  LayoutList,
  Settings,
  Users,
} from "lucide-react";

const previewCards = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    text: "Totals for classes, students, and today’s attendance, plus a cross-class comparison.",
  },
  {
    title: "Classes",
    icon: BookOpen,
    text: "Create sections (e.g. CSE-A), open a class, or delete one. Each class is fully isolated.",
  },
  {
    title: "Live attendance",
    icon: Camera,
    text: "Webcam capture, face match against this class only, mark present for today.",
  },
  {
    title: "Upload image",
    icon: ImageUp,
    text: "Group photo: detect multiple faces and mark everyone recognized in this class.",
  },
  {
    title: "Students",
    icon: Users,
    text: "Add, edit, remove students; upload a face photo to enroll for recognition.",
  },
  {
    title: "Records & reports",
    icon: LayoutList,
    text: "Filter by date or student; export daily, monthly, or per-student Excel files.",
  },
  {
    title: "Analytics & settings",
    icon: BarChart3,
    text: "Charts per class, dark mode, and admin tools for roles (first signup is admin).",
  },
];

export default function WelcomePage() {
  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-stitch-border bg-stitch-surface/80 px-4 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">
              <Settings className="h-3.5 w-3.5" />
              Public preview — no account needed
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Smart Attendance
            </h1>
            <p className="mt-2 max-w-xl text-slate-600 dark:text-slate-300">
              These are the screens you get after sign-in: multi-class face attendance,
              MongoDB-backed data, and exports — all local and open source.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/login" className="btn-primary">
              Sign in
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link to="/register" className="btn-ghost">
              Create account
            </Link>
          </div>
        </header>

        <div className="mb-10 grid gap-4 lg:grid-cols-3">
          <div className="card-stitch p-6 lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
              Layout (signed-in)
            </p>
            <p className="mt-2 font-display text-lg font-semibold text-slate-900 dark:text-white">
              Sidebar + class switcher + breadcrumbs
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Dashboard · Classes · Settings in the nav; when you open a class, tabs appear
              for Live, Upload, Students, Records, and Reports.
            </p>
            <div className="mt-6 flex gap-2 rounded-2xl border border-dashed border-stitch-border bg-slate-50/80 p-4 dark:border-slate-600 dark:bg-slate-900/40">
              <div className="hidden w-20 shrink-0 flex-col gap-2 rounded-xl bg-white/90 p-2 shadow-sm dark:bg-slate-800/90 sm:flex">
                <div className="h-8 rounded-lg bg-indigo-500/20" />
                <div className="h-6 rounded-lg bg-slate-200 dark:bg-slate-700" />
                <div className="h-6 rounded-lg bg-slate-200 dark:bg-slate-700" />
                <div className="h-6 rounded-lg bg-slate-200 dark:bg-slate-700" />
              </div>
              <div className="min-h-[140px] flex-1 rounded-xl border border-stitch-border bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-800/90">
                <div className="mb-3 h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-600" />
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="h-16 rounded-xl bg-indigo-500/10" />
                  <div className="h-16 rounded-xl bg-violet-500/10" />
                  <div className="h-16 rounded-xl bg-indigo-500/10" />
                </div>
              </div>
            </div>
          </div>
          <div className="card-stitch flex flex-col justify-center p-6">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Open this address anytime without logging in:
            </p>
            <code className="mt-3 break-all rounded-xl bg-slate-900/90 px-3 py-2 text-xs text-slate-100">
              http://localhost:5173/welcome
            </code>
          </div>
        </div>

        <h2 className="mb-4 font-display text-xl font-semibold text-slate-900 dark:text-white">
          What each page does
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {previewCards.map(({ title, icon: Icon, text }) => (
            <li key={title} className="card-stitch flex gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-indigo-600 dark:text-indigo-300">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-slate-900 dark:text-white">
                  {title}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{text}</p>
              </div>
            </li>
          ))}
        </ul>

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-stitch-border pt-8 dark:border-slate-700">
          <p className="text-sm text-slate-500">
            After you register, the app opens on the real dashboard with working data.
          </p>
          <Link to="/login" className="btn-primary text-sm">
            Go to login
          </Link>
        </footer>
      </div>
    </div>
  );
}
