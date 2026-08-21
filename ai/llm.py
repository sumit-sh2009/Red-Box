"""LLM provider chain: Groq → Ollama → OpenRouter → labeled heuristic.

Groq is primary (console.groq.com). If a call fails or is unavailable, the next
provider is tried automatically. Heuristic rules always remain the final safety net.
"""
from __future__ import annotations

import os
import urllib.error
import urllib.request
from typing import Any, Iterator, Literal, Optional, Tuple

# Groq (console.groq.com)
DEFAULT_GROQ = "llama-3.3-70b-versatile"
DEFAULT_GROQ_MODERATION = "llama-3.1-8b-instant"

# Local Ollama fallback
DEFAULT_OLLAMA_MODEL = "llama3.2"

# OpenRouter free-tier defaults (openrouter.ai — key required, many :free models)
OPENROUTER_BASE = "https://openrouter.ai/api/v1"
DEFAULT_OPENROUTER = "nvidia/nemotron-3-nano-30b-a3b:free"
DEFAULT_OPENROUTER_STRONG = "nvidia/nemotron-3-nano-30b-a3b:free"

Kind = Literal["fast", "strong", "moderation"]


def _env_loaded() -> None:
    """Load key=value from server/.env without overriding existing env."""
    from pathlib import Path

    root = Path(__file__).resolve().parent.parent
    for path in (root / "server" / ".env", root / "ai" / ".env"):
        if not path.exists():
            continue
        for line in path.read_text(encoding="utf-8").splitlines():
            raw = line.strip()
            if not raw or raw.startswith("#") or "=" not in raw:
                continue
            key, val = raw.split("=", 1)
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = val


_env_loaded()


def _log_fallback(provider: str, err: Exception | str) -> None:
    print(f"[llm] {provider} unavailable or failed ({err}); trying next provider")


def _ollama_disabled() -> bool:
    val = os.environ.get("OLLAMA_ENABLED", "").strip().lower()
    return val in ("0", "false", "no", "off")


def _ollama_base_url() -> str:
    return os.environ.get("OLLAMA_BASE_URL", "http://127.0.0.1:11434").strip().rstrip("/")


def ollama_reachable() -> bool:
    """True when Ollama is not explicitly disabled and responds on its base URL."""
    if _ollama_disabled():
        return False
    try:
        req = urllib.request.Request(f"{_ollama_base_url()}/api/tags", method="GET")
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            return resp.status == 200
    except (urllib.error.URLError, TimeoutError, OSError):
        return False


def _model_id(kind: Kind, provider: str) -> str:
    if provider == "groq":
        if kind == "moderation":
            return (
                os.environ.get("GROQ_MODERATION_MODEL", DEFAULT_GROQ_MODERATION).strip()
                or DEFAULT_GROQ_MODERATION
            )
        if kind == "strong":
            return os.environ.get("GROQ_SUMMARY_MODEL", DEFAULT_GROQ).strip() or DEFAULT_GROQ
        return os.environ.get("GROQ_MODEL", DEFAULT_GROQ).strip() or DEFAULT_GROQ
    if provider == "ollama":
        return os.environ.get("OLLAMA_MODEL", DEFAULT_OLLAMA_MODEL).strip() or DEFAULT_OLLAMA_MODEL
    if provider == "openrouter":
        if kind == "moderation":
            return (
                os.environ.get("OPENROUTER_MODERATION_MODEL", DEFAULT_OPENROUTER).strip()
                or DEFAULT_OPENROUTER
            )
        if kind == "strong":
            return (
                os.environ.get("OPENROUTER_SUMMARY_MODEL", DEFAULT_OPENROUTER_STRONG).strip()
                or DEFAULT_OPENROUTER_STRONG
            )
        return os.environ.get("OPENROUTER_MODEL", DEFAULT_OPENROUTER).strip() or DEFAULT_OPENROUTER
    return "heuristic"


def _build_groq(kind: Kind) -> Tuple[Any, str]:
    groq_key = os.environ.get("GROQ_API_KEY", "").strip()
    if not groq_key:
        raise RuntimeError("GROQ_API_KEY not set")
    model_id = _model_id(kind, "groq")
    from langchain_groq import ChatGroq

    return ChatGroq(model=model_id, temperature=0, api_key=groq_key), f"groq:{model_id}"


