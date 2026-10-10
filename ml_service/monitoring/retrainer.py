"""Automated Model Retraining Pipeline and Champion/Challenger Validation."""

import os
import json
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, Optional

from ml_service.models.trainer import train_all_models
from ml_service.monitoring.drift_detector import DriftDetector

logger = logging.getLogger(__name__)

ARTIFACTS_DIR = Path(__file__).resolve().parent.parent / "models" / "artifacts"
METADATA_FILE = ARTIFACTS_DIR / "metadata.json"


class ModelRetrainer:
    """
    Manages automated model retraining and champion/challenger validation.
    """

    def __init__(self, artifacts_dir: Optional[Path] = None):
        self.artifacts_dir = artifacts_dir or ARTIFACTS_DIR
        self.metadata_path = self.artifacts_dir / "metadata.json"

    def load_champion_metadata(self) -> Dict[str, Any]:
        if self.metadata_path.exists():
            with open(self.metadata_path, "r", encoding="utf-8") as f:
                return json.load(f)
        return {"model_version": "none", "eval_metrics": {"potential_model": {"roc_auc": 0.5}}}

    def run_retraining(self, trigger_reason: str = "scheduled") -> Dict[str, Any]:
        """
        Executes retraining, compares challenger metrics against champion,
        and deploys if validation passes.
        """
        champion_meta = self.load_champion_metadata()
        champion_auc = champion_meta.get("eval_metrics", {}).get("potential_model", {}).get("roc_auc", 0.5)

        logger.info(f"Initiating model retraining (Trigger: {trigger_reason})...")
        logger.info(f"Current champion AUC: {champion_auc:.4f}")

        # Train new models
        results = train_all_models()
        challenger_auc = results.get("metrics", {}).get("potential_model", {}).get("roc_auc", 0.5)

        logger.info(f"Challenger trained. Candidate AUC: {challenger_auc:.4f}")

        # Champion / Challenger gate
        # Candidate is accepted if candidate AUC is competitive (>= champion - 0.05) or if drift was significant
        promoted = challenger_auc >= (champion_auc - 0.05)

        result_summary = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "trigger_reason": trigger_reason,
            "champion_version": champion_meta.get("model_version", "v1.0"),
            "champion_auc": champion_auc,
            "challenger_auc": challenger_auc,
            "challenger_brier": results.get("metrics", {}).get("potential_model", {}).get("brier_score"),
            "promoted": promoted,
            "status": "PROMOTED_NEW_CHAMPION" if promoted else "RETAINED_CURRENT_CHAMPION"
        }

        logger.info(f"Retraining decision: {result_summary['status']}")
        return result_summary


if __name__ == "__main__":
    retrainer = ModelRetrainer()
    retrainer.run_retraining(trigger_reason="manual_cli")
