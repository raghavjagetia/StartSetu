import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const roleHome = { department: "/department", startup: "/startup" };

export default function Register() {
  const [form, setForm] = useState({
    role: "startup",
    full_name: "",
    org_name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await client.post("/api/auth/register", form);
      login(res.data.access_token, res.data.user);
      navigate(roleHome[res.data.user.role] || "/");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-16">
      <div className="card p-8">
        <h1 className="text-xl font-bold text-slate-900">Create your StartSetu account</h1>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {["startup", "department"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => update("role", r)}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold capitalize ${
                form.role === r ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-300 text-slate-600"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label">Your full name</label>
            <input className="input" required value={form.full_name} onChange={(e) => update("full_name", e.target.value)} />
          </div>
          <div>
            <label className="label">{form.role === "department" ? "Department name" : "Startup name"}</label>
            <input className="input" required value={form.org_name} onChange={(e) => update("org_name", e.target.value)} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-brand-700">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
