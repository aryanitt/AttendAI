import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useMatch,
  useNavigate,
} from "react-router-dom";
import {
  BookOpen,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Moon,
  PanelLeft,
  Settings,
  Sun,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import client from "../api/client.js";
import { cn } from "../lib/cn.js";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/classes", label: "Classes", icon: BookOpen },
  { to: "/settings", label: "Settings", icon: Settings },
];

function Breadcrumbs({ classList, classId }) {
  const { pathname } = useLocation();
  const parts = [];
  // parts.push({ label: "Dashboard", to: "/" });
  if (pathname.startsWith("/classes")) {
    parts.push({ label: "Classes", to: "/classes" });
  }
  if (classId) {
    const c = classList.find((x) => x.id === classId);
    parts.push({
      label: c?.class_name || "Class",
      to: `/classes/${classId}/live`,
    });
    const seg = pathname.split("/").pop();
    const map = {
      live: "Live attendance",
      upload: "Upload image",
      students: "Students",
      records: "Records",
      reports: "Reports",
    };
    if (map[seg]) parts.push({ label: map[seg], to: pathname });
  }
  if (pathname.startsWith("/settings")) {
    parts.push({ label: "Settings", to: "/settings" });
  }
  return (
    <nav className="flex flex-wrap items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
      {parts.map((p, i) => (
        <span key={`${p.to}-${i}`} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-4 w-4 opacity-60" />}
          {i === parts.length - 1 ? (
            <span className="font-medium text-slate-800 dark:text-slate-100">
              {p.label}
            </span>
          ) : (
            <Link to={p.to} className="hover:text-indigo-500">
              {p.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

export default function AppShell() {
  const { teacher, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [classList, setClassList] = useState([]);
  const loc = useLocation();
  const navigate = useNavigate();
  const classMatch = useMatch({ path: "/classes/:classId/*", end: false });
  const classId = classMatch?.params?.classId;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await client.get("/classes");
        if (!cancelled) setClassList(data.classes || []);
      } catch {
        if (!cancelled) setClassList([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loc.pathname]);

  const inClass = Boolean(classId);

  return (
    <div className="flex min-h-screen">
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-stitch-border bg-stitch-surface/95 backdrop-blur-xl transition-all dark:border-slate-700/80 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          collapsed ? "w-[72px]" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-stitch-border px-4 dark:border-slate-700/80">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-lg font-bold text-white shadow-lg shadow-indigo-500/30">
            A
          </div>
          {!collapsed && (
            <div>
              <p className="font-display text-sm font-semibold leading-tight">
                Attend AI
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Face · Multi-class
              </p>
            </div>
          )}
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
                  isActive
                    ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80"
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0 opacity-90" />
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-stitch-border p-3 dark:border-slate-700/80">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="btn-ghost mb-2 w-full justify-start"
          >
            <PanelLeft className="h-4 w-4" />
            {!collapsed && "Collapse"}
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col lg:pl-0">
        <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-stitch-border bg-stitch-bg/80 px-4 py-3 backdrop-blur-md dark:border-slate-700/80">
          <button
            type="button"
            className="btn-ghost absolute left-3 top-3 p-2 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <PanelLeft className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 flex-1 flex-col gap-1 pl-12 lg:pl-4">
            <Breadcrumbs classList={classList} classId={classId} />
            <h1 className="font-display truncate text-lg font-semibold text-slate-900 dark:text-white">
              {teacher?.name ? `Hi, ${teacher.name.split(" ")[0]}` : "Welcome"}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {inClass && classList.length > 0 && (
              <div className="flex items-center gap-2">
                <Users className="hidden h-4 w-4 text-slate-400 sm:inline" />
                <select
                  className="input-stitch max-w-[200px] py-2 text-xs sm:max-w-xs"
                  value={classId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const parts = loc.pathname.split("/").filter(Boolean);
                    const i = parts.indexOf("classes");
                    const sub =
                      i >= 0 ? parts.slice(i + 2) : [];
                    const tail = sub.join("/") || "live";
                    navigate(`/classes/${id}/${tail}`);
                  }}
                >
                  {classList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.class_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              type="button"
              onClick={toggle}
              className="btn-ghost p-2.5"
              aria-label="Toggle theme"
            >
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button type="button" onClick={logout} className="btn-ghost p-2.5">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
