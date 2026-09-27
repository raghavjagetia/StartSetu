export function StatCard({ label, value, hint, accent = "brand" }) {
  const accents = {
    brand: "text-brand-700 bg-brand-50",
    saffron: "text-saffron-600 bg-orange-50",
    green: "text-emerald-700 bg-emerald-50",
    rose: "text-rose-700 bg-rose-50",
  };
  return (
    <div className="card p-5">
      <div className={`mb-2 inline-flex rounded-lg px-2 py-1 text-xs font-semibold ${accents[accent]}`}>{label}</div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

const statusColors = {
  open: "bg-emerald-50 text-emerald-700",
  closed: "bg-slate-100 text-slate-600",
  piloting: "bg-amber-50 text-amber-700",
  scaled: "bg-brand-50 text-brand-700",
  applied: "bg-slate-100 text-slate-600",
  shortlisted: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-rose-50 text-rose-700",
  active: "bg-amber-50 text-amber-700",
  completed: "bg-emerald-50 text-emerald-700",
  terminated: "bg-rose-50 text-rose-700",
  pending: "bg-slate-100 text-slate-600",
  submitted: "bg-amber-50 text-amber-700",
  verified: "bg-brand-50 text-brand-700",
  paid: "bg-emerald-50 text-emerald-700",
};

export function StatusBadge({ status }) {
  return (
    <span className={`badge capitalize ${statusColors[status] || "bg-slate-100 text-slate-600"}`}>{status}</span>
  );
}

export function EmptyState({ title, description }) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="text-base font-semibold text-slate-700">{title}</div>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex h-40 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
    </div>
  );
}
