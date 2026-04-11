# Personal Life Dashboard — Backend

Express + MongoDB API. This **`backend`** branch contains **only the `server/` app**.

The Vue UI lives on the **`frontend`** branch; full stack is on **`main`**.

## Setup

```bash
npm run setup
cp server/.env.example server/.env
# Edit server/.env — MONGODB_URI, SESSION_SECRET, CLIENT_ORIGIN, etc.
npm run dev
```

API: **http://localhost:3000** — health: `GET /health`, routes under **`/api`**.

## MongoDB

- Dev: `USE_MEMORY_MONGO=true` in `server/.env` (no local install).
- Persistent: `USE_MEMORY_MONGO=false` + `MONGODB_URI`, or `docker compose up -d` from **`main`** (this branch has no `docker-compose.yml`; copy it from `main` or run Mongo yourself).

## Seed

```bash
npm run seed
```

## Branches

| Branch     | Contents        |
|-----------|-----------------|
| `main`    | `client/` + `server/` |
| `frontend`| `client/` only   |
| `backend` | `server/` only   |
