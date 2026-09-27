import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client from "../../api/client.js";
import { Spinner, StatusBadge } from "../../components/ui.jsx";

export default function ChallengeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [matches, setMatches] = useState([]);
  const [applications, setApplications] = useState([]);
  const [tab, setTab] = useState("Applications");
  const [loading, setLoading] = useState(true);
  const [approveTarget, setApproveTarget] = useState(null);

  async function loadAll() {
    setLoading(true);
    const [c, m, a] = await Promise.all([
      client.get(`/api/challenges/${id}`),
      client.get(`/api/challenges/${id}/matches`),
      client.get(`/api/challenges/${id}/applications`),
    ]);
    setChallenge(c.data);
    setMatches(m.data);
    setApplications(a.data);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function closeChallenge() {
    await client.patch(`/api/challenges/${id}`, { status: "closed" });
    loadAll();
  }

  async function reject(applicationId) {
    await client.post(`/api/applications/${applicationId}/reject`, {});
    loadAll();
  }

  if (loading || !challenge) return <Spinner />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <button className="text-sm font-medium text-brand-700" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="card mt-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{challenge.title}</h1>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <StatusBadge status={challenge.status} />
              <span className="badge bg-slate-100">{challenge.sector}</span>
              <span className="badge bg-slate-100">Incorporation ≤ {challenge.max_incorporation_years}y</span>
              <span className="badge bg-slate-100">Turnover ≤ ₹{challenge.max_turnover_lakhs}L</span>
              {challenge.require_dpiit && <span className="badge bg-slate-100">DPIIT required</span>}
            </div>
          </div>
          {challenge.status === "open" && (
            <button className="btn-secondary" onClick={closeChallenge}>
              Close applications
            </button>
          )}
        </div>
        <p className="mt-4 text-sm text-slate-600">{challenge.description}</p>
      </div>

      <div className="mt-6 flex gap-2 border-b border-slate-200">
        {["Applications", "Discovery matches"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm font-semibold ${
              tab === t ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500"
            }`}
          >
            {t} {t === "Applications" ? `(${applications.length})` : `(${matches.length})`}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "Applications" ? (
          applications.length === 0 ? (
            <p className="text-sm text-slate-500">No applications received yet.</p>
          ) : (
            <div className="card divide-y divide-slate-100">
              {applications.map((a) => (
                <div key={a.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900">{a.startup_name}</span>
                      <StatusBadge status={a.status} />
                      <span className={`badge ${a.is_eligible ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                        {a.is_eligible ? "Eligible" : "Ineligible"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{a.pitch}</p>
                    <ul className="mt-2 space-y-1 text-xs text-slate-500">
                      {a.eligibility_reasons?.map((r, i) => (
                        <li key={i}>• {r}</li>
                      ))}
                    </ul>
                  </div>
                  {a.status === "applied" && (
                    <div className="flex shrink-0 gap-2">
                      <button className="btn-secondary" onClick={() => reject(a.id)}>
                        Reject
                      </button>
                      <button className="btn-primary" onClick={() => setApproveTarget(a)}>
                        Approve &amp; contract
                      </button>
                    </div>
                  )}
                  {a.status === "approved" && (
                    <button className="btn-secondary shrink-0" onClick={() => navigate(`/pilots/${a.pilot_id}`)}>
                      View pilot
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        ) : matches.length === 0 ? (
          <p className="text-sm text-slate-500">No startup profiles found yet.</p>
        ) : (
          <div className="card divide-y divide-slate-100">
            {matches.map((m) => (
              <div key={m.startup_id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">{m.startup_name}</span>
                    <span className={`badge ${m.is_eligible ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                      {m.is_eligible ? "Eligible" : "Ineligible"}
                    </span>
                    <span className="badge bg-brand-50 text-brand-700">Fit score {m.fit_score}</span>
                    {m.already_applied && <span className="badge bg-slate-100">Already applied</span>}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {m.email} · {m.sector || "sector n/a"}
                  </div>
                  <ul className="mt-2 space-y-1 text-xs text-slate-500">
                    {m.reasons.map((r, i) => (
                      <li key={i}>• {r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {approveTarget && (
        <ApproveModal
          application={approveTarget}
          onClose={() => setApproveTarget(null)}
          onDone={() => {
            setApproveTarget(null);
            loadAll();
          }}
        />
      )}
    </div>
  );
}

function ApproveModal({ application, onClose, onDone }) {
  const [milestones, setMilestones] = useState([{ title: "Kickoff & requirements sign-off", description: "", amount_lakhs: "", due_date: "" }]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function updateMilestone(i, field, value) {
    setMilestones((ms) => ms.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)));
  }

  function addMilestone() {
    setMilestones((ms) => [...ms, { title: "", description: "", amount_lakhs: "", due_date: "" }]);
  }

  function removeMilestone(i) {
    setMilestones((ms) => ms.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await client.post(`/api/applications/${application.id}/approve`, {
        milestones: milestones.map((m) => ({
          title: m.title,
          description: m.description,
          amount_lakhs: Number(m.amount_lakhs) || 0,
          due_date: m.due_date ? new Date(m.due_date).toISOString() : null,
        })),
      });
      onDone();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not approve application");
    } finally {
      setSaving(false);
    }
  }

  const total = milestones.reduce((sum, m) => sum + (Number(m.amount_lakhs) || 0), 0);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-slate-900/40 px-4 py-8">
      <div className="card w-full max-w-2xl p-6">
        <h2 className="text-lg font-bold text-slate-900">Approve {application.startup_name} — set milestones</h2>
        <p className="mt-1 text-sm text-slate-500">Structured, milestone-tied payments per the standard StartSetu pilot agreement.</p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {milestones.map((m, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Milestone {i + 1}</span>
                {milestones.length > 1 && (
                  <button type="button" className="text-xs text-rose-600" onClick={() => removeMilestone(i)}>
                    Remove
                  </button>
                )}
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <input
                  className="input sm:col-span-2"
                  placeholder="Title"
                  required
                  value={m.title}
                  onChange={(e) => updateMilestone(i, "title", e.target.value)}
                />
                <input
                  className="input sm:col-span-2"
                  placeholder="Description"
                  value={m.description}
                  onChange={(e) => updateMilestone(i, "description", e.target.value)}
                />
                <input
                  className="input"
                  type="number"
                  min="0"
                  placeholder="Amount (₹ lakhs)"
                  required
                  value={m.amount_lakhs}
                  onChange={(e) => updateMilestone(i, "amount_lakhs", e.target.value)}
                />
                <input className="input" type="date" value={m.due_date} onChange={(e) => updateMilestone(i, "due_date", e.target.value)} />
              </div>
            </div>
          ))}
          <button type="button" className="btn-secondary" onClick={addMilestone}>
            + Add milestone
          </button>

          <div className="text-sm font-semibold text-slate-700">Total contract value: ₹{total}L</div>

          {error && <p className="text-sm text-rose-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" disabled={saving}>
              {saving ? "Creating pilot…" : "Approve & create pilot"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
