from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


class ModerationVerdict(BaseModel):
    action: Literal["allow", "revise", "reject"]
    reason: str = ""
    rewrite_message: str = Field(
        default="",
        description="User-facing instruction if action is revise or reject.",
    )
    used_llm: bool = False
    model: str = "heuristic"


class Classification(BaseModel):
    category: str
    subcategory: Optional[str] = None
    severity: Literal["low", "medium", "high", "critical"] = "medium"
    urgency: Literal["low", "medium", "high", "critical"] = "medium"
    summary: str = ""
    recommended_action: str = ""
    entities: list[str] = Field(default_factory=list)


class DepartmentRoute(BaseModel):
    department: str
    department_confidence: float
    grounded: bool = True
    rag_snippet: str = ""
