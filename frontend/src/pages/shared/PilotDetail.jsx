import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client, { fileUrl } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Spinner, StatusBadge } from "../../components/ui.jsx";

export default function PilotDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pilot, setPilot] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await client.get(`/api/pilots/${id}`);
    setPilot(res.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading || !pilot) return <Spinner />;

  const paid = pilot.milestones.filter((m) => m.status === "paid").reduce((s, m) => s + m.amount_lakhs, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <button className="text-sm font-medium text-brand-700" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="card mt-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{pilot.challenge_title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {pilot.department_name} × {pilot.startup_name}
            </p>
          </div>
          <StatusBadge status={pilot.status} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <div className="text-slate-400">Contract value</div>
            <div className="font-semibold text-slate-800">₹{pilot.total_amount_lakhs}L</div>
          </div>
          <div>
            <div className="text-slate-400">Paid so far</div>
            <div className="font-semibold text-emerald-700">₹{paid}L</div>
          </div>
          <div>
            <div className="text-slate-400">Milestones</div>
            <div className="font-semibold text-slate-800">{pilot.milestones.length}</div>
          </div>
        </div>
        <details className="mt-4 text-sm text-slate-600">
          <summary className="cursor-pointer font-medium text-brand-700">Pilot agreement terms</summary>
          <p className="mt-2 whitespace-pre-wrap">{pilot.contract_terms}</p>
        </details>
      </div>

      <h2 className="mt-8 text-lg font-bold text-slate-900">Milestones</h2>
      <div className="mt-4 space-y-4">
        {pilot.milestones.map((m) => (
          <MilestoneCard key={m.id} milestone={m} role={user.role} onChanged={load} />
        ))}
      </div>
    </div>
  );
}

function MilestoneCard({ milestone, role, onChanged }) {
  const [note, setNote] = useState(milestone.deliverable_note || "");
  const [file, setFile] = useState(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("deliverable_note", note);
      if (file) formData.append("file", file);
      await client.post(`/api/milestones/${milestone.id}/submit`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChanged();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not submit deliverable");
    } finally {
      setBusy(false);
    }
  }

  async function verify(approve) {
    setBusy(true);
    setError("");
    try {
      await client.post(`/api/milestones/${milestone.id}/verify`, { approve, comment });
      onChanged();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not verify milestone");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-900">{milestone.title}</h3>
          {milestone.description && <p className="mt-1 text-sm text-slate-500">{milestone.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className="badge bg-slate-100">₹{milestone.amount_lakhs}L</span>
          <StatusBadge status={milestone.status} />
        </div>
      </div>

      {milestone.deliverable_note && (
        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
          <span className="font-medium">Deliverable note: </span>
          {milestone.deliverable_note}
          {milestone.deliverable_file && (
            <a href={fileUrl(milestone.deliverable_file)} target="_blank" rel="noreferrer" className="ml-2 font-medium text-brand-700 underline">
              View file
            </a>
          )}
        </div>
      )}
      {milestone.review_comment && (
        <div className="mt-2 text-xs text-slate-500">Reviewer comment: {milestone.review_comment}</div>
      )}

      {role === "startup" && milestone.status === "pending" && (
        <form onSubmit={submit} className="mt-4 space-y-2 border-t border-slate-100 pt-4">
          <label className="label">Submit deliverable</label>
          <textarea className="input" required value={note} onChange={(e) => setNote(e.target.value)} placeholder="Describe what you delivered…" />
          <input type="file" onChange={(e) => setFile(e.target.files[0])} className="text-sm" />
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button className="btn-primary" disabled={busy}>
            {busy ? "Submitting…" : "Submit for verification"}
          </button>
        </form>
      )}

      {role === "department" && milestone.status === "submitted" && (
        <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
          <label className="label">Review comment (optional)</label>
          <input className="input" value={comment} onChange={(e) => setComment(e.target.value)} />
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <div className="flex gap-2">
            <button className="btn-danger" disabled={busy} onClick={() => verify(false)}>
              Reject
            </button>
            <button className="btn-primary" disabled={busy} onClick={() => verify(true)}>
              Verify & release payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
