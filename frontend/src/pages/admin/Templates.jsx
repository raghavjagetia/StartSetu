import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../../api/client.js";
import { Spinner } from "../../components/ui.jsx";

const empty = { name: "", description: "", max_incorporation_years: 10, max_turnover_lakhs: 10000, require_dpiit: true, criteria_notes: "" };

export default function Templates() {
  const [templates, setTemplates] = useState(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await client.get("/api/admin/templates");
    setTemplates(res.data);
  }

  useEffect(() => {
    load();
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await client.post("/api/admin/templates", {
        ...form,
        max_incorporation_years: Number(form.max_incorporation_years),
        max_turnover_lakhs: Number(form.max_turnover_lakhs),
      });
      setForm(empty);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not create template");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    await client.delete(`/api/admin/templates/${id}`);
    load();
  }

  if (!templates) return <Spinner />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link to="/admin" className="text-sm font-medium text-brand-700">
        ← Back to dashboard
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">Evaluation criteria & templates</h1>
      <p className="mt-1 text-sm text-slate-500">
        Departments can start a new challenge from one of these relaxed-norm templates.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900">Existing templates</h2>
          <div className="mt-3 space-y-3">
            {templates.map((t) => (
              <div key={t.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-slate-800">{t.name}</div>
                    <p className="mt-1 text-xs text-slate-500">{t.description}</p>
                  </div>
                  <button className="text-xs text-rose-600" onClick={() => remove(t.id)}>
                    Delete
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="badge bg-slate-100">Incorporation ≤ {t.max_incorporation_years}y</span>
                  <span className="badge bg-slate-100">Turnover ≤ ₹{t.max_turnover_lakhs}L</span>
                  {t.require_dpiit && <span className="badge bg-slate-100">DPIIT required</span>}
                </div>
                {t.criteria_notes && <p className="mt-2 text-xs italic text-slate-400">{t.criteria_notes}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-slate-900">New template</h2>
          <form onSubmit={handleSubmit} className="mt-3 space-y-3">
            <div>
              <label className="label">Name</label>
              <input className="input" required value={form.name} onChange={(e) => update("name", e.target.value)} />
            </div>
            <div>
              <label className="label">Description</label>
              <input className="input" value={form.description} onChange={(e) => update("description", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Max incorporation (years)</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={form.max_incorporation_years}
                  onChange={(e) => update("max_incorporation_years", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Max turnover (₹ lakhs)</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={form.max_turnover_lakhs}
                  onChange={(e) => update("max_turnover_lakhs", e.target.value)}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={form.require_dpiit} onChange={(e) => update("require_dpiit", e.target.checked)} />
              Require DPIIT recognition
            </label>
            <div>
              <label className="label">Criteria notes / clause citation</label>
              <textarea className="input" value={form.criteria_notes} onChange={(e) => update("criteria_notes", e.target.value)} />
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <button className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Create template"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
