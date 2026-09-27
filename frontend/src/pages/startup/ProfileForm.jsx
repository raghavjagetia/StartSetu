import { useEffect, useState } from "react";
import client from "../../api/client.js";
import { Spinner } from "../../components/ui.jsx";

const SECTORS = ["AgriTech", "HealthTech", "EdTech", "CleanTech", "FinTech", "GovTech", "Mobility", "Other"];

export default function ProfileForm() {
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    client
      .get("/api/profile/startup")
      .then((res) =>
        setForm({
          ...res.data,
          incorporation_date: res.data.incorporation_date ? res.data.incorporation_date.slice(0, 10) : "",
        })
      )
      .catch(() =>
        setForm({
          startup_name: "",
          dpiit_number: "",
          incorporation_date: "",
          sector: SECTORS[0],
          annual_turnover_lakhs: 0,
          team_size: 1,
          description: "",
          website: "",
          state: "",
        })
      );
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setSaved(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await client.put("/api/profile/startup", {
        ...form,
        incorporation_date: form.incorporation_date ? new Date(form.incorporation_date).toISOString() : null,
        annual_turnover_lakhs: Number(form.annual_turnover_lakhs) || 0,
        team_size: Number(form.team_size) || 1,
      });
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  if (!form) return <Spinner />;

  return (
    <div className="card max-w-2xl p-6">
      <h2 className="text-lg font-bold text-slate-900">Eligibility profile</h2>
      <p className="mt-1 text-sm text-slate-500">
        This is what the rules engine checks against every challenge's relaxed norms.
      </p>
      <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Startup name</label>
          <input className="input" required value={form.startup_name} onChange={(e) => update("startup_name", e.target.value)} />
        </div>
        <div>
          <label className="label">DPIIT recognition number</label>
          <input className="input" value={form.dpiit_number || ""} onChange={(e) => update("dpiit_number", e.target.value)} placeholder="DIPP12345" />
        </div>
        <div>
          <label className="label">Incorporation date</label>
          <input
            className="input"
            type="date"
            required
            value={form.incorporation_date || ""}
            onChange={(e) => update("incorporation_date", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Sector</label>
          <select className="input" value={form.sector || SECTORS[0]} onChange={(e) => update("sector", e.target.value)}>
            {SECTORS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Annual turnover (₹ lakhs)</label>
          <input
            className="input"
            type="number"
            min="0"
            value={form.annual_turnover_lakhs}
            onChange={(e) => update("annual_turnover_lakhs", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Team size</label>
          <input className="input" type="number" min="1" value={form.team_size} onChange={(e) => update("team_size", e.target.value)} />
        </div>
        <div>
          <label className="label">State</label>
          <input className="input" value={form.state || ""} onChange={(e) => update("state", e.target.value)} placeholder="Maharashtra" />
        </div>
        <div>
          <label className="label">Website</label>
          <input className="input" value={form.website || ""} onChange={(e) => update("website", e.target.value)} placeholder="https://" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Description</label>
          <textarea
            className="input min-h-[100px]"
            value={form.description || ""}
            onChange={(e) => update("description", e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-rose-600 sm:col-span-2">{error}</p>}
        <div className="sm:col-span-2">
          <button className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </button>
          {saved && <span className="ml-3 text-sm font-medium text-emerald-600">Saved ✓</span>}
        </div>
      </form>
    </div>
  );
}
