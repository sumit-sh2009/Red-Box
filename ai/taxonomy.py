from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List

ROOT = Path(__file__).resolve().parent.parent
TAXONOMY_PATH = ROOT / "config" / "civic-taxonomy.json"
KB_PATH = Path(__file__).parent / "kb" / "departments.md"


@lru_cache(maxsize=1)
def load_taxonomy() -> Dict[str, Any]:
    if TAXONOMY_PATH.exists():
        return json.loads(TAXONOMY_PATH.read_text(encoding="utf-8"))
    return {"categories": [], "departments": []}


def category_names() -> List[str]:
    names = [str(c["name"]) for c in load_taxonomy().get("categories") or []]
    return names or ["Other Civic Issues"]


def departments() -> List[Dict[str, Any]]:
    return list(load_taxonomy().get("departments") or [])


def department_documents() -> List[Dict[str, str]]:
    kb = KB_PATH.read_text(encoding="utf-8") if KB_PATH.exists() else ""
    kb_chunks = [c.strip() for c in kb.split("\n\n") if c.strip()]
    out: List[Dict[str, str]] = []
    for d in departments():
        text = (
            f"{d['name']}\n"
            f"keywords: {' '.join(d.get('keywords') or [])}\n"
            f"{d.get('responsibilities') or ''}"
        )
        needle = str(d["name"]).split("(")[0].strip().lower()[:16]
        extra = [c for c in kb_chunks if needle in c.lower()]
        if extra:
            text += "\n" + extra[0]
        out.append({"id": str(d["id"]), "name": str(d["name"]), "text": text})
    return out


def category_keyword_map() -> List[tuple[str, List[str]]]:
    rows = []
    for c in load_taxonomy().get("categories") or []:
        rows.append((str(c["name"]), [str(w).lower() for w in (c.get("keywords") or [])]))
    return rows
