# Personal Dashboard — Frontend

Standalone **React 19 + Vite** app. No backend code in this folder.

## Setup

```bash
cp .env.example .env   # optional
npm install
npm run dev
```

Open **`http://localhost:5173`**.

## API connection

**Development:** leave `VITE_API_URL` unset. Vite proxies `/api` → `http://127.0.0.1:${VITE_DEV_API_PORT}` (default port `3000`). Start the API first:

```bash
cd ../backend && npm run dev
```

**Production build:** set `VITE_API_URL` to your deployed API (e.g. `https://api.example.com/api`):

```bash
VITE_API_URL=https://api.example.com/api npm run build
```

## Stack

- React 19, React Router 7
- Vite 5, Tailwind CSS 3
- Chart.js + react-chartjs-2
- Axios (session cookies via `withCredentials`)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production bundle in `dist/` |
| `npm run preview` | Preview production build |
