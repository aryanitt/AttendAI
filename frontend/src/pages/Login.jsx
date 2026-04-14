import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../lib/apiErrors.js";
import { useAuth } from "../context/AuthContext.jsx";
import {
  Camera,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  BookOpen,
  BarChart3,
  Users,
} from "lucide-react";

const features = [
  { icon: Camera, text: "AI-powered face recognition attendance" },
  { icon: BookOpen, text: "Multi-class management with isolation" },
  { icon: Users, text: "Enroll, track, and manage students easily" },
  { icon: BarChart3, text: "Analytics, trends, and Excel exports" },
];

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setFormError("");
    setBusy(true);
    try {
      await login(email.trim(), password);
      toast.success("Welcome back!");
      nav(loc.state?.from || "/", { replace: true });
    } catch (err) {
      const text = getApiErrorMessage(err, "Login failed");
      setFormError(text);
      toast.error(text);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Left branding panel ── */}
      <div className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex lg:w-[48%] xl:w-[44%]">
        <div className="hero-gradient absolute inset-0 opacity-95" />
        {/* decorative blobs */}
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-10 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-2xl" />

        <div className="relative z-10 animate-fade-in-up">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
            <Camera className="h-6 w-6 text-white" />
          </div>
          <p className="mt-3 text-sm font-semibold uppercase tracking-widest text-white/80">
            AttendAI
          </p>
        </div>

        <div className="relative z-10">
          <h2 className="font-display text-4xl font-bold leading-tight text-white xl:text-5xl animate-fade-in-up">
            Smart attendance,<br />
            <span className="text-white/75">effortlessly.</span>
          </h2>
          <p className="mt-4 text-base text-white/70 leading-relaxed animate-fade-in-up delay-100">
            Multi-class face recognition system powered by AI. Free, local, and open-source.
          </p>

          <ul className="mt-10 space-y-4">
            {features.map(({ icon: Icon, text }, i) => (
              <li
                key={text}
                className="flex items-center gap-3 animate-slide-in-left"
                style={{ animationDelay: `${150 + i * 80}ms` }}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm text-white/85">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 animate-fade-in delay-300">
          <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
              <p className="text-sm text-white/90">
                First signup becomes admin — no extra setup needed.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[420px] animate-scale-in">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl hero-gradient shadow-lg">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <p className="font-display text-lg font-bold text-slate-900 dark:text-white">
              AttendAI
            </p>
          </div>

          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Sign in to manage your classes and attendance.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5" id="login-form">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Email address
              </label>
              <input
                id="login-email"
                className="input-stitch"
                type="email"
                autoComplete="email"
                placeholder="teacher@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  className="input-stitch pr-12"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {formError && (
              <div className="animate-fade-in rounded-2xl border border-rose-500/40 bg-rose-50 px-4 py-3 dark:bg-rose-500/10">
                <p className="text-sm text-rose-700 dark:text-rose-300">{formError}</p>
              </div>
            )}

            <button
              type="submit"
              id="login-submit"
              className="btn-primary mt-2 w-full py-3 text-base"
              disabled={busy}
            >
              {busy ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Signing in…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign in
                  <ChevronRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 space-y-3 text-center">
            <p className="text-sm text-slate-500">
              New teacher?{" "}
              <Link
                to="/register"
                className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 transition-colors"
              >
                Create your account
              </Link>
            </p>
            <p className="text-xs text-slate-400">
              <Link
                to="/welcome"
                className="hover:text-indigo-500 transition-colors underline underline-offset-2"
              >
                Preview app screens without signing in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
