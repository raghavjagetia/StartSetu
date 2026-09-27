import { useEffect, useState } from "react";
import client from "../../api/client.js";

const SECTORS = ["Any", "AgriTech", "HealthTech", "EdTech", "CleanTech", "FinTech", "GovTech", "Mobility", "Other"];

export default function ChallengeForm({ onClose, onCreated }) {
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    sector: "Any",
    budget_max_lakhs: "",
    max_incorporation_years: 10,
    max_turnover_lakhs: 10000,
    require_dpiit: true,
    deadline: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    client
      .get("/api/admin/templates")
      .then((res) => setTemplates(res.data))
      .catch(() => setTemplates([]));
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function applyTemplate(id) {
    const t = templates.find((tpl) => tpl.id === Number(id));
    if (!t) return;
    setForm((f) => ({
      ...f,
      max_incorporation_years: t.max_incorporation_years,
      max_turnover_lakhs: t.max_turnover_lakhs,
      require_dpiit: t.require_dpiit,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await client.post("/api/challenges", {
        ...form,
        budget_max_lakhs: form.budget_max_lakhs ? Number(form.budget_max_lakhs) : null,
        max_incorporation_years: Number(form.max_incorporation_years),
        max_turnover_lakhs: Number(form.max_turnover_lakhs),
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not post challenge");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-slate-900/40 px-4 py-8">
      <div className="card w-full max-w-2xl p-6">
        <h2 className="text-lg font-bold text-slate-900">Post a new challenge</h2>

        {templates.length > 0 && (
          <div className="mt-4">
            <label className="label">Start from an evaluation template</label>
            <select className="input" onChange={(e) => applyTemplate(e.target.value)} defaultValue="">
              <option value="" disabled>
                Choose a template (optional)
              </option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Title</label>
            <input className="input" required value={form.title} onChange={(e) => update("title", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Outcome-based description</label>
            <textarea
              className="input min-h-[100px]"
              required
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Sector</label>
            <select className="input" value={form.sector} onChange={(e) => update("sector", e.target.value)}>
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Max budget (₹ lakhs)</label>
            <input className="input" type="number" min="0" value={form.budget_max_lakhs} onChange={(e) => update("budget_max_lakhs", e.target.value)} />
          </div>
          <div>
            <label className="label">Relaxed incorporation limit (years)</label>
            <input
              className="input"
              type="number"
              min="1"
              value={form.max_incorporation_years}
              onChange={(e) => update("max_incorporation_years", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Relaxed turnover cap (₹ lakhs)</label>
            <input
              className="input"
              type="number"
              min="0"
              value={form.max_turnover_lakhs}
              onChange={(e) => update("max_turnover_lakhs", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Application deadline</label>
            <input className="input" type="date" value={form.deadline} onChange={(e) => update("deadline", e.target.value)} />
          </div>
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={form.require_dpiit} onChange={(e) => update("require_dpiit", e.target.checked)} />
              Require DPIIT recognition
            </label>
          </div>
          {error && <p className="text-sm text-rose-600 sm:col-span-2">{error}</p>}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" disabled={saving}>
              {saving ? "Posting…" : "Post challenge"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
