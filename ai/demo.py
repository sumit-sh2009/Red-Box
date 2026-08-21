"""Demo: allow angry criticism, reject vulgar, cluster Central School paraphrases."""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from embeddings import CLUSTER_THRESHOLD, cluster_texts, similarity
from graph import run_pipeline
from moderation import moderate


SCHOOL = [
    "There is a huge pothole outside Central School. Two-wheelers are swerving into the oncoming lane.",
    "The road outside Central School is broken. Students are walking into the street to avoid the crater.",
    "Students are struggling because of the damaged road near Central School. Same stretch for weeks.",
]


def main() -> int:
    angry = moderate(
        "This damn pothole outside Central School is a disgrace and kids could get hurt. The municipality does not care.",
        "Outside Central School",
    )
    vulgar = moderate("fuck you all you stupid sluts this app sucks", "")
    print("ANGRY_CRITICISM", json.dumps(angry))
    print("VULGAR", json.dumps(vulgar))

    groups = cluster_texts(
        [f"{t} Central School" for t in SCHOOL],
        threshold=CLUSTER_THRESHOLD,
    )
    print("SCHOOL_CLUSTERS", groups)
    print(
        "PAIRWISE",
        [round(similarity(SCHOOL[i], SCHOOL[j]), 3) for i in range(3) for j in range(i + 1, 3)],
    )

    existing = []
    last_cluster = None
    for i, text in enumerate(SCHOOL):
        out = run_pipeline(
            {
                "complaint_id": f"demo_{i}",
                "body": text,
                "location_text": "Outside Central School",
                "existing": existing,
            }
        )
        existing.append(
            {
                "id": f"demo_{i}",
                "body": text,
                "location_text": "Outside Central School",
                "cluster_id": last_cluster,
            }
        )
        print("ANALYZE", i, out["category"], out["department"], out["similar_ids"], out["used_llm"], out["model"])
        if out["similar_ids"]:
            last_cluster = last_cluster or "clu_demo"

    ok_allow = angry["action"] == "allow"
    ok_reject = vulgar["action"] == "reject"
    one_group = any(len(g) == 3 for g in groups)
    if not (ok_allow and ok_reject and one_group):
        print("DEMO_FAIL", {"allow": ok_allow, "reject": ok_reject, "cluster3": one_group})
        return 1
    print("DEMO_OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
