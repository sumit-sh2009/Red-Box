# CivicPulse — anonymous civic reports (pixel UI)

Youth-facing civic filing with a pixel look and a serious intelligence layer underneath. Public reports never show the filer’s username.

## Demo accounts

| User | Password | Role |
|---|---|---|
| `citizen_demo` | `password123` | Citizen |
| `gov_demo` | `password123` | Government intelligence |

## Run locally

From the repo root:

```bash
./start-all.sh
```

This starts the Express API (`:3001`), the LangGraph worker (`:8001`), and the Vite client (`:5173`). It loads `server/.env`, syncs Python deps, probes AI provider fallbacks, and prints demo URLs. Ctrl+C stops all of them.

The city landing page lives in `../card/apple-3d-card` (unchanged). Vite serves it at `/`. CivicPulse runs at `/app/`. Landing buttons (`register-complaint.html`, `view-complaint.html`, `open-thoughts.html`) redirect into the live app.

Add optional keys in `server/.env` before or after first run:

| Variable | Purpose |
|---|---|
| `GROQ_API_KEY` | Primary LLM (Groq — not xAI Grok) |
| `OPENROUTER_API_KEY` | Cloud LLM + embedding fallback |
| *(auto)* | Ollama if `ollama serve` is running (`llama3.2`, `nomic-embed-text`) |

Fallback chains: **LLM** Groq → Ollama → OpenRouter → heuristic. **Embeddings** Ollama → OpenRouter → local hash.

Manual processes (same thing, split):

```bash
# 1) Optional Postgres (schema only; the Express app also persists civic data to server/data/civic.json)
docker compose up -d postgres

# 2) Express API
cd server
cp .env.example .env   # add GROQ_API_KEY from console.groq.com (Groq, not xAI Grok)
npm install
npm run dev            # http://localhost:3001

# 3) Python LangGraph worker (optional — Express falls back to heuristics)
cd ai
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# optional: export GROQ_API_KEY=...        # primary — console.groq.com
# optional: ollama serve && ollama pull llama3.2 && ollama pull nomic-embed-text
# optional: export OPENROUTER_API_KEY=...   # cloud fallback — openrouter.ai (free :free models)
python server.py       # http://127.0.0.1:8001

# 4) Client
cd client
npm install
npm run dev            # landing http://localhost:5173/  ·  app http://localhost:5173/app/
```

## Demo path

1. Log in as `citizen_demo`.
2. File a report: pothole outside Central School (location required). Watch classification badges.
3. File two paraphrases of the same issue — they should land in one cluster.
4. Log in as `gov_demo` → Intelligence. Clusters, ward chart, grounded briefing, **Ask**, CSV/JSON from **database counts**.
5. Open the `needs_review` sample (ambiguous mill-road filing).

## Architecture

- **Express** is the only public API (`/api/complaints`, `/api/gov/*`).
- **Civic store** is SQL-shaped JSON (`server/data/civic.json`) so the hackathon demo runs without Docker. `server/sql/schema.sql` + `docker-compose.yml` are the Postgres target.
- **LangGraph** (`ai/graph.py`) runs safety → classify → similar → RAG (department markdown) → route → evaluate. **LLM** fallback: Groq → Ollama → OpenRouter → heuristic. **Embeddings** fallback: Ollama (`nomic-embed-text`) → OpenRouter → local hash (384-d, same as Express). Express also falls back to local heuristics if the AI worker is unreachable.
- Pre-submit moderation: `POST /api/complaints/moderate`. Government Q&A: `POST /api/gov/ask`. Briefing: `GET /api/gov/briefing`.
- Government summaries are **not** allowed to invent numbers; they narrate SQL/JSON totals.

## Course mapping (implemented)

| Course | Concept | Where |
|---|---|---|
| 45–46 | Pydantic models | `ai/graph.py` Classification, SafetyResult, DepartmentRoute |
| 77–86 | Structured output / tools-as-functions | `with_structured_output(Classification)` when LLM is up |
| 92–100 | StateGraph nodes/edges | `ai/graph.py` `build_graph()` |
| 109–119 | Routing, evaluator, HITL | safety flag, `needs_review`, gov PATCH override |
| 120–128 | RAG | `ai/kb/departments.md` chunk retrieval |
| 129–130 | Guardrails | category allow-list, heuristic fallback, no LLM chart numbers |

## Anonymity

Public DTOs always use `Anonymous citizen`. `author_id` is stored internally and never returned on `/api/complaints`.
