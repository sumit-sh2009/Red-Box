#!/usr/bin/env bash
# CivicPulse — one command to install deps, load env, start API + AI worker + client.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

PIDS=()
ENV_FILE="$ROOT/server/.env"

cleanup() {
  echo ""
  echo "Stopping CivicPulse…"
  for pid in "${PIDS[@]:-}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}

trap cleanup EXIT INT TERM

banner() {
  echo ""
  echo "══════════════════════════════════════════════════════════════"
  echo "  CivicPulse — anonymous civic reports + gov intelligence"
  echo "══════════════════════════════════════════════════════════════"
  echo ""
}

load_env() {
  if [[ -f "$ROOT/server/.env.example" && ! -f "$ENV_FILE" ]]; then
    cp "$ROOT/server/.env.example" "$ENV_FILE"
    echo "Created server/.env from .env.example"
  fi
  if [[ -f "$ENV_FILE" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$ENV_FILE"
    set +a
  fi
}

env_hint() {
  local missing=()
  [[ -z "${GROQ_API_KEY:-}" ]] && missing+=("GROQ_API_KEY (console.groq.com — primary LLM)")
  [[ -z "${OPENROUTER_API_KEY:-}" ]] && missing+=("OPENROUTER_API_KEY (openrouter.ai — cloud fallback)")
  if [[ ${#missing[@]} -gt 0 ]]; then
    echo "  Optional keys (edit server/.env, then restart):"
    for m in "${missing[@]}"; do
      echo "    • $m"
    done
    echo "  Without keys: LLM/embeddings fall back to Ollama (if running) → local heuristics."
  else
    echo "  API keys: Groq ✓  OpenRouter ✓"
  fi
  if [[ "${OLLAMA_ENABLED:-}" == "false" ]]; then
    echo "  Ollama: disabled (OLLAMA_ENABLED=false)"
  elif command -v curl >/dev/null 2>&1 && curl -sf "${OLLAMA_BASE_URL:-http://127.0.0.1:11434}/api/tags" >/dev/null 2>&1; then
    echo "  Ollama: running at ${OLLAMA_BASE_URL:-http://127.0.0.1:11434} (LLM + nomic-embed-text)"
  else
    echo "  Ollama: not detected — run: ollama serve && ollama pull llama3.2 && ollama pull nomic-embed-text"
  fi
}

wait_for_url() {
  local url="$1"
  local label="$2"
  local tries="${3:-40}"
  for ((i = 0; i < tries; i++)); do
    if curl -sf "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.25
  done
  echo "  Warning: $label did not respond at $url"
  return 1
}

print_ai_status() {
  "$ROOT/ai/.venv/bin/python" - <<'PY' 2>/dev/null || true
import json, urllib.request
try:
    with urllib.request.urlopen("http://127.0.0.1:8001/health", timeout=3) as r:
        d = json.load(r)
    prov = d.get("providers") or {}
    llm = prov.get("llm") or prov
    emb = prov.get("embeddings") or {}
    chain = " → ".join(llm.get("chain") or ["groq", "ollama", "openrouter", "heuristic"])
    print(f"  LLM chain:     {chain}")
    print(f"  LLM ready:     groq={bool(llm.get('groq'))}  ollama={bool(llm.get('ollama'))}  openrouter={bool(llm.get('openrouter'))}")
    if emb:
        echain = " → ".join(emb.get("chain") or [])
        print(f"  Embed chain:   {echain}")
        print(f"  Embed active:  {emb.get('active', 'local:hash384')}")
except Exception as exc:
    print(f"  AI health:     unavailable ({exc})")
PY
}

banner
echo "▸ Setting up environment…"
load_env

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  echo "▸ Starting optional Postgres…"
  docker compose up -d postgres >/dev/null 2>&1 || true
fi

echo "▸ Installing dependencies (skip if already present)…"
if [[ ! -d "$ROOT/server/node_modules" ]]; then
  (cd "$ROOT/server" && npm install)
else
  echo "  server/node_modules OK"
fi

if [[ ! -d "$ROOT/client/node_modules" ]]; then
  (cd "$ROOT/client" && npm install)
else
  echo "  client/node_modules OK"
fi

if [[ ! -d "$ROOT/ai/.venv" ]] || [[ ! -x "$ROOT/ai/.venv/bin/python" ]]; then
  echo "  Creating Python venv…"
  python3 -m venv "$ROOT/ai/.venv"
fi
echo "  Syncing AI Python packages…"
"$ROOT/ai/.venv/bin/pip" install -q -r "$ROOT/ai/requirements.txt"

echo ""
echo "▸ Starting services…"
echo "  Express API      → http://localhost:${PORT:-3001}"
(cd "$ROOT/server" && npm run dev) &
PIDS+=($!)

echo "  LangGraph worker → http://127.0.0.1:${AI_PORT:-8001}"
(cd "$ROOT/ai" && "$ROOT/ai/.venv/bin/python" server.py) &
PIDS+=($!)

echo "  Vite client      → http://localhost:5173"
(cd "$ROOT/client" && npm run dev) &
PIDS+=($!)

echo ""
echo "▸ Waiting for AI worker…"
wait_for_url "http://127.0.0.1:${AI_PORT:-8001}/health" "AI worker" 40 || true

echo ""
echo "──────────────────────────────────────────────────────────────"
echo "  READY"
echo "──────────────────────────────────────────────────────────────"
echo "  Landing:       http://localhost:5173/"
echo "  App:           http://localhost:5173/app/"
echo "  Gov panel:     http://localhost:5173/app/#gov-panel"
echo "  API:           http://localhost:${PORT:-3001}"
echo "  AI worker:     http://127.0.0.1:${AI_PORT:-8001}/health"
echo ""
echo "  Demo login:"
echo "    citizen_demo / password123   (file anonymous reports)"
echo "    gov_demo / password123       (intelligence dashboard)"
echo ""
env_hint
echo ""
print_ai_status
echo ""
echo "  Fallback safety nets:"
echo "    LLM:   Groq → Ollama → OpenRouter → heuristic (never blocks demo)"
echo "    Embed: Ollama nomic-embed-text → OpenRouter → local hash384"
echo "    Express retries AI once, then uses local heuristics if worker is down."
echo ""
echo "  Quick demo:"
echo "    1. Log in as citizen_demo → file pothole at Central School"
echo "    2. File a paraphrase → should join same cluster"
echo "    3. Log in as gov_demo → Intelligence → briefing + Ask"
echo ""
echo "  Ctrl+C stops all processes."
echo "──────────────────────────────────────────────────────────────"
echo ""

wait
