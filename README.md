# Personal Life Dashboard — Frontend

Vue 3 + Vite + Tailwind + Chart.js. This **`frontend`** branch contains **only the `client/` app**.

The API lives on the **`backend`** branch; full stack is on **`main`**.

## Setup

```bash
npm run setup
cp client/.env.example client/.env   # optional: set VITE_API_URL if API is not proxied
npm run dev
```

Opens **http://localhost:5173**. In development, Vite proxies `/api` to `http://localhost:3000` — run the API locally from the `backend` branch (or `main`).

## Build

```bash
npm run build
npm run preview
```

## Branches

| Branch     | Contents        |
|-----------|-----------------|
| `main`    | `client/` + `server/` |
| `frontend`| `client/` only   |
| `backend` | `server/` only   |
