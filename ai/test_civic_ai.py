import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from embeddings import cluster_texts, similarity
from graph import rag_department, run_pipeline
from moderation import heuristic_moderate, moderate
from priority import priority_score


class ModerationTests(unittest.TestCase):
    def test_allow_angry_civic_criticism(self):
        v = moderate(
            "This damn pothole outside Central School is a disgrace and kids could get hurt.",
            "Central School",
        )
        self.assertEqual(v["action"], "allow")

    def test_reject_vulgar_no_civic_issue(self):
        v = heuristic_moderate("fuck you all you stupid sluts", "").model_dump()
        self.assertEqual(v["action"], "reject")

    def test_revise_abuse_with_issue(self):
        v = heuristic_moderate(
            "There's a pothole you fucking bitch at the Central School gate",
            "Central School",
        ).model_dump()
        self.assertEqual(v["action"], "revise")
        self.assertTrue(v["rewrite_message"])


class ClusterTests(unittest.TestCase):
    def test_central_school_paraphrases_cluster(self):
        texts = [
            "There is a huge pothole outside Central School. Two-wheelers are swerving into the oncoming lane.",
            "The road outside Central School is broken. Students are walking into the street to avoid the crater.",
            "Students are struggling because of the damaged road near Central School. Same stretch for weeks.",
        ]
        groups = cluster_texts(texts, threshold=0.40)
        self.assertTrue(any(len(g) == 3 for g in groups), groups)
        self.assertGreater(similarity(texts[0], texts[1]), 0.40)

    def test_pipeline_similar_ids(self):
        a = run_pipeline(
            {
                "complaint_id": "a",
                "body": "Huge pothole outside Central School affecting students.",
                "location_text": "Outside Central School",
                "existing": [],
            }
        )
        b = run_pipeline(
            {
                "complaint_id": "b",
                "body": "Broken road in front of Central School, same crater.",
                "location_text": "Central School gate",
                "existing": [
                    {
                        "id": "a",
                        "body": "Huge pothole outside Central School affecting students.",
                        "location_text": "Outside Central School",
                    }
                ],
            }
        )
        self.assertIn("a", b["similar_ids"])
        self.assertEqual(a["used_llm"] in (True, False), True)
        self.assertIn(a["category"], ("Roads & Infrastructure", "Education & Community", "Public Safety & Hazards"))


class RagAndPriorityTests(unittest.TestCase):
    def test_rag_roads_department(self):
        route = rag_department(
            "Deep pothole on the carriageway",
            "Main Road",
            "Roads & Infrastructure",
        )
        self.assertIn("Works", route.department)
        self.assertTrue(route.grounded)

    def test_priority_is_deterministic(self):
        a = priority_score(3, 41, "high", "high", 48)
        b = priority_score(3, 41, "high", "high", 48)
        self.assertEqual(a, b)
        self.assertGreater(a["government_priority"], 0.5)


if __name__ == "__main__":
    unittest.main()
