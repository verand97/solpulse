"""Batch Scorer: Computes ML scores for all tokens in DB and checks for alert triggers."""

import sys
import logging
from typing import List, Dict, Any

from ml_service.database.db_manager import DBManager
from ml_service.inference.scorer import TokenScorer
from ml_service.inference.alert_service import AlertService

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def run_batch_scoring(dry_run_alerts: bool = True) -> List[Dict[str, Any]]:
    db = DBManager()
    scorer = TokenScorer(db=db)
    alerter = AlertService(db=db)

    tokens = db.get_recent_tokens(limit=200)
    logger.info(f"Loaded {len(tokens)} tokens for ML scoring...")

    scores = []
    for i, tok in enumerate(tokens, 1):
        addr = tok["address"]
        symbol = tok.get("symbol", "UNKNOWN")
        try:
            score = scorer.score_token(addr)
            scores.append(score)
            logger.info(
                f"[{i}/{len(tokens)}] {symbol} ({addr[:6]}...): "
                f"Potential={score['potential_score']:.2f}, "
                f"Risk={score['risk_score']:.2f}, "
                f"Rec={score['recommendation']}"
            )
            # Check alert condition
            if not dry_run_alerts and alerter.should_alert(score):
                alerter.dispatch_alert(score)
        except Exception as e:
            logger.error(f"Failed to score token {symbol} ({addr}): {e}")

    logger.info(f"Successfully processed {len(scores)} tokens.")
    return scores


if __name__ == "__main__":
    run_batch_scoring(dry_run_alerts=False)
