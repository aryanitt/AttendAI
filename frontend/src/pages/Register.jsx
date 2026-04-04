import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../lib/apiErrors.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await register({ name, email, password });
      if (data.teacher?.role === "admin") {
        toast.success("Account created — you are the first admin");
      } else {
        toast.success("Account created");
      }
      nav("/", { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Registration failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="card-stitch w-full max-w-md p-8 shadow-stitch-lg">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
            Create teacher account
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            First signup becomes admin; others are teachers
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">
              Full name
            </label>
            <input
              className="input-stitch"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
              Password (min 6)
            </label>
            <input
              className="input-stitch"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <button type="submit" className="btn-primary mt-2 w-full" disabled={busy}>
            {busy ? "Creating…" : "Register"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-indigo-500 hover:underline">
            Sign in
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
