import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../../api/client.js";
import { Spinner, StatCard } from "../../components/ui.jsx";
import { StatusBarChart, TrendChart } from "../../components/charts.jsx";

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    client.get("/api/admin/analytics").then((res) => setData(res.data));
  }, []);

  async function exportPilots() {
    const res = await client.get("/api/admin/export/pilots", { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = "startsetu_pilots.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  }

  if (!data) return <Spinner />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Procurement analytics, evaluation templates, and reports.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/templates" className="btn-secondary">
            Manage templates
          </Link>
          <button className="btn-primary" onClick={exportPilots}>
            ⬇ Export pilots (CSV)
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Challenges" value={data.total_challenges} hint={`${data.open_challenges} currently open`} />
        <StatCard label="Startups" value={data.total_startups} accent="saffron" hint={`${data.total_departments} departments`} />
        <StatCard
          label="Applications"
          value={data.total_applications}
          accent="green"
          hint={`${data.eligible_applications} screened eligible`}
        />
        <StatCard label="Active pilots" value={data.active_pilots} accent="rose" hint={`${data.completed_pilots} completed`} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <StatCard label="Committed value" value={`₹${data.total_committed_lakhs}L`} hint="Across all pilot contracts" />
        <StatCard
          label="Paid out"
          value={`₹${data.total_paid_lakhs}L`}
          accent="green"
          hint={`${data.paid_milestones} of ${data.total_milestones} milestones paid`}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900">Challenges posted per month</h2>
          <div className="mt-2">
            <TrendChart data={data.challenges_by_month} />
          </div>
        </div>
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900">Pilots by status</h2>
          <div className="mt-2">
            <StatusBarChart data={data.pilots_by_status} categoryKey="status" />
          </div>
        </div>
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-semibold text-slate-900">Milestones by status</h2>
          <div className="mt-2">
            <StatusBarChart data={data.milestones_by_status} categoryKey="status" />
          </div>
        </div>
      </div>
    </div>
  );
}
