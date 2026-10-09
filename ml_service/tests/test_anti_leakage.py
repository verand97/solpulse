"""Automated Anti-Leakage Tests: Proves that features do NOT change when future data changes."""

import os
import shutil
import tempfile
import unittest
from datetime import datetime, timezone, timedelta
from pathlib import Path

from ml_service.database.db_manager import DBManager
from ml_service.features.feature_pipeline import FeaturePipeline

class TestAntiLeakage(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.db_path = str(Path(self.temp_dir) / "test_leakage.db")
        self.db = DBManager(db_path=self.db_path)
        self.pipeline = FeaturePipeline(db=self.db)

    def tearDown(self):
        try:
            shutil.rmtree(self.temp_dir, ignore_errors=True)
        except Exception:
            pass

    def test_future_data_does_not_affect_features(self):
        """
        Verify that adding/modifying transactions, prices, or rug events AFTER t_prediction
        strictly leaves the extracted features unchanged.
        """
        token_addr = "So1111111111111111111111111111111111111111LEAK1"
        base_time = datetime(2026, 10, 1, 12, 0, 0, tzinfo=timezone.utc)
        t_prediction = (base_time + timedelta(minutes=5)).isoformat()

        # 1. Insert Initial Token at T+0
        self.db.upsert_token({
            "address": token_addr,
            "symbol": "LEAKTEST",
            "name": "Leakage Test Token",
            "created_at": base_time.isoformat(),
            "first_detected_at": base_time.isoformat(),
            "initial_price_usd": 1.00,
            "initial_liquidity_usd": 10000.0
        })

        # 2. Insert valid snapshot at T+2m (<= t_prediction)
        self.db.add_snapshot({
            "token_address": token_addr,
            "interval_label": "t_2m",
            "timestamp": (base_time + timedelta(minutes=2)).isoformat(),
            "price_usd": 1.20,
            "liquidity_usd": 12000.0,
            "buys_m5": 10,
            "sells_m5": 2
        })

        # 3. Extract baseline features at t_prediction (T+5m)
        features_before = self.pipeline.extract_features(
            token_address=token_addr,
            t_prediction_iso=t_prediction,
            point_in_time_label="t_5m"
        )

        # 4. NOW: Inject massive future changes AFTER t_prediction:
        # - Huge price crash at T+10m ($0.01)
        # - Complete rug pull of liquidity ($10)
        # - Malicious security exploit flag recorded at T+15m
        self.db.add_snapshot({
            "token_address": token_addr,
            "interval_label": "t_10m_future",
            "timestamp": (base_time + timedelta(minutes=10)).isoformat(),
            "price_usd": 0.01, # Huge crash in future
            "liquidity_usd": 10.0, # Massive liquidity drain
            "buys_m5": 0,
            "sells_m5": 500
        })

        self.db.add_security_check({
            "token_address": token_addr,
            "chain": "solana",
            "snapshot_time": (base_time + timedelta(minutes=15)).isoformat(),
            "source": "future_rugcheck",
            "danger_risks_count": 99,
            "is_mintable": True
        })

        # 5. Re-extract features at the EXACT SAME t_prediction
        features_after = self.pipeline.extract_features(
            token_address=token_addr,
            t_prediction_iso=t_prediction,
            point_in_time_label="t_5m"
        )

        # 6. ASSERTION: features_before must match features_after EXACTLY.
        # Zero future data leakage!
        self.assertEqual(features_before["current_price_usd"], 1.20)
        self.assertEqual(features_after["current_price_usd"], 1.20)
        
        self.assertEqual(features_before["current_liq_usd"], 12000.0)
        self.assertEqual(features_after["current_liq_usd"], 12000.0)

        self.assertEqual(features_before["danger_risks_count"], 0)
        self.assertEqual(features_after["danger_risks_count"], 0)

        self.assertEqual(features_before, features_after)


if __name__ == "__main__":
    unittest.main()
