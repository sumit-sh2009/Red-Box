"""Embedding provider chain: Ollama → OpenRouter → local hashed vectors.

Semantic backends are tried first; the local 384-d hash embedder is always the
final safety net (same algorithm as server/src/services/heuristic.ts).
"""
from __future__ import annotations

import hashlib
import math
import os
import re
from typing import List, Protocol, Sequence

from llm import OPENROUTER_BASE, _log_fallback, ollama_reachable

DIM = 384
CLUSTER_THRESHOLD = 0.40

DEFAULT_OLLAMA_EMBED = "nomic-embed-text"
DEFAULT_OPENROUTER_EMBED = "openai/text-embedding-3-small"


class EmbeddingBackend(Protocol):
    name: str

    def embed(self, text: str) -> List[float]: ...

    def embed_many(self, texts: Sequence[str]) -> List[List[float]]: ...


class LocalHashBackend:
    name = "local:hash384"

    def embed(self, text: str) -> List[float]:
        return _local_embed(text)

    def embed_many(self, texts: Sequence[str]) -> List[List[float]]:
        return [_local_embed(t) for t in texts]


class OllamaEmbedBackend:
    def __init__(self, model: str, base_url: str) -> None:
        from langchain_ollama import OllamaEmbeddings

        self.name = f"ollama:{model}"
        self._client = OllamaEmbeddings(model=model, base_url=base_url)

    def embed(self, text: str) -> List[float]:
        return self._client.embed_query(text or " ")

    def embed_many(self, texts: Sequence[str]) -> List[List[float]]:
        cleaned = [t or " " for t in texts]
        return self._client.embed_documents(list(cleaned))


class OpenRouterEmbedBackend:
    def __init__(self, model: str, api_key: str) -> None:
        from langchain_openai import OpenAIEmbeddings

        headers: dict[str, str] = {}
        site = os.environ.get("OPENROUTER_SITE_URL", "").strip()
        title = os.environ.get("OPENROUTER_APP_NAME", "CivicPulse").strip()
        if site:
            headers["HTTP-Referer"] = site
        if title:
            headers["X-Title"] = title

        self.name = f"openrouter:{model}"
        self._client = OpenAIEmbeddings(
            model=model,
            api_key=api_key,
            base_url=OPENROUTER_BASE,
            default_headers=headers or None,
            check_embedding_ctx_length=False,
        )

    def embed(self, text: str) -> List[float]:
        return self._client.embed_query(text or " ")

    def embed_many(self, texts: Sequence[str]) -> List[List[float]]:
        cleaned = [t or " " for t in texts]
        return self._client.embed_documents(list(cleaned))


_active_backend: EmbeddingBackend | None = None


def _tokenize(text: str) -> List[str]:
    words = re.findall(r"[a-z0-9]+", (text or "").lower())
    compact = "".join(words)
    grams = [compact[i : i + 3] for i in range(max(0, len(compact) - 2))]
    return words + grams


def _local_embed(text: str) -> List[float]:
    vec = [0.0] * DIM
    for tok in _tokenize(text):
        digest = hashlib.md5(tok.encode("utf-8")).digest()
        idx = int.from_bytes(digest[:2], "little") % DIM
        sign = 1.0 if digest[2] % 2 == 0 else -1.0
        vec[idx] += sign
    norm = math.sqrt(sum(x * x for x in vec)) or 1.0
    return [x / norm for x in vec]


def _ollama_base_url() -> str:
    return os.environ.get("OLLAMA_BASE_URL", "http://127.0.0.1:11434").strip().rstrip("/")


def _try_backend(factory, label: str) -> EmbeddingBackend | None:
    try:
        backend = factory()
        backend.embed("civic embedding probe")
        return backend
    except Exception as exc:
        _log_fallback(label, exc)
        return None


def resolve_embedding_backend(force: bool = False) -> EmbeddingBackend:
    """Pick the first working embedding backend in fallback order."""
    global _active_backend
    if _active_backend is not None and not force:
        return _active_backend

    ollama_model = os.environ.get("OLLAMA_EMBED_MODEL", DEFAULT_OLLAMA_EMBED).strip() or DEFAULT_OLLAMA_EMBED
    if ollama_reachable():
        hit = _try_backend(
            lambda: OllamaEmbedBackend(ollama_model, _ollama_base_url()),
            "ollama-embed",
        )
        if hit:
            _active_backend = hit
            return hit

    openrouter_key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    or_model = os.environ.get("OPENROUTER_EMBED_MODEL", DEFAULT_OPENROUTER_EMBED).strip() or DEFAULT_OPENROUTER_EMBED
    if openrouter_key:
        hit = _try_backend(
            lambda: OpenRouterEmbedBackend(or_model, openrouter_key),
            "openrouter-embed",
        )
        if hit:
            _active_backend = hit
            return hit

    _active_backend = LocalHashBackend()
    return _active_backend


def reset_embedding_backend() -> None:
    global _active_backend
    _active_backend = None


def embedding_provider_status() -> dict:
    backend = resolve_embedding_backend()
    return {
        "chain": ["ollama", "openrouter", "local:hash384"],
        "active": backend.name,
        "ollama": ollama_reachable(),
        "openrouter": bool(os.environ.get("OPENROUTER_API_KEY", "").strip()),
        "local": True,
    }


def get_backend() -> EmbeddingBackend:
    return resolve_embedding_backend()
