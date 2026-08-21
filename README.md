# Red-Box

<p align="center">
  <img src="client/public/favicon.svg" width="72" height="72" alt="Red-Box" />
</p>

<p align="center">
  <strong>Anonymous civic reports in, grounded government intelligence out.</strong><br />
  Citizens file potholes, water, garbage, and safety issues without exposing identity on the public feed.<br />
  Officers see clusters, ward trends, and briefings that are required to match stored counts — not invented metrics.
</p>

<p align="center">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img alt="Express" src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img alt="LangGraph" src="https://img.shields.io/badge/LangGraph-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white" />
  <img alt="Groq" src="https://img.shields.io/badge/Groq-F55036?style=for-the-badge" />
  <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
</p>

<p align="center">
  <code>anonymous-reporting</code> · <code>civic-tech</code> · <code>langgraph</code> · <code>groq</code> · <code>rag</code> · <code>ward-analytics</code>
</p>

---

## What it does

| Citizen | Government |
| --- | --- |
| File a report with location | KPI tiles from stored complaint counts |
| Public cards always say **Anonymous citizen** | Duplicate clusters (same street, paraphrased filings) |
| Pre-submit safety check | Ward chart, briefing, Ask, CSV / JSON / PDF |
| Status updates on the feed | Override category / department when review is needed |

Identity (`author_id`) is stored for the account that filed. It is **never** returned on public complaint DTOs.

---

## Architecture

```mermaid
flowchart LR
  subgraph Browser
    L[City landing /]
    A[CivicPulse /app/]
  end

  subgraph Node
    E[Express :3001]
    J[(civic.json)]
  end

  subgraph Python
    G[LangGraph :8001]
    KB[departments.md]
  end

  subgraph Models
    Groq[Groq LLM]
    Oll[Ollama optional]
    OR[OpenRouter fallback]
  end

  L -->|redirects| A
  A -->|/api| E
  E --> J
  E -->|classify / cluster / ask| G
  G --> KB
  G --> Groq
  G --> Oll
  G --> OR
```

If the Python worker is down, Express still classifies and clusters with local heuristics so the demo never hard-fails.

```mermaid
flowchart TD
  R[New report] --> M[Moderate]
  M -->|block vulgar / abuse| X[Reject with reason]
  M -->|ok| C[Classify category + department]
  C --> S[Embed + similar complaints]
  S --> RAG[Retrieve department notes]
  RAG --> RT[Route + needs_review]
  RT --> ST[(Persist civic.json)]
  ST --> GOV[Gov briefing / Ask narrates SQL-shaped totals]
```

**LLM chain:** Groq → Ollama → OpenRouter → heuristic  
**Embeddings:** Ollama (`nomic-embed-text`) → OpenRouter → local 384-d hash (same as Express)

```mermaid
pie showData
  title Example mix on a seeded civic store
  "Roads / potholes" : 34
  "Water / drainage" : 22
  "Garbage" : 18
  "Street lights" : 14
  "Safety / other" : 12
```

> The pie is illustrative of the product mix. Live KPI numbers in the government panel come from `server/data/civic.json`, not this diagram.

---

## Quick start

```bash
./start-all.sh
```

| Surface | URL |
| --- | --- |
| City landing | http://localhost:5173/ |
| App | http://localhost:5173/app/ |
| API health | http://localhost:3001/api/health |
| AI worker | http://127.0.0.1:8001 |

Copy `server/.env.example` → `server/.env`. Optional keys:

