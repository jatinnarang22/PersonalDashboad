# Personal Dashboard

Only two folders:

```
backend/    → API (Express + MongoDB)     http://localhost:3000
frontend/   → UI (React + Vite)           http://localhost:5173
```

## Run

**Terminal 1**
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

**Terminal 2**
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

## Optional

- **`docker-compose.yml`** — local MongoDB (only if `USE_MEMORY_MONGO=false` in `backend/.env`)
