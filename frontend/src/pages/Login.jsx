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
  Zap,
  Shield,
  ArrowRight,
} from "lucide-react";
import Logo from "../components/Logo.jsx";

const stats = [
  { value: "99%", label: "Accuracy" },
  { value: "<2s", label: "Per Photo" },
  { value: "∞", label: "Students" },
];

const features = [
  { icon: Camera, text: "AI face recognition" },
  { icon: BookOpen, text: "Multi-class support" },
  { icon: BarChart3, text: "Live analytics" },
  { icon: Shield, text: "Secure & private" },
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
    <div className="flex min-h-screen bg-slate-950">
      {/* ── Left dark branding panel ── */}
      <div className="relative hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col justify-between overflow-hidden p-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-indigo-600/20 blur-[100px]" />
        <div className="absolute bottom-10 right-10 h-64 w-64 rounded-full bg-cyan-500/10 blur-[80px]" />

        {/* Top branding */}
        <div className="relative z-10 flex items-center gap-3 animate-fade-in-up">
          <Logo className="text-[36px]" showText={false} />
          <div>
            <p className="font-display text-xl font-black tracking-tight">
              <span className="text-white">Attend</span>
              <span className="text-cyan-400">AI</span>
            </p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
              Face Recognition System
            </p>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 space-y-8 animate-fade-in-up">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1">
              <Zap className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-xs font-medium text-indigo-300">AI-Powered Attendance</span>
            </div>
            <h1 className="font-display text-5xl font-black leading-[1.05] text-white xl:text-6xl">
              Mark attendance
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                in seconds.
              </span>
            </h1>
            <p className="text-base text-slate-400 leading-relaxed max-w-md">
              Upload a group photo — our AI identifies every student and marks attendance automatically.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/50 px-3 py-2">
                <Icon className="h-3.5 w-3.5 text-cyan-400" />
                <span className="text-xs font-medium text-slate-300">{text}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-8 border-t border-slate-800 pt-8">
            {stats.map(({ value, label }) => (
              <div key={label}>
                <p className="font-display text-3xl font-black text-white">{value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom badge */}
        <div className="relative z-10 animate-fade-in">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            <p className="text-sm text-slate-400">
              First signup becomes <span className="font-semibold text-slate-200">admin</span> — no extra setup needed.
            </p>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-1 items-center justify-center bg-slate-50 dark:bg-slate-900 p-6 lg:p-12">
        <div className="w-full max-w-[420px] animate-scale-in">

          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Logo className="text-[32px]" showText={false} />
            <p className="font-display text-lg font-black">
              <span className="text-slate-900 dark:text-white">Attend</span>
              <span className="text-cyan-500">AI</span>
            </p>
          </div>

          {/* Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-800 dark:shadow-none">

            {/* Header inside card */}
            <div className="mb-7">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30">
                <Logo className="text-[22px]" showText={false} />
              </div>
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                Welcome back 👋
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Sign in to your AttendAI account
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4" id="login-form">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
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
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Password
                </label>
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
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {formError && (
                <div className="animate-fade-in rounded-2xl border border-rose-500/40 bg-rose-50 px-4 py-3 dark:bg-rose-500/10">
                  <p className="text-sm text-rose-600 dark:text-rose-300">{formError}</p>
                </div>
              )}

              <button
                type="submit"
                id="login-submit"
                className="btn-primary w-full py-3.5 text-sm mt-2"
                disabled={busy}
              >
                {busy ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign in to AttendAI
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs text-slate-400">or</span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            </div>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              New teacher?{" "}
              <Link
                to="/register"
                className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 transition-colors"
              >
                Create your account →
              </Link>
            </p>
          </div>

          {/* Below card link */}
          <p className="mt-4 text-center text-xs text-slate-400">
            <Link
              to="/welcome"
              className="hover:text-indigo-500 transition-colors underline underline-offset-2"
            >
              Preview app without signing in
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
