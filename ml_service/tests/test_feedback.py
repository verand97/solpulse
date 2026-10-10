"""Unit Tests for Feedback Loop Evaluation (Fase 6 / 7)."""

import unittest
import tempfile
import os
from ml_service.database.db_manager import DBManager
from ml_service.monitoring.feedback_loop import FeedbackEvaluator


class TestFeedbackLoop(unittest.TestCase):

    def setUp(self):
        self.tmp_fd, self.tmp_path = tempfile.mkstemp(suffix=".db")
        os.close(self.tmp_fd)
        self.db = DBManager(db_path=self.tmp_path)
        self.evaluator = FeedbackEvaluator(db=self.db)

    def tearDown(self):
        if os.path.exists(self.tmp_path):
            try:
                os.remove(self.tmp_path)
            except Exception:
                pass

    def test_record_feedback_and_summary(self):
        # 1. Initially empty
        summary = self.db.get_feedback_summary()
        self.assertEqual(summary["total_evaluated"], 0)

        # 2. Record successful buy recommendation
        self.db.record_feedback({
            "token_address": "TokenA111",
            "symbol": "TOKENA",
            "horizon": "24h",
            "predicted_recommendation": "STRONG_BUY_CANDIDATE",
            "potential_score": 0.85,
            "risk_score": 0.15,
            "entry_price": 0.001,
            "exit_price": 0.003,
            "actual_return_pct": 200.0,
            "was_success": True,
            "was_rug": False,
            "prediction_correct": True
        })

        # 3. Record correct avoid recommendation
        self.db.record_feedback({
            "token_address": "TokenB222",
            "symbol": "RUGTOKEN",
            "horizon": "24h",
            "predicted_recommendation": "REJECT_UNSAFE",
            "potential_score": 0.05,
            "risk_score": 0.95,
            "entry_price": 0.001,
            "exit_price": 0.0001,
            "actual_return_pct": -90.0,
            "was_success": False,
            "was_rug": True,
            "prediction_correct": True
        })

        summary = self.db.get_feedback_summary()
        self.assertEqual(summary["total_evaluated"], 2)
        self.assertEqual(summary["accuracy"], 1.0)
        self.assertEqual(summary["precision_buy_candidate"], 1.0)
        self.assertGreater(summary["avg_return_pct"], 0)


if __name__ == "__main__":
    unittest.main()
