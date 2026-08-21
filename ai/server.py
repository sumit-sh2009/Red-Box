from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from urllib.parse import urlparse

from agent import gov_ask
from graph import gov_summary, run_pipeline
from embedding_providers import embedding_provider_status
from llm import _env_loaded, provider_status
from moderation import moderate

_env_loaded()


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:
        print("[ai]", fmt % args)

    def _send(self, code: int, payload: dict) -> None:
        raw = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path in ("/health", "/"):
            self._send(
                200,
                {
                    "status": "ok",
                    "service": "civic-langgraph",
                    "providers": {
                        "llm": provider_status(),
                        "embeddings": embedding_provider_status(),
                    },
                },
            )
            return
        self._send(404, {"error": "not found"})

    def do_POST(self) -> None:
        length = int(self.headers.get("Content-Length") or 0)
        body = json.loads(self.rfile.read(length) or b"{}")
        path = urlparse(self.path).path
        try:
            if path == "/moderate":
                self._send(200, moderate(body.get("body") or "", body.get("location_text") or ""))
                return
            if path == "/analyze-complaint":
                self._send(200, run_pipeline(body))
                return
            if path == "/gov-summary":
                self._send(200, gov_summary(body.get("stats") or body))
                return
            if path == "/gov-ask":
                self._send(200, gov_ask(body.get("question") or body.get("q") or ""))
                return
            self._send(404, {"error": "not found"})
        except Exception as exc:
            self._send(500, {"error": str(exc)})


if __name__ == "__main__":
    port = int(os.environ.get("AI_PORT", "8001"))
    print(f"Civic LangGraph on http://127.0.0.1:{port}")
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
