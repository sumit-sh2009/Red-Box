from __future__ import annotations


def priority_score(
    cluster_size: int,
    support: int,
    severity: str,
    urgency: str,
    age_hours: float,
) -> dict:
    sev = {"low": 0.25, "medium": 0.5, "high": 0.8, "critical": 1.0}
    urg = {"low": 0.25, "medium": 0.5, "high": 0.8, "critical": 1.0}
    size_n = min(1.0, cluster_size / 8.0)
    sup_n = min(1.0, support / 40.0)
    persist = min(1.0, age_hours / (14 * 24))
    government = (
        0.22 * size_n
        + 0.18 * sup_n
        + 0.28 * sev.get(severity, 0.5)
        + 0.22 * urg.get(urgency, 0.5)
        + 0.1 * persist
    )
    return {
        "popularity": round(0.6 * sup_n + 0.4 * size_n, 3),
        "severity": round(sev.get(severity, 0.5), 3),
        "urgency": round(urg.get(urgency, 0.5), 3),
        "government_priority": round(government, 3),
    }
