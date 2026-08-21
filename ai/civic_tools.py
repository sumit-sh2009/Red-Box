"""Constrained civic-store tools. No SQL. Read-only JSON counts and keyword search."""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict, List

from langchain_core.tools import tool

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CIVIC = ROOT / "server" / "data" / "civic.json"


def civic_path() -> Path:
    return Path(os.environ.get("CIVIC_DATA_PATH", DEFAULT_CIVIC))


def load_civic() -> Dict[str, Any]:
    path = civic_path()
    if not path.exists():
        return {
            "complaints": [],
            "clusters": [],
            "ai_analyses": [],
            "departments": [],
        }
    return json.loads(path.read_text(encoding="utf-8"))


def _open_rows(data: Dict[str, Any]) -> List[dict]:
    return [c for c in data.get("complaints") or [] if c.get("status") != "flagged"]


def overview_dict() -> Dict[str, Any]:
    data = load_civic()
    rows = _open_rows(data)
    analyses = {a.get("complaint_id"): a for a in data.get("ai_analyses") or []}
    by_status: Dict[str, int] = {}
    categories: Dict[str, int] = {}
    wards: Dict[str, int] = {}
    urgent = 0
    for c in rows:
        st = str(c.get("status") or "open")
        by_status[st] = by_status.get(st, 0) + 1
        cat = str(c.get("category") or "Unclassified")
        categories[cat] = categories.get(cat, 0) + 1
        ward = str(c.get("ward") or "Unknown")
        wards[ward] = wards.get(ward, 0) + 1
        ai = analyses.get(c.get("id")) or {}
        if ai.get("urgency") in ("high", "critical") or ai.get("severity") in ("high", "critical"):
            urgent += 1
    return {
        "total": len(rows),
        "by_status": by_status,
        "urgent": urgent,
        "clusters": len(data.get("clusters") or []),
        "categories": categories,
        "wards": wards,
        "source": str(civic_path()),
    }


@tool
def get_civic_overview() -> str:
    """Return complaint counts, urgency, categories, and wards from the civic database JSON. Never invent numbers."""
    return json.dumps(overview_dict(), indent=2)


@tool
def get_department_workload() -> str:
    """Return how many reports map to each department via stored AI analysis (not guessed)."""
    data = load_civic()
    analyses = {a.get("complaint_id"): a for a in data.get("ai_analyses") or []}
    counts: Dict[str, int] = {}
    for c in _open_rows(data):
        dept = (analyses.get(c.get("id")) or {}).get("department") or "Unassigned"
        counts[str(dept)] = counts.get(str(dept), 0) + 1
    return json.dumps({"departments": counts, "total": sum(counts.values())}, indent=2)


@tool
def get_priority_clusters() -> str:
    """List issue clusters with size, support, department, and urgency from the store."""
    data = load_civic()
    clusters = []
    for cl in data.get("clusters") or []:
        clusters.append(
            {
                "id": cl.get("id"),
                "title": cl.get("title"),
                "size": cl.get("size"),
                "support_total": cl.get("support_total"),
                "department": cl.get("department"),
                "urgency": cl.get("urgency"),
                "location_text": cl.get("location_text"),
            }
        )
    clusters.sort(key=lambda x: (x.get("size") or 0) + (x.get("support_total") or 0), reverse=True)
    return json.dumps({"clusters": clusters[:12]}, indent=2)


@tool
def search_reports(query: str) -> str:
    """Keyword search over anonymous complaint text and location. Returns at most 8 snippets. No identities."""
    q = (query or "").strip().lower()
    if len(q) < 2:
        return json.dumps({"error": "query too short", "matches": []})
    data = load_civic()
    matches = []
    for c in _open_rows(data):
        blob = f"{c.get('body') or ''} {c.get('location_text') or ''} {c.get('category') or ''}".lower()
        tokens = [p for p in q.split() if len(p) > 2]
        if q not in blob and not (tokens and all(p in blob for p in tokens[:3])):
            continue
        matches.append(
            {
                "id": c.get("id"),
                "category": c.get("category"),
                "status": c.get("status"),
                "location_text": c.get("location_text"),
                "snippet": (c.get("body") or "")[:180],
                "cluster_id": c.get("cluster_id"),
            }
        )
        if len(matches) >= 8:
            break
    return json.dumps({"query": query, "matches": matches, "count": len(matches)}, indent=2)


TOOLS = [get_civic_overview, get_department_workload, get_priority_clusters, search_reports]
