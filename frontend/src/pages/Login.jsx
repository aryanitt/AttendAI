import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../lib/apiErrors.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setFormError("");
    setBusy(true);
    try {
      await login(email.trim(), password);
      toast.success("Signed in");
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
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="card-stitch w-full max-w-md p-8 shadow-stitch-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-500 text-2xl font-bold text-white shadow-lg shadow-indigo-500/40">
            S
          </div>
          <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Sign in to manage classes and attendance
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">
              Email
            </label>
            <input
              className="input-stitch"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">
              Password
            </label>
            <input
              className="input-stitch"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {formError && (
            <p
              className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-200"
              role="alert"
            >
              {formError}
            </p>
          )}
          <button type="submit" className="btn-primary mt-2 w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          New teacher?{" "}
          <Link to="/register" className="font-medium text-indigo-500 hover:underline">
            Create account
          </Link>
        </p>
        <p className="mt-3 text-center text-sm">
          <Link
            to="/welcome"
            className="font-medium text-slate-600 underline decoration-slate-300 underline-offset-2 hover:text-indigo-500 dark:text-slate-400"
          >
            View app screens (no sign-in)
          </Link>
        </p>
      </div>
    </div>
  );
}
