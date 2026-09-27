# StartSetu

Startup-friendly public procurement platform — built for **Smart India Hackathon 2026**,
PS 26136 (Maharashtra State Innovation Society). Team **KO_KRAKENS**.

StartSetu lets a government **department** post an outcome-based problem statement, runs a
deterministic **rules engine** that screens every DPIIT-recognized **startup** profile against
relaxed turnover/incorporation norms, and turns an approved match into a **milestone-based pilot
contract** with deliverable submission, verification and payment tracking. An **admin** role
manages the eligibility templates and sees platform-wide analytics.

## Stack

- **Backend:** FastAPI + SQLAlchemy, JWT auth, a real rules-based eligibility/matching engine,
  CSV export, file uploads for milestone deliverables. SQLite for local dev, PostgreSQL in
  production (Render).
- **Frontend:** React + Vite + Tailwind CSS, role-based dashboards (Department / Startup / Admin),
  Recharts analytics.
- **Deploy:** Docker for both services, plus a `render.yaml` Blueprint for one-click Render deploy.

## Project layout

```
backend/    FastAPI app (app/), requirements.txt, Dockerfile
frontend/   React + Vite app (src/), Dockerfile
render.yaml Render Blueprint (backend web service + frontend static site + Postgres)
```

## Run locally

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Uses SQLite by default (`backend/startsetu.db`, git-ignored) — no setup required. On first
startup it seeds an admin account:

- **Email:** `admin@startsetu.gov.in`
- **Password:** `ChangeMe123!` (change via `ADMIN_PASSWORD` env var)

Copy `backend/.env.example` to `backend/.env` to override any setting.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens on `http://localhost:5173` and proxies `/api` and `/uploads` to `http://127.0.0.1:8000`
(configurable via `VITE_DEV_API_PROXY`). Register a **department** and a **startup** account to
try the full flow: post a challenge → apply → approve with milestones → submit deliverable →
verify → payment tracked on the admin dashboard.

### Docker (optional, for local containerized dev)

```bash
docker build -t startsetu-backend ./backend
docker run -p 8000:8000 startsetu-backend

docker build -t startsetu-frontend --build-arg VITE_API_URL=http://localhost:8000 ./frontend
docker run -p 4173:4173 startsetu-frontend
```

## Deploy to Render

1. Push this repo to GitHub.
2. In the Render dashboard: **New → Blueprint**, point it at the repo. Render reads
   `render.yaml` and provisions three resources:
   - `startsetu-backend` — FastAPI web service (free plan)
   - `startsetu-frontend` — static site built from `frontend/`
   - `startsetu-db` — free Postgres instance, wired to the backend via `DATABASE_URL`
3. Render auto-generates `SECRET_KEY` and `ADMIN_PASSWORD`. After the first deploy, open the
   backend service → **Environment** and copy the generated `ADMIN_PASSWORD` (or set your own).
4. **Cross-link the two services' real URLs** (Render assigns the final hostnames on first
   deploy, so this is a one-time manual step):
   - Backend service → **Environment** → set `ALLOWED_ORIGINS` to your frontend's URL
     (e.g. `https://startsetu-frontend.onrender.com`).
   - Frontend service → **Environment** → set `VITE_API_URL` to your backend's URL
     (e.g. `https://startsetu-backend.onrender.com`), then trigger **Manual Deploy** so Vite
     rebuilds with the new value baked in (it's a build-time variable).
5. Visit the frontend URL, log in as admin, and start posting challenges.

> Free-tier Render web services spin down when idle and file storage (milestone deliverable
> uploads) is ephemeral — fine for a hackathon demo, not for production. For production, move
> uploads to S3-compatible object storage (the proposal's roadmap already calls this out).

## What's real vs. roadmap

Matches the proposal's MVP/planned split:

| Area | MVP (built) | Roadmap |
|---|---|---|
| Matching | Deterministic rules engine + fit-score ranking | NLP-based problem-solution fit scoring |
| Auth | JWT, role-based access | SSO / Startup India Hub login |
| Data | PostgreSQL (Render) / SQLite (local) | — |
| Storage | Local disk for deliverables | AWS S3 |
| Integrations | — | Startup India Hub, GeM, district startup DBs |
