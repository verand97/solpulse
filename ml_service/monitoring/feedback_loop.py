"""Feedback Loop: Tracks live prediction outcomes at 1h and 24h horizons for model monitoring and retraining."""

import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from ml_service.database.db_manager import DBManager

logger = logging.getLogger(__name__)


class FeedbackEvaluator:
    """
    Evaluates historical predictions against realized price outcomes,
    measuring live precision, hit rate, and calibration accuracy.
    """

    def __init__(self, db: Optional[DBManager] = None):
        self.db = db or DBManager()

    def evaluate_recent_predictions(self, horizon: str = "24h") -> Dict[str, Any]:
        """
        Scan tokens with ML scores, match with snapshots at evaluation horizon,
        and record realized returns and accuracy.
        """
        evaluated_count = 0
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            # Fetch latest score per token
            query = """
            SELECT m.*, t.initial_price_usd
            FROM ml_scores m
            JOIN tokens t ON m.token_address = t.address
            GROUP BY m.token_address
            """
            scores = [dict(r) for r in cursor.execute(query).fetchall()]

        for s in scores:
            addr = s["token_address"]
            symbol = s.get("symbol", "TOKEN")
            rec = s.get("recommendation", "MONITOR")
            pot = float(s.get("potential_score") or 0.5)
            risk = float(s.get("risk_score") or 0.5)
            entry_price = float(s.get("initial_price_usd") or 0.0)

            # Get snapshots for actual exit price
            snapshots = self.db.get_token_snapshots(addr)
            if not snapshots:
                continue

            # Latest available snapshot as exit price
            exit_price = float(snapshots[-1].get("price_usd") or 0.0)
            if entry_price > 0 and exit_price > 0:
                ret_pct = ((exit_price - entry_price) / entry_price) * 100.0
            else:
                ret_pct = 0.0

            was_success = ret_pct >= 100.0  # 2x upside achieved
            was_rug = ret_pct <= -80.0 or s.get("passes_hard_rules") == 0

            # Determine prediction correctness
            if rec in ["STRONG_BUY_CANDIDATE", "ACCUMULATE_WATCH"]:
                prediction_correct = was_success or ret_pct > 20.0
            elif rec in ["AVOID_HIGH_RISK", "REJECT_UNSAFE"]:
                prediction_correct = was_rug or ret_pct < 0.0
            else:
                prediction_correct = not was_rug

            record = {
                "token_address": addr,
                "symbol": symbol,
                "horizon": horizon,
                "predicted_recommendation": rec,
                "potential_score": pot,
                "risk_score": risk,
                "entry_price": entry_price,
                "exit_price": exit_price,
                "actual_return_pct": round(ret_pct, 2),
                "was_success": was_success,
                "was_rug": was_rug,
                "prediction_correct": prediction_correct
            }

            self.db.record_feedback(record)
            evaluated_count += 1

        summary = self.db.get_feedback_summary()
        logger.info(f"Feedback evaluation completed for {evaluated_count} tokens. Summary: {summary}")
        return summary


if __name__ == "__main__":
    evaluator = FeedbackEvaluator()
    evaluator.evaluate_recent_predictions()
