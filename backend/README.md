# Personal Dashboard — Backend API

Standalone **Express + MongoDB** API. No frontend code in this folder.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

- Listens on **`PORT`** (default `3000`)
- Health: `GET /health`
- REST routes under **`/api`**

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with `--watch` |
| `npm start` | Production `node src/server.js` |
| `npm run seed` | Sample logs/projects |

## Environment

Copy `.env.example` to `.env`. Important variables:

- `PORT` — API port
- `USE_MEMORY_MONGO` — `true` for dev without MongoDB installed
- `MONGODB_URI` — when using real MongoDB
- `SESSION_SECRET` — cookie signing
- `CLIENT_ORIGIN` — Vue app URL for CORS (e.g. `http://localhost:5173`)
- `GOOGLE_*`, `META_*`, `GITHUB_*` — OAuth (optional)

## Frontend

The React app lives in **`../frontend`**. Start it separately; in dev it proxies `/api` to this server.
