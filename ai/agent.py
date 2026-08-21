"""Tool-using government Q&A. Tools read civic JSON only — no SQL."""
from __future__ import annotations

from civic_tools import (
    TOOLS,
    get_civic_overview,
    get_department_workload,
    get_priority_clusters,
    overview_dict,
)
from llm import iter_chat_models

SYSTEM = (
    "You are a municipal intelligence assistant. Citizens are anonymous. "
    "You MUST call tools for any numbers. Never invent counts. Never write SQL. "
    "If tools return empty, say the database has no matching rows."
)


def _fallback(question: str) -> dict:
    snap = overview_dict()
    clusters = get_priority_clusters.invoke({})
    depts = get_department_workload.invoke({})
    answer = (
        f"No LLM is configured (used_llm=false). Question: {question}\n\n"
        f"Live civic snapshot: {snap['total']} reports, {snap['urgent']} urgent, "
        f"{snap['clusters']} clusters. Categories: {snap['categories']}.\n\n"
        f"Departments:\n{depts}\n\nClusters:\n{clusters}"
    )
    return {
        "used_llm": False,
        "model": "heuristic",
        "answer": answer,
        "tools_used": ["get_civic_overview", "get_department_workload", "get_priority_clusters"],
        "stats": snap,
    }


def gov_ask(question: str) -> dict:
    q = (question or "").strip()
    if len(q) < 3:
        return {"used_llm": False, "model": "heuristic", "answer": "Ask a specific question about civic reports.", "tools_used": []}

    for model, name in iter_chat_models("strong"):
        tools_used: list[str] = []
        try:
            from langgraph.prebuilt import create_react_agent

            agent = create_react_agent(model, TOOLS)
            result = agent.invoke(
                {
                    "messages": [
                        ("system", SYSTEM),
                        ("human", q),
                    ]
                }
            )
            messages = result.get("messages") or []
            answer = ""
            for m in messages:
                name_attr = getattr(m, "name", None)
                if name_attr:
                    tools_used.append(str(name_attr))
                if getattr(m, "tool_calls", None):
                    for tc in m.tool_calls:
                        tools_used.append(tc.get("name") if isinstance(tc, dict) else getattr(tc, "name", ""))
                content = getattr(m, "content", None)
                if content and getattr(m, "type", "") in ("ai", "AIMessage") or m.__class__.__name__ == "AIMessage":
                    if isinstance(content, str) and content.strip():
                        answer = content
            tools_used = [t for t in tools_used if t]
            if not answer:
                answer = str(messages[-1].content if messages else _fallback(q)["answer"])
            return {
                "used_llm": True,
                "model": name,
                "answer": answer,
                "tools_used": list(dict.fromkeys(tools_used)),
                "stats": overview_dict(),
            }
        except Exception:
            try:
                bound = model.bind_tools(TOOLS)
                msg = bound.invoke([("system", SYSTEM), ("human", q)])
                calls = getattr(msg, "tool_calls", None) or []
                from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage

                messages = [SystemMessage(content=SYSTEM), HumanMessage(content=q), msg]
                lookup = {t.name: t for t in TOOLS}
                for tc in calls:
                    fname = tc["name"] if isinstance(tc, dict) else tc.get("name")
                    args = tc.get("args") if isinstance(tc, dict) else getattr(tc, "args", {})
                    tid = tc.get("id") if isinstance(tc, dict) else getattr(tc, "id", "t0")
                    tool = lookup.get(fname)
                    if not tool:
                        continue
                    tools_used.append(fname)
                    out = tool.invoke(args or {})
                    messages.append(ToolMessage(content=str(out), tool_call_id=tid))
                if calls:
                    final = model.invoke(messages)
                    answer = getattr(final, "content", None) or str(final)
                else:
                    snap = get_civic_overview.invoke({})
                    tools_used.append("get_civic_overview")
                    answer = f"{getattr(msg, 'content', '')}\n\nDatabase snapshot:\n{snap}".strip()
                return {
                    "used_llm": True,
                    "model": name,
                    "answer": str(answer),
                    "tools_used": list(dict.fromkeys(tools_used)),
                    "stats": overview_dict(),
                }
            except Exception:
                continue

    fb = _fallback(q)
    fb["note"] = "All LLM providers failed; returning store snapshot."
    return fb
