"""Civic intelligence LangGraph: validate → classify → similar → rag → route → priority → evaluate."""
from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional, TypedDict

from embedding_providers import get_backend
from embeddings import cosine, embed, similar_rows
from llm import structured_invoke
from priority import priority_score
from schemas import Classification, DepartmentRoute
from taxonomy import category_keyword_map, category_names, department_documents

try:
    from langgraph.graph import END, START, StateGraph
except Exception:  # pragma: no cover
    StateGraph = None  # type: ignore
    START = "START"
    END = "END"


class GraphState(TypedDict, total=False):
    complaint_id: str
    body: str
    location_text: str
    existing: List[Dict[str, Any]]
    classification: Dict[str, Any]
    similar: List[Dict[str, Any]]
    department: Dict[str, Any]
    rag_snippets: List[str]
    needs_review: bool
    flagged: bool
    used_llm: bool
    model: str
    workflow_id: str
    overall_confidence: float
    scores: Dict[str, float]


def heuristic_classify(body: str, location: str) -> Classification:
    blob = f"{body} {location}".lower()
    best, score = "Other Civic Issues", 0
    for name, words in category_keyword_map():
        hits = sum(1 for w in words if w and w in blob)
        if hits > score:
            best, score = name, hits
    sev, urg = "medium", "medium"
    if any(w in blob for w in ["accident", "fire", "spark", "collapse", "child", "school"]):
        sev, urg = "high", "high"
    elif any(w in blob for w in ["weeks", "days", "recurring", "huge", "deep"]):
        urg = "medium"
    return Classification(
        category=best,
        severity=sev,  # type: ignore[arg-type]
        urgency=urg,  # type: ignore[arg-type]
        summary=f"{best} near {location or 'unspecified location'}.",
        recommended_action="Inspect the site and open a work order for the matched department.",
        entities=[location] if location else [],
    )


def rag_department(body: str, location: str, category: str) -> DepartmentRoute:
    query = f"{body} {location} {category}"
    qv = embed(query)
    docs = department_documents()
    if not docs:
        return DepartmentRoute(
            department="Municipal Administration",
            department_confidence=0.4,
            grounded=False,
        )
    ranked = []
    for doc in docs:
        ranked.append((cosine(qv, embed(doc["text"])), doc))
    ranked.sort(key=lambda x: x[0], reverse=True)
    score, best = ranked[0]
    conf = round(min(0.95, max(0.42, 0.5 + float(score))), 3)
    snippet = best["text"][:280]
    return DepartmentRoute(
        department=best["name"],
        department_confidence=conf,
        grounded=True,
        rag_snippet=snippet,
    )


def try_classify(body: str, location: str) -> tuple[Classification, str, bool]:
    cats = category_names()
    prompt = (
        "Classify this Indian civic complaint. Do not invent facts.\n"
        f"Location: {location}\nText: {body}\n"
        f"category MUST be one of: {', '.join(cats)}\n"
        "severity and urgency: low, medium, high, or critical.\n"
        "summary: one sentence from the text. entities: places or assets mentioned."
    )
    out, model, used = structured_invoke(Classification, prompt)
    if out is None:
        h = heuristic_classify(body, location)
        return h, "heuristic", False
    if out.category not in cats:
        out.category = heuristic_classify(body, location).category
        return out, model, True
    return out, model, True


def node_validate(state: GraphState) -> Dict[str, Any]:
    body = (state.get("body") or "").strip()
    loc = (state.get("location_text") or "").strip()
    needs = len(body) < 8 or not loc
    return {"needs_review": needs or bool(state.get("needs_review"))}


def node_classify(state: GraphState) -> Dict[str, Any]:
    clf, model, used = try_classify(state.get("body") or "", state.get("location_text") or "")
    conf = 0.82 if used else (0.62 if clf.category != "Other Civic Issues" else 0.4)
    return {
        "classification": clf.model_dump(),
        "used_llm": used,
        "model": model,
        "overall_confidence": conf,
        "needs_review": bool(state.get("needs_review")) or conf < 0.5,
    }


def node_similar(state: GraphState) -> Dict[str, Any]:
    q = f"{state.get('body') or ''} {state.get('location_text') or ''}"
    hits = similar_rows(q, state.get("existing") or [], state.get("complaint_id") or "")
    return {"similar": hits}


def node_rag(state: GraphState) -> Dict[str, Any]:
    clf = state.get("classification") or {}
    route = rag_department(
        state.get("body") or "",
        state.get("location_text") or "",
        str(clf.get("category") or ""),
    )
    return {
        "department": route.model_dump(),
        "rag_snippets": [route.rag_snippet] if route.rag_snippet else [],
    }


