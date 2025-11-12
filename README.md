# QA Metric Dashboard (Micro SaaS)

Lightweight dashboard to centralize QA productivity & quality metrics.

## Stack
- Backend: Node.js + Express
- DB: SQLite (dev) / PostgreSQL (prod via DATABASE_URL)
- Frontend: HTML + Tailwind (CDN) + Alpine.js + Chart.js
- Auth: JWT (placeholder wiring)

## Quick Start (Dev)
```bash
npm install
npm run migrate
npm run seed
npm run dev
```
Visit http://localhost:3000

## Environment
Create `.env` (see `.env.example`). If `DATABASE_URL` is set and starts with `postgres://` it will use Postgres; otherwise SQLite `metrics.db`.

## Scripts
- `npm run migrate` – apply SQL in `migrations` (order by filename)
- `npm run seed` – seed sample data
- `npm run dev` – nodemon server

## API (excerpt)
GET /api/metrics/overview
GET/POST /api/projects
GET/POST/PATCH /api/test-runs
GET/POST/PATCH /api/defects
POST /api/metric-targets (upsert)

## Metrics
- Defect Detection Rate (DDR)
- Avg Execution Time (minutes per run)
- Coverage % (placeholder / manual target)
- Regression Failures (FAILED test runs)
- Blocked Tests (BLOCKED runs)

## Deployment
Set `PORT`, `DATABASE_URL`, `JWT_SECRET`.
Deploy on Render / Railway / Vercel (Edge functions not required).
