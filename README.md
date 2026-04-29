# Mini Insights

A small full-stack **insight generation** app: load business facts → compute KPIs and features → detect spike/drop **signals** → generate **insights** (rule-based with optional **local LLM** via Ollama). Includes a React dashboard to browse and drill into insights.

**Pipeline:** `Data → KPI → Feature → Signal → Insight → UI`

---

## Tech stack

| Layer | Choice |
|--------|--------|
| Frontend | React (Vite), React Router |
| Backend | Node.js, Express |
| Database | PostgreSQL via **Supabase** |
| LLM (optional) | **Ollama** (local), enriches insight text |

---

## Repository layout

```
Mini-insights/
├── backend/          # Express API
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── db/
│   └── .env.example
├── frontend/         # Vite + React
│   └── .env.example
└── README.md
```

---

## Prerequisites

- **Node.js** 18+ (22 LTS is fine)
- A **Supabase** project (Postgres + API keys)
- **Ollama** installed locally only if you want LLM-enriched insights (`ollama pull llama3.2` etc.)

---

## Backend setup

1. Copy environment template and fill in real values (never commit `.env`):

   ```bash
   cd backend
   cp .env.example .env
   ```

   Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from Supabase → **Settings → API**.

   For local LLM, set `OLLAMA_HOST` and `OLLAMA_MODEL` (see `.env.example`).

2. Install and run DB migration:

   In Supabase → **SQL Editor**, create the helper used by migrations (once):

   ```sql
   CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void
   LANGUAGE plpgsql SECURITY DEFINER AS $$
   BEGIN EXECUTE sql; END; $$;
   ```

   Then:

   ```bash
   npm install
   npm run migrate
   npm run seed
   ```

3. Start the API:

   ```bash
   npm run dev
   ```

   Default: `http://localhost:5000`  
   Health: `GET /health`

---

## Frontend setup

1. Copy env and point at your API:

   ```bash
   cd frontend
   cp .env.example .env
   ```

   Set `VITE_API_URL=http://localhost:5000` for local dev.

2. Install and run:

   ```bash
   npm install
   npm run dev
   ```

   Open the URL Vite prints (usually `http://localhost:5173`).

---

## Main API routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | DB connectivity check |
| GET | `/data` | Raw `fact_sales` (optional query filters) |
| GET | `/data/kpis` | Rows with computed KPIs |
| GET | `/data/kpis/summary` | Aggregated KPIs |
| GET | `/data/features` | Features (growth %, averages) |
| POST | `/run-pipeline` | Run detection + insights (JSON body) |
| GET | `/run-pipeline/stream` | Same pipeline with **SSE** progress events |
| GET | `/insights` | List insights + tags |
| GET | `/insights/:id` | Single insight detail |

---

## Running the full pipeline

1. Ensure backend is running and Ollama is up if you use LLM (optional).
2. From the dashboard, use **Run Pipeline**, or:

   ```bash
   curl -X POST http://localhost:5000/run-pipeline -H "Content-Type: application/json" -d "{}"
   ```

---

## Security notes

- Do **not** commit `backend/.env` or `frontend/.env`.
- The Supabase **service role** key bypasses RLS — use only on the server.
- Rotate keys if they are ever leaked.

---

## Production deployment (short)

- **Frontend (e.g. Netlify):** build `frontend`, set `VITE_API_URL` to your public API URL (no trailing slash).
- **Backend (e.g. Render/Railway):** deploy `backend`, set env vars from `.env.example`. Ollama usually stays local; for hosted LLM you’d swap `llmService` later.

---

## License

ISC (backend `package.json`). Adjust if you prefer MIT or another license.
