"""Similarity search and clustering with embedding provider fallbacks."""
from __future__ import annotations

import math
from typing import Iterable, List, Sequence

from embedding_providers import CLUSTER_THRESHOLD, DIM, get_backend, reset_embedding_backend

# Re-export for tests / callers
__all__ = [
    "DIM",
    "CLUSTER_THRESHOLD",
    "embed",
    "cosine",
    "similarity",
    "similar_rows",
    "cluster_texts",
    "reset_embedding_backend",
]


def embed(text: str) -> List[float]:
    return get_backend().embed(text)


def cosine(a: Sequence[float], b: Sequence[float]) -> float:
    if not a or not b:
        return 0.0
    if len(a) != len(b):
        from embedding_providers import _local_embed

        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)) or 1.0
    nb = math.sqrt(sum(x * x for x in b)) or 1.0
    return float(dot / (na * nb))


def landmark_tokens(text: str) -> set[str]:
    import re

    words = re.findall(r"[a-z0-9]+", (text or "").lower())
    stop = {"the", "near", "outside", "front", "gate", "road", "street", "area", "and", "for"}
    return {w for w in words if len(w) > 3 and w not in stop}


def _boost_score(score: float, la: set[str], lb: set[str]) -> float:
    shared = la & lb
    if {"central", "school"} <= la and {"central", "school"} <= lb:
        return min(1.0, score + 0.18)
    if len(shared) >= 2:
        return min(1.0, score + 0.08)
    return score


def similarity(a: str, b: str) -> float:
    score = cosine(embed(a), embed(b))
    return _boost_score(score, landmark_tokens(a), landmark_tokens(b))


def similar_rows(
    query: str,
    existing: Iterable[dict],
    self_id: str,
    threshold: float = 0.36,
    limit: int = 8,
) -> List[dict]:
    backend = get_backend()
    rows = list(existing)
    try:
        q_vec = backend.embed(query)
        texts = [f"{row.get('body') or ''} {row.get('location_text') or ''}" for row in rows]
        vecs = backend.embed_many(texts) if texts else []
        hits = []
        for row, other, other_vec in zip(rows, texts, vecs):
            rid = str(row.get("id") or "")
            if not rid or rid == self_id:
                continue
            score = _boost_score(cosine(q_vec, other_vec), landmark_tokens(query), landmark_tokens(other))
            if score >= threshold:
                hits.append(
                    {
                        "id": rid,
                        "score": round(score, 4),
                        "cluster_id": row.get("cluster_id"),
                    }
                )
        hits.sort(key=lambda x: x["score"], reverse=True)
        return hits[:limit]
    except Exception:
        reset_embedding_backend()
        return _similar_rows_local(query, rows, self_id, threshold, limit)


def _similar_rows_local(
    query: str,
    rows: List[dict],
    self_id: str,
    threshold: float,
    limit: int,
) -> List[dict]:
    from embedding_providers import _local_embed

    q_vec = _local_embed(query)
    hits = []
    for row in rows:
        rid = str(row.get("id") or "")
        if not rid or rid == self_id:
            continue
        other = f"{row.get('body') or ''} {row.get('location_text') or ''}"
        score = _boost_score(cosine(q_vec, _local_embed(other)), landmark_tokens(query), landmark_tokens(other))
        if score >= threshold:
            hits.append(
                {
                    "id": rid,
                    "score": round(score, 4),
                    "cluster_id": row.get("cluster_id"),
                }
            )
    hits.sort(key=lambda x: x["score"], reverse=True)
    return hits[:limit]


def cluster_texts(texts: List[str], threshold: float = CLUSTER_THRESHOLD) -> List[List[int]]:
    """Connected-component clusters by embedding similarity. Returns lists of indexes."""
    n = len(texts)
    parent = list(range(n))

    def find(i: int) -> int:
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    def union(i: int, j: int) -> None:
        a, b = find(i), find(j)
        if a != b:
            parent[b] = a

    for i in range(n):
        for j in range(i + 1, n):
            if similarity(texts[i], texts[j]) >= threshold:
                union(i, j)
    groups: dict[int, List[int]] = {}
    for i in range(n):
        groups.setdefault(find(i), []).append(i)
    return list(groups.values())
