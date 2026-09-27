import { Link } from "react-router-dom";

const steps = [
  {
    title: "Department posts a challenge",
    body: "An outcome-based problem statement with relaxed turnover, incorporation-age and DPIIT norms attached.",
  },
  {
    title: "Discovery engine screens startups",
    body: "Every DPIIT-recognized startup profile is run through the rules engine and ranked by problem-solution fit.",
  },
  {
    title: "Milestone-based pilot contract",
    body: "Department approves a match and issues a standard pilot agreement with structured, milestone-tied payments.",
  },
  {
    title: "Deliverables verified, dashboard updated",
    body: "Startups submit deliverables per milestone; departments verify and release payment; every role sees live status.",
  },
];

const roles = [
  {
    name: "Department",
    points: ["Post challenge / problem statement", "View matched & screened startups", "Approve pilot agreement & milestones", "Track pilot performance"],
  },
  {
    name: "Startup",
    points: ["Browse open challenges", "Apply with eligibility profile", "Receive milestone-based contract", "Submit deliverables & track payment"],
  },
  {
    name: "Admin",
    points: ["Manage evaluation criteria & templates", "View dashboard analytics & trends", "Manage users & roles", "Export procurement reports"],
  },
];

export default function Landing() {
  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600 text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
          <span className="badge bg-white/10 text-white">Maharashtra State Innovation Society · Smart India Hackathon 2026</span>
          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">
            A startup-friendly procurement mechanism for government innovation.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-brand-100">
            StartSetu helps departments identify, pilot, procure and scale innovative solutions from eligible
            startups — with relaxed norms, milestone contracting, and a fully auditable rules engine.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className="btn bg-saffron-500 text-white hover:bg-saffron-600">
              Get started free
            </Link>
            <Link to="/login" className="btn bg-white/10 text-white hover:bg-white/20">
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-slate-900">How StartSetu works</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="card p-6">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                {i + 1}
              </div>
              <h3 className="font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold text-slate-900">One platform, three roles</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {roles.map((r) => (
              <div key={r.name} className="card p-6">
                <h3 className="text-lg font-bold text-brand-800">{r.name}</h3>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {r.points.map((p) => (
                    <li key={p} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-saffron-500" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="card grid gap-6 p-8 sm:grid-cols-3">
          <div>
            <div className="text-3xl font-extrabold text-brand-800">Rules-as-code</div>
            <p className="mt-2 text-sm text-slate-500">
              Every eligibility relaxation cites the criteria it's built from — auditable per application.
            </p>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-brand-800">Milestone contracts</div>
            <p className="mt-2 text-sm text-slate-500">
              Deterministic, milestone-based agreements replace slow manual legal drafting.
            </p>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-brand-800">State-wide ready</div>
            <p className="mt-2 text-sm text-slate-500">
              Architecture designed to extend to district-level and multi-department procurement.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-400">
        StartSetu — Smart India Hackathon 2026 · Team KO_KRAKENS · PS 26136
      </footer>
    </div>
  );
}
