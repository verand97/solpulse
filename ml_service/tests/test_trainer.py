"""Unit tests for Phase 4: Model Training and Evaluation Pipeline."""

import os
import shutil
import tempfile
import unittest
from pathlib import Path
import numpy as np
import pandas as pd

from ml_service.models.trainer import ModelTrainer


class TestModelTrainer(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.parquet_path = Path(self.temp_dir) / "test_features.parquet"

        # Synthesize realistic small dataset for test verification
        n = 50
        rng = np.random.RandomState(42)
        
        data = {
            "token_address": [f"Token_{i}" for i in range(n)],
            "symbol": [f"SYM_{i}" for i in range(n)],
            "chain": ["solana"] * n,
            "feature_version": ["v1.0"] * n,
            "point_in_time": ["t_5m"] * n,
            "liq_usd_initial": rng.uniform(1000, 50000, n),
            "current_liq_usd": rng.uniform(1000, 50000, n),
            "tx_count_5m": rng.randint(5, 500, n),
            "buy_sell_volume_ratio": rng.uniform(0.5, 3.0, n),
            "price_change_5m": rng.uniform(-20, 100, n),
            "is_mintable": rng.choice([0, 1], p=[0.9, 0.1], size=n),
            "sell_tax": rng.choice([0.0, 5.0, 99.0], p=[0.8, 0.15, 0.05], size=n),
            "top1_pct": rng.uniform(5.0, 40.0, n),
            "label_success": rng.choice([0, 1], p=[0.85, 0.15], size=n),
            "label_is_rug": [0] * n,
            "label_is_honeypot": [0] * n,
            "label_is_dead": [0] * n,
            "label_net_return_24h": rng.uniform(0.5, 5.0, n)
        }
        df = pd.DataFrame(data)
        df.to_parquet(str(self.parquet_path), index=False)

        self.trainer = ModelTrainer(data_path=str(self.parquet_path))

    def tearDown(self):
        try:
            shutil.rmtree(self.temp_dir, ignore_errors=True)
        except Exception:
            pass

    def test_chronological_split(self):
        """Chronological split must split 60/20/20 with zero overlap across splits."""
        train, val, test = self.trainer.chronological_split()
        
        self.assertEqual(len(train), 30)  # 60% of 50
        self.assertEqual(len(val), 10)    # 20% of 50
        self.assertEqual(len(test), 10)   # 20% of 50

        # Zero overlap
        train_addrs = set(train["token_address"])
        val_addrs = set(val["token_address"])
        test_addrs = set(test["token_address"])

        self.assertTrue(train_addrs.isdisjoint(val_addrs))
        self.assertTrue(train_addrs.isdisjoint(test_addrs))
        self.assertTrue(val_addrs.isdisjoint(test_addrs))

    def test_metrics_evaluation(self):
        """Evaluate calculation of PR-AUC, ROC-AUC, Brier score, Precision, and Recall."""
        y_true = np.array([0, 0, 0, 1, 1])
        y_prob = np.array([0.1, 0.2, 0.3, 0.8, 0.9])

        metrics = self.trainer.evaluate_predictions(y_true, y_prob, threshold=0.5)

        self.assertIn("pr_auc", metrics)
        self.assertIn("roc_auc", metrics)
        self.assertIn("brier_score", metrics)
        self.assertIn("precision", metrics)
        self.assertIn("recall", metrics)

        self.assertEqual(metrics["roc_auc"], 1.0)
        self.assertEqual(metrics["precision"], 1.0)
        self.assertEqual(metrics["recall"], 1.0)


if __name__ == "__main__":
    unittest.main()