def _build_ollama(kind: Kind) -> Tuple[Any, str]:
    if not ollama_reachable():
        raise RuntimeError("Ollama not reachable")
    model_id = _model_id(kind, "ollama")
    from langchain_ollama import ChatOllama

    return (
        ChatOllama(model=model_id, base_url=_ollama_base_url(), temperature=0),
        f"ollama:{model_id}",
    )


def _build_openrouter(kind: Kind) -> Tuple[Any, str]:
    api_key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY not set")
    model_id = _model_id(kind, "openrouter")
    from langchain_openai import ChatOpenAI

    headers: dict[str, str] = {}
    site = os.environ.get("OPENROUTER_SITE_URL", "").strip()
    title = os.environ.get("OPENROUTER_APP_NAME", "CivicPulse").strip()
    if site:
        headers["HTTP-Referer"] = site
    if title:
        headers["X-Title"] = title

    model = ChatOpenAI(
        model=model_id,
        api_key=api_key,
        base_url=OPENROUTER_BASE,
        temperature=0,
        default_headers=headers or None,
    )
    return model, f"openrouter:{model_id}"


def _provider_builders(kind: Kind) -> list[tuple[str, Any]]:
    chain: list[tuple[str, Any]] = []
    if os.environ.get("GROQ_API_KEY", "").strip():
        chain.append(("groq", lambda: _build_groq(kind)))
    if ollama_reachable():
        chain.append(("ollama", lambda: _build_ollama(kind)))
    if os.environ.get("OPENROUTER_API_KEY", "").strip():
        chain.append(("openrouter", lambda: _build_openrouter(kind)))
    return chain


def iter_chat_models(kind: Kind = "fast") -> Iterator[Tuple[Any, str]]:
    """Yield (model, label) for each configured provider in fallback order."""
    for provider, builder in _provider_builders(kind):
        try:
            model, label = builder()
            yield model, label
        except Exception as exc:
            _log_fallback(provider, exc)


def provider_status() -> dict:
    return {
        "chain": ["groq", "ollama", "openrouter", "heuristic"],
        "groq": bool(os.environ.get("GROQ_API_KEY", "").strip()),
        "ollama": ollama_reachable(),
        "openrouter": bool(os.environ.get("OPENROUTER_API_KEY", "").strip()),
    }


def get_chat_model(kind: Kind = "fast") -> Tuple[Optional[Any], str, bool]:
    """Return the first constructible model in the fallback chain."""
    for model, label in iter_chat_models(kind):
        return model, label, True
    return None, "heuristic", False


def _content_text(raw: Any) -> str:
    content = getattr(raw, "content", None)
    if content is None:
        return str(raw)
    if isinstance(content, list):
        return " ".join(str(part) for part in content)
    return str(content)


def invoke_text(prompt: str, kind: Kind = "strong") -> Tuple[Optional[str], str, bool]:
    """Invoke plain text across the provider chain until one succeeds."""
    for model, label in iter_chat_models(kind):
        try:
            msg = model.invoke(prompt)
            text = _content_text(msg).strip()
            if text:
                return text, label, True
        except Exception as exc:
            _log_fallback(label, exc)
    return None, "heuristic", False


import re


def _clean_json_str(text: str) -> str:
    text = text.strip()
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if match:
        return match.group(1)
    match = re.search(r"(\{.*\})", text, re.DOTALL)
    if match:
        return match.group(1)
    return text


def structured_invoke(schema: type, prompt: str, kind: Kind = "fast") -> Tuple[Optional[Any], str, bool]:
    """Structured output across Groq → Ollama → OpenRouter → heuristic."""
    for model, label in iter_chat_models(kind):
        try:
            structured = model.with_structured_output(schema)
            out = structured.invoke(prompt)
            if out is not None:
                return out, label, True
        except Exception:
            pass

        try:
            raw = model.invoke(prompt)
            raw_text = _content_text(raw)
            clean_text = _clean_json_str(raw_text)
            parsed = schema.model_validate_json(clean_text)  # type: ignore[attr-defined]
            return parsed, label, True
        except Exception as inner:
            _log_fallback(label, inner)
    return None, "heuristic", False
