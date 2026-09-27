import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const roleHome = { department: "/department", startup: "/startup", admin: "/admin" };

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await client.post("/api/auth/login", { email, password });
      login(res.data.access_token, res.data.user);
      navigate(roleHome[res.data.user.role] || "/");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-16">
      <div className="card p-8">
        <h1 className="text-xl font-bold text-slate-900">Log in to StartSetu</h1>
        <p className="mt-1 text-sm text-slate-500">Departments, startups and admins share one login.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          New here?{" "}
          <Link to="/register" className="font-semibold text-brand-700">
            Create an account
          </Link>
        </p>
        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
          Admin demo login: <strong>admin@startsetu.gov.in</strong> / <strong>ChangeMe123!</strong>
        </div>
      </div>
    </div>
  );
}