def node_priority(state: GraphState) -> Dict[str, Any]:
    clf = state.get("classification") or {}
    sim = state.get("similar") or []
    cluster_size = 1 + sum(1 for s in sim if s.get("score", 0) >= 0.4)
    scores = priority_score(
        cluster_size=cluster_size,
        support=0,
        severity=str(clf.get("severity") or "medium"),
        urgency=str(clf.get("urgency") or "medium"),
        age_hours=0,
    )
    return {"scores": scores}


def node_evaluate(state: GraphState) -> Dict[str, Any]:
    conf = float(state.get("overall_confidence") or 0.5)
    cat = (state.get("classification") or {}).get("category")
    needs = bool(state.get("needs_review")) or conf < 0.5 or cat not in category_names()
    return {"needs_review": needs, "overall_confidence": conf}


def build_graph():
    if StateGraph is None:
        return None
    g = StateGraph(GraphState)
    g.add_node("validate", node_validate)
    g.add_node("classify", node_classify)
    g.add_node("similar", node_similar)
    g.add_node("rag", node_rag)
    g.add_node("priority", node_priority)
    g.add_node("evaluate", node_evaluate)
    g.add_edge(START, "validate")
    g.add_edge("validate", "classify")
    g.add_edge("classify", "similar")
    g.add_edge("similar", "rag")
    g.add_edge("rag", "priority")
    g.add_edge("priority", "evaluate")
    g.add_edge("evaluate", END)
    return g.compile()


GRAPH = None


def run_pipeline(payload: Dict[str, Any]) -> Dict[str, Any]:
    global GRAPH
    wf = f"wf_{uuid.uuid4().hex[:10]}"
    initial: GraphState = {
        "complaint_id": payload.get("complaint_id") or "",
        "body": payload.get("body") or "",
        "location_text": payload.get("location_text") or "",
        "existing": payload.get("existing") or [],
        "workflow_id": wf,
        "used_llm": False,
        "model": "heuristic",
        "similar": [],
        "flagged": False,
        "needs_review": False,
        "overall_confidence": 0.5,
    }
    if GRAPH is None:
        GRAPH = build_graph()
    if GRAPH is not None:
        state = GRAPH.invoke(initial)
    else:
        state = dict(initial)
        for fn in (node_validate, node_classify, node_similar, node_rag, node_priority, node_evaluate):
            state.update(fn(state))

    clf = state.get("classification") or heuristic_classify(initial["body"], initial["location_text"]).model_dump()
    dept = state.get("department") or rag_department(initial["body"], initial["location_text"], clf.get("category") or "").model_dump()
    similar = state.get("similar") or []
    embed_backend = get_backend().name
    return {
        "workflow_id": state.get("workflow_id") or wf,
        "used_llm": bool(state.get("used_llm")),
        "model": state.get("model") or "heuristic",
        "embedding_provider": embed_backend,
        "category": clf.get("category"),
        "subcategory": clf.get("subcategory"),
        "severity": clf.get("severity"),
        "urgency": clf.get("urgency"),
        "summary": clf.get("summary"),
        "recommended_action": clf.get("recommended_action"),
        "entities": clf.get("entities") or [],
        "department": dept.get("department"),
        "department_confidence": dept.get("department_confidence"),
        "overall_confidence": state.get("overall_confidence"),
        "similar": similar,
        "similar_ids": [s["id"] for s in similar],
        "flagged": False,
        "needs_review": bool(state.get("needs_review")),
        "rag_snippets": state.get("rag_snippets") or [],
        "scores": state.get("scores") or {},
        "cluster_summary": clf.get("summary"),
        "steps": ["validate", "classify_extract", "retrieve_similar", "rag_departments", "route_department", "priority", "evaluate"],
    }


def gov_summary(stats: Dict[str, Any]) -> Dict[str, Any]:
    total = stats.get("total", 0)
    urgent = stats.get("urgent", 0)
    clusters = stats.get("clusters", 0)
    cats = stats.get("categories") or {}
    top = max(cats.items(), key=lambda x: x[1])[0] if cats else "n/a"
    grounded = (
        f"Database totals: {total} reports, {urgent} tagged urgent, {clusters} clusters. "
        f"Largest category in the extract is {top}. "
        "Do not treat this paragraph as a source of extra numbers."
    )
    prompt = (
        "Write a short government briefing using ONLY these stats JSON. "
        "Repeat the numbers; do not invent any count.\n"
        f"{stats}"
    )
    from llm import invoke_text

    text, name, used = invoke_text(
        "You narrate civic database totals. If a number is missing, say it is missing. "
        "Never invent.\n" + prompt,
        kind="strong",
    )
    if used and text:
        return {
            "used_llm": True,
            "model": name,
            "summary": text,
            "grounded": True,
            "stats_echo": {"total": total, "urgent": urgent, "clusters": clusters},
        }
    return {"used_llm": False, "model": "heuristic", "summary": grounded, "grounded": True}
