# Personal Life Dashboard

Full-stack **personal OS** for habits, job search, and daily metrics: **Express + MongoDB** API and **Vue 3 + Tailwind + Chart.js** dashboard.

## Quick start (from repo root)

First time (installs root tooling + server + client deps):

```bash
npm run setup
cp server/.env.example server/.env   # if you don’t have server/.env yet
npm run dev
```

- **API:** `http://localhost:3000` — health: `GET /health`
- **App:** `http://localhost:5173` (Vite proxies `/api` → API)

One terminal runs **both** API and UI (`concurrently`).

### Git branches

**Use `main` for normal development** (full stack in one clone). The other two branches exist so you can deploy or open **only** the client or **only** the server from a smaller tree—not because you are expected to merge them back like a feature branch.

| Branch | When to use it |
|--------|----------------|
| **`main`** | Default. Full monorepo: `client/` + `server/`, `npm run dev` runs both, `docker-compose.yml` at repo root. |
| **`frontend`** | Vue app only (no `server/`). Point `VITE_API_URL` at your API, or use Vite proxy to a running backend. |
| **`backend`** | API only (no `client/`). Mongo: copy `docker-compose.yml` from `main` or set `MONGODB_URI` yourself. |

#### On GitHub: “Compare & pull request” after a push

If you push `frontend` or `backend`, GitHub often shows a yellow bar suggesting a PR into `main`. That is **automatic** for any non-default branch—it does **not** mean your repo is misconfigured. You can **ignore or dismiss** those prompts: `frontend` / `backend` here are **parallel slices** of the project, not unfinished work that must be merged into `main`. Open a PR only if you deliberately want to fold one branch’s history into another.

### Manual two-terminal workflow

```bash
cd server && npm run dev
cd client && npm run dev
```

## What’s included

| Area | Details |
|------|---------|
| **Auth** | Register / login, bcrypt, sessions in MongoDB (`connect-mongo`), cookie `sid` |
| **Profile** | Onboarding profile + optional skip when “complete”; edit via **Profile** with `?edit=1` |
| **Dashboard** | Daily log (steps, screen, coding, mood), **extended metrics** (calories, music min, job apps, sleep, …), goals, projects, charts |
| **Data** | `docs/PERSONAL_DASHBOARD_ROADMAP.md` — product roadmap & API realism |

## Prerequisites

- Node.js 18+
- MongoDB: optional in dev — default **`USE_MEMORY_MONGO=true`** in `server/.env` uses an in-memory DB (data lost when the process stops). For persistence: **`USE_MEMORY_MONGO=false`** + `MONGODB_URI`, or `docker compose up -d` for local Mongo on port 27017.

## Environment (`server/.env`)

See `server/.env.example`: `PORT`, `MONGODB_URI`, `USE_MEMORY_MONGO`, `SESSION_SECRET`, `CLIENT_ORIGIN`.

## Project layout

```
personalDashboad/
├── package.json            # npm run dev (API + client), setup, seed
├── docker-compose.yml      # MongoDB on :27017
├── docs/
│   └── PERSONAL_DASHBOARD_ROADMAP.md
├── server/                 # Express API
│   └── src/
│       ├── models/         # User, DailyLog, Project, Goal
│       ├── routes/         # auth, profile, logs, projects, goals, insights
│       ├── utils/          # profileMerge, …
│       └── ...
└── client/                 # Vue 3 (Vite)
    └── src/
        ├── pages/          # DashboardPage, Login, Register, Profile
        ├── router/
        └── constants/      # dailyMetrics, profileDefaults
```

## Backend setup (only)

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

Optional: `npm run seed` for sample logs/projects.

## Frontend build

```bash
npm run build
```

(from root: `npm run build` builds the client)

Set `VITE_API_URL` on the client if the API is not proxied (e.g. static hosting).

## API summary

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Sign up (bcrypt); session |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/me` | `{ user, profileComplete }` |
| GET, PUT | `/api/profile` | Profile (session required) |
| POST | `/api/logs` | Upsert daily log (includes optional `metrics` object) |
| GET | `/api/logs` | All logs |
| GET | `/api/logs/:date` | Log by `YYYY-MM-DD` |
| POST | `/api/projects` | Create project |
| GET | `/api/projects` | List |
| PATCH | `/api/projects/:id` | Update |
| GET | `/api/goals` | Goals |
| POST | `/api/goals` | Set goals |
| GET | `/api/insights/today` | Today vs goals + Instagram band |

## Next steps

See **`docs/PERSONAL_DASHBOARD_ROADMAP.md`** for integrations (Spotify, Strava, GitHub, webhooks, etc.).