| Variable | Role |
| --- | --- |
| `GROQ_API_KEY` | Primary LLM ([console.groq.com](https://console.groq.com) — Groq, not xAI Grok) |
| `OPENROUTER_API_KEY` | Cloud fallback |
| `JWT_SECRET` | Change before any public deploy |
| `AI_SERVICE_URL` | Default `http://127.0.0.1:8001` |

```bash
# split processes
cd server && cp .env.example .env && npm install && npm run dev
cd ai && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && python server.py
cd client && npm install && npm run dev
```

Optional Postgres (schema only; the running API uses the JSON civic store):

```bash
docker compose up -d postgres
```

---

## Demo accounts

| Username | Password | Role |
| --- | --- | --- |
| `citizen_demo` | `password123` | File and track reports |
| `gov_demo` | `password123` | Intelligence panel |

Suggested path:

1. Log in as `citizen_demo`, file a pothole with a location.
2. File two paraphrases of the same stretch — they should share a cluster.
3. Log in as `gov_demo` → Intelligence: wards, clusters, briefing, Ask.
4. Export CSV/JSON from live store counts. Open a `needs_review` item if present.

Landing shortcuts: `register-complaint.html` → compose, `view-complaint.html` → search, `open-thoughts.html` → feed. The 3D city landing is bundled in `landing/` and copied into `client/dist` at build (sibling `../card/apple-3d-card` still works for local dev).

---

## Repository layout

```
Website/
├── api/             Vercel serverless entry (Express)
├── landing/         City landing (bundled for deploy)
├── client/          React + Vite (base /app/, landing plugin)
├── server/          Express API + civic JSON store
├── ai/              LangGraph worker, Groq, RAG over kb/
├── config/          Civic taxonomy
├── scripts/         API / AI verification
├── docker-compose.yml
└── start-all.sh
```

---

## HTTP surface (high level)

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/health` | Process up |
| `POST` | `/api/auth/login` | JWT |
| `GET` | `/api/complaints` | Public list, anonymous authors |
| `POST` | `/api/complaints` | Create (auth) |
| `POST` | `/api/complaints/moderate` | Pre-submit check |
| `GET` | `/api/gov/overview` | Role: government |
| `GET` | `/api/gov/briefing` | Grounded narrative |
| `POST` | `/api/gov/ask` | Q&A over stored totals |
| `PATCH` | `/api/gov/complaints/:id` | Human override |

---

## Deploy on Vercel

The repo includes `vercel.json` — import it in [Vercel](https://vercel.com/new) with framework preset **Other**.

| Path | Served by |
| --- | --- |
| `/` | Static landing (`landing/` → `client/dist` at build) |
| `/app/` | Vite SPA (`base: /app/`) |
| `/api/*` | Express serverless (`api/index.ts` → `server/dist/app.js`) |

**Environment variables** (see `.env.vercel.example`):

- `DATABASE_URL` — Postgres connection string (**required** on Vercel for persistent data)
- `JWT_SECRET` — long random string
- `GROQ_API_KEY` — primary LLM
- `OPENROUTER_API_KEY` — optional fallback
- `AI_SERVICE_URL` — optional external LangGraph worker (Python `ai/` is not deployed on Vercel)

```bash
npm run install:all
npm run build
npx vercel dev    # local Vercel parity
```

**Production data:** Set `DATABASE_URL` (Vercel Postgres, Neon, or Supabase). Schema auto-applies on boot; demo users and civic seed load when empty. Without `DATABASE_URL`, the API uses JSON files in `server/data/` (local dev only).

---

## Production checklist (self-hosted)

- Set a long random `JWT_SECRET`. Do not ship the demo password as the only auth story.
- Put Express behind HTTPS; Vite `base` is `/app/` so reverse-proxy `/` (landing) and `/app/` (SPA) plus `/api` to `:3001`.
- `npm run build` at the repo root compiles server + client (`client/dist/app`).
- Keep `GROQ_API_KEY` (and any OpenRouter key) in the host secret store, never in git.
- Civic persistence is **PostgreSQL** when `DATABASE_URL` is set (`server/sql/schema.sql`). JSON files in `server/data/` are the offline fallback.

```nginx
# sketch — adjust root paths
location /api/ { proxy_pass http://127.0.0.1:3001; }
location /app/ { alias /var/www/civicpulse/client/dist/app/; try_files $uri $uri/ /app/index.html; }
location / { root /var/www/civicpulse/landing; }
```

---

## License

Private project unless you add a license file. Demo credentials are for local evaluation only.
