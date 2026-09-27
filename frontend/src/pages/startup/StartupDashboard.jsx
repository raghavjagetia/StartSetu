import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../../api/client.js";
import { EmptyState, Spinner, StatusBadge } from "../../components/ui.jsx";
import ProfileForm from "./ProfileForm.jsx";

const TABS = ["Open Challenges", "My Applications", "My Pilots", "My Profile"];

export default function StartupDashboard() {
  const [tab, setTab] = useState(TABS[0]);
  const [challenges, setChallenges] = useState([]);
  const [applications, setApplications] = useState([]);
  const [pilots, setPilots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyTarget, setApplyTarget] = useState(null);
  const [pitch, setPitch] = useState("");
  const [applyError, setApplyError] = useState("");
  const [applying, setApplying] = useState(false);

  async function loadAll() {
    setLoading(true);
    const [c, a, p] = await Promise.all([
      client.get("/api/challenges"),
      client.get("/api/applications/mine"),
      client.get("/api/pilots/mine"),
    ]);
    setChallenges(c.data);
    setApplications(a.data);
    setPilots(p.data);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  const appliedIds = new Set(applications.map((a) => a.challenge_id));

  async function submitApplication(e) {
    e.preventDefault();
    setApplying(true);
    setApplyError("");
    try {
      await client.post(`/api/challenges/${applyTarget.id}/apply`, { pitch });
      setApplyTarget(null);
      setPitch("");
      await loadAll();
      setTab("My Applications");
    } catch (err) {
      setApplyError(err.response?.data?.detail || "Could not submit application");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Startup dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">Browse challenges, apply, and track your pilots and payments.</p>

      <div className="mt-6 flex gap-2 overflow-x-auto border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-semibold ${
              tab === t ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {loading ? (
          <Spinner />
        ) : tab === "Open Challenges" ? (
          challenges.length === 0 ? (
            <EmptyState title="No open challenges yet" description="Check back soon — departments post new problem statements regularly." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {challenges.map((c) => (
                <div key={c.id} className="card p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-900">{c.title}</h3>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm text-slate-500">{c.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="badge bg-slate-100">{c.sector}</span>
                    {c.budget_max_lakhs && <span className="badge bg-slate-100">Budget ≤ ₹{c.budget_max_lakhs}L</span>}
                    <span className="badge bg-slate-100">Incorporation ≤ {c.max_incorporation_years}y</span>
                    <span className="badge bg-slate-100">Turnover ≤ ₹{c.max_turnover_lakhs}L</span>
                  </div>
                  <div className="mt-4 flex justify-between text-xs text-slate-400">
                    <span>Posted by {c.department_name || "Department"}</span>
                    <span>{c.application_count} applicants</span>
                  </div>
                  <button
                    className="btn-primary mt-4 w-full"
                    disabled={appliedIds.has(c.id) || c.status !== "open"}
                    onClick={() => setApplyTarget(c)}
                  >
                    {appliedIds.has(c.id) ? "Already applied" : "Apply now"}
                  </button>
                </div>
              ))}
            </div>
          )
        ) : tab === "My Applications" ? (
          applications.length === 0 ? (
            <EmptyState title="No applications yet" description="Apply to an open challenge to get started." />
          ) : (
            <div className="card divide-y divide-slate-100">
              {applications.map((a) => (
                <div key={a.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">{a.challenge_title}</div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs">
                      <StatusBadge status={a.status} />
                      <span className={`badge ${a.is_eligible ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                        {a.is_eligible ? "Eligible" : "Screened ineligible"}
                      </span>
                    </div>
                    <ul className="mt-2 space-y-1 text-xs text-slate-500">
                      {a.eligibility_reasons?.map((r, i) => (
                        <li key={i}>• {r}</li>
                      ))}
                    </ul>
                  </div>
                  {a.has_pilot && (
                    <Link to={`/pilots/${a.pilot_id}`} className="btn-secondary">
                      View pilot
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )
        ) : tab === "My Pilots" ? (
          pilots.length === 0 ? (
            <EmptyState title="No active pilots" description="Once a department approves your application, the pilot contract will show up here." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {pilots.map((p) => (
                <Link key={p.id} to={`/pilots/${p.id}`} className="card block p-5 hover:border-brand-300">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-900">{p.challenge_title}</h3>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">with {p.department_name}</p>
                  <div className="mt-3 text-sm text-slate-600">₹{p.total_amount_lakhs}L · {p.milestones.length} milestones</div>
                </Link>
              ))}
            </div>
          )
        ) : (
          <ProfileForm />
        )}
      </div>

      {applyTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="card w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-slate-900">Apply to “{applyTarget.title}”</h2>
            <form onSubmit={submitApplication} className="mt-4 space-y-3">
              <div>
                <label className="label">Short pitch</label>
                <textarea
                  className="input min-h-[120px]"
                  required
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                  placeholder="Why is your startup the right fit for this challenge?"
                />
              </div>
              {applyError && <p className="text-sm text-rose-600">{applyError}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={() => setApplyTarget(null)}>
                  Cancel
                </button>
                <button className="btn-primary" disabled={applying}>
                  {applying ? "Submitting…" : "Submit application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
