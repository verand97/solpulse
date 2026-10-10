"""End-to-End ML Screener Daemon Orchestrator.
Combines: Forward Collector -> Point-in-Time Feature Extraction -> Hard Rules & ML Scoring -> Alert Dispatcher -> Feedback Loop -> Drift Monitoring.
"""

import os
import sys
import time
import logging
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml_service.database.db_manager import DBManager
from ml_service.collector.new_pairs_listener import NewPairsListener
from ml_service.inference.scorer import TokenScorer
from ml_service.inference.alert_service import AlertService
from ml_service.monitoring.feedback_loop import FeedbackEvaluator
from ml_service.monitoring.drift_detector import DriftDetector

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s"
)
logger = logging.getLogger("MLOrchestrator")


class ScreenerOrchestrator:
    """End-to-end continuous orchestration loop."""

    def __init__(self, poll_interval_seconds: int = 45):
        self.poll_interval = poll_interval_seconds
        self.db = DBManager()
        self.listener = NewPairsListener(poll_interval=self.poll_interval)
        self.scorer = TokenScorer(db=self.db)
        self.alerter = AlertService(db=self.db)
        self.feedback_evaluator = FeedbackEvaluator(db=self.db)
        self.drift_detector = DriftDetector()

    def run_cycle(self) -> dict:
        """Run a single complete orchestration cycle."""
        logger.info("Starting Screener Orchestration cycle...")
        
        # 1. Forward Collector Poll
        new_count = self.listener.run_once()
        logger.info(f"Collector poll complete: {new_count} new token(s) identified.")

        # 2. Score Unscored / Recent Tokens
        recent_tokens = self.db.get_recent_tokens(limit=10)
        scored_count = 0
        alert_count = 0

        for tok in recent_tokens:
            addr = tok["address"]
            try:
                score_data = self.scorer.score_token(addr)
                scored_count += 1
                
                # 3. Alert Dispatch if criteria met
                if self.alerter.should_alert(score_data):
                    sent = self.alerter.dispatch_alert(score_data)
                    if sent:
                        alert_count += 1
            except Exception as e:
                logger.error(f"Error scoring token {addr}: {e}")

        logger.info(f"Scored {scored_count} token(s), dispatched {alert_count} alert(s).")

        # 4. Feedback Loop Evaluation
        fb_summary = self.feedback_evaluator.evaluate_recent_predictions()

        return {
            "new_tokens": new_count,
            "scored_tokens": scored_count,
            "alerts_dispatched": alert_count,
            "feedback_accuracy": fb_summary.get("accuracy", 0.0)
        }

    def run_forever(self):
        """Continuously loop orchestration cycles with sleep delay."""
        logger.info(f"ML Screener Orchestrator running indefinitely (interval: {self.poll_interval}s)...")
        while True:
            try:
                self.run_cycle()
            except Exception as e:
                logger.error(f"Error in orchestrator cycle: {e}")
            time.sleep(self.poll_interval)


def main():
    orchestrator = ScreenerOrchestrator(poll_interval_seconds=30)
    if "--daemon" in sys.argv:
        orchestrator.run_forever()
    else:
        # Run single test cycle by default
        summary = orchestrator.run_cycle()
        logger.info(f"Single cycle finished: {summary}")


if __name__ == "__main__":
    main()
