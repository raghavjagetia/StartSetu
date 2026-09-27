import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../../api/client.js";
import { EmptyState, Spinner, StatCard, StatusBadge } from "../../components/ui.jsx";
import ChallengeForm from "./ChallengeForm.jsx";

export default function DepartmentDashboard() {
  const [challenges, setChallenges] = useState([]);
  const [pilots, setPilots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function loadAll() {
    setLoading(true);
    const [c, p] = await Promise.all([client.get("/api/challenges"), client.get("/api/pilots/mine")]);
    setChallenges(c.data);
    setPilots(p.data);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  const openCount = challenges.filter((c) => c.status === "open").length;
  const applicantCount = challenges.reduce((sum, c) => sum + c.application_count, 0);
  const activePilots = pilots.filter((p) => p.status === "active").length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Department dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Post challenges, screen matched startups, and track pilots.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + Post a challenge
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            <StatCard label="Challenges" value={challenges.length} hint={`${openCount} open`} />
            <StatCard label="Applicants" value={applicantCount} accent="saffron" />
            <StatCard label="Active pilots" value={activePilots} accent="green" />
            <StatCard label="Total pilots" value={pilots.length} accent="rose" />
          </div>

          <h2 className="mt-8 text-lg font-bold text-slate-900">Your challenges</h2>
          {challenges.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="No challenges posted yet" description="Post your first outcome-based problem statement to start matching with startups." />
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {challenges.map((c) => (
                <Link key={c.id} to={`/department/challenges/${c.id}`} className="card block p-5 hover:border-brand-300">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-900">{c.title}</h3>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-500">{c.description}</p>
                  <div className="mt-3 text-xs text-slate-400">{c.application_count} applicants · {c.sector}</div>
                </Link>
              ))}
            </div>
          )}

          <h2 className="mt-8 text-lg font-bold text-slate-900">Pilots</h2>
          {pilots.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="No pilots yet" description="Approve a startup application to launch your first milestone-based pilot." />
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {pilots.map((p) => (
                <Link key={p.id} to={`/pilots/${p.id}`} className="card block p-5 hover:border-brand-300">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-900">{p.challenge_title}</h3>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">with {p.startup_name}</p>
                  <div className="mt-3 text-sm text-slate-600">₹{p.total_amount_lakhs}L · {p.milestones.length} milestones</div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {showForm && (
        <ChallengeForm
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            loadAll();
          }}
        />
      )}
    </div>
  );
}
