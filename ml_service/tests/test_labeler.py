"""Unit tests for Phase 2: Multi-target Labeling Pipeline."""

import os
import shutil
import tempfile
import unittest
from pathlib import Path
from datetime import datetime, timezone, timedelta

from ml_service.database.db_manager import DBManager
from ml_service.labeling.labeler import TokenLabeler


class TestTokenLabeler(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.db_path = str(Path(self.temp_dir) / "test_labeler.db")
        self.db = DBManager(db_path=self.db_path)
        self.labeler = TokenLabeler(db=self.db)

    def tearDown(self):
        try:
            shutil.rmtree(self.temp_dir, ignore_errors=True)
        except Exception:
            pass

    def test_honeypot_labeling(self):
        """Tokens with excessive sell tax (>50%) must be labeled as honeypot and cannot succeed."""
        token_addr = "So1111111111111111111111111111111111111111HONEY1"
        base_time = datetime(2026, 10, 1, 12, 0, 0, tzinfo=timezone.utc)

        self.db.upsert_token({
            "address": token_addr,
            "symbol": "HONEY",
            "initial_price_usd": 1.0,
            "initial_liquidity_usd": 10000.0,
            "first_detected_at": base_time.isoformat()
        })

        self.db.add_snapshot({
            "token_address": token_addr,
            "interval_label": "t_5m",
            "timestamp": (base_time + timedelta(minutes=5)).isoformat(),
            "price_usd": 1.0,
            "liquidity_usd": 10000.0
        })

        # Giant price pump 10x
        self.db.add_snapshot({
            "token_address": token_addr,
            "interval_label": "t_60m",
            "timestamp": (base_time + timedelta(minutes=60)).isoformat(),
            "price_usd": 10.0,
            "liquidity_usd": 10000.0
        })

        # Malicious sell tax: 99%
        self.db.add_security_check({
            "token_address": token_addr,
            "chain": "solana",
            "snapshot_time": (base_time + timedelta(minutes=5)).isoformat(),
            "source": "rugcheck",
            "sell_tax": 99.0
        })

        label = self.labeler.compute_token_label(token_addr)
        self.assertIsNotNone(label)
        self.assertTrue(label["is_honeypot"])
        self.assertFalse(label["success"])  # A honeypot can never be a success

    def test_rug_pull_labeling(self):
        """Tokens with liquidity drop > 80% must be labeled as rug and cannot succeed."""
        token_addr = "So1111111111111111111111111111111111111111RUG1"
        base_time = datetime(2026, 10, 1, 12, 0, 0, tzinfo=timezone.utc)

        self.db.upsert_token({
            "address": token_addr,
            "symbol": "RUGGY",
            "initial_price_usd": 1.0,
            "initial_liquidity_usd": 100000.0,
            "first_detected_at": base_time.isoformat()
        })

        self.db.add_snapshot({
            "token_address": token_addr,
            "interval_label": "t_5m",
            "timestamp": (base_time + timedelta(minutes=5)).isoformat(),
            "price_usd": 1.0,
            "liquidity_usd": 100000.0
        })

        # Massive liquidity drain down to $5,000 (95% drop)
        self.db.add_snapshot({
            "token_address": token_addr,
            "interval_label": "t_60m",
            "timestamp": (base_time + timedelta(minutes=60)).isoformat(),
            "price_usd": 0.05,
            "liquidity_usd": 5000.0
        })

        label = self.labeler.compute_token_label(token_addr)
        self.assertIsNotNone(label)
        self.assertTrue(label["is_rug"])
        self.assertFalse(label["success"])

    def test_dead_token_labeling(self):
        """Tokens where price drops > 90% from peak must be labeled as dead."""
        token_addr = "So1111111111111111111111111111111111111111DEAD1"
        base_time = datetime(2026, 10, 1, 12, 0, 0, tzinfo=timezone.utc)

        self.db.upsert_token({
            "address": token_addr,
            "symbol": "DEADP",
            "initial_price_usd": 1.0,
            "initial_liquidity_usd": 10000.0,
            "first_detected_at": base_time.isoformat()
        })

        self.db.add_snapshot({
            "token_address": token_addr,
            "interval_label": "t_5m",
            "timestamp": (base_time + timedelta(minutes=5)).isoformat(),
            "price_usd": 5.0,  # Peak
            "liquidity_usd": 10000.0
        })

        self.db.add_snapshot({
            "token_address": token_addr,
            "interval_label": "t_6h",
            "timestamp": (base_time + timedelta(hours=6)).isoformat(),
            "price_usd": 0.20,  # Dropped 96% from peak $5.0 -> $0.20
            "liquidity_usd": 10000.0
        })

        label = self.labeler.compute_token_label(token_addr)
        self.assertIsNotNone(label)
        self.assertTrue(label["is_dead"])

    def test_net_return_and_sensitivity_thresholds(self):
        """Verify realistic friction deduction and multi-target threshold sensitivity (2x vs 3x vs 5x)."""
        token_addr = "So1111111111111111111111111111111111111111SENS1"
        base_time = datetime(2026, 10, 1, 12, 0, 0, tzinfo=timezone.utc)

        self.db.upsert_token({
            "address": token_addr,
            "symbol": "SENS",
            "initial_price_usd": 1.0,
            "initial_liquidity_usd": 20000.0,
            "first_detected_at": base_time.isoformat()
        })

        # Entry price at T+5m = $1.00
        self.db.add_snapshot({
            "token_address": token_addr,
            "interval_label": "t_5m",
            "timestamp": (base_time + timedelta(minutes=5)).isoformat(),
            "price_usd": 1.0,
            "liquidity_usd": 20000.0
        })

        # Peak price = $2.80 (2.8x gross)
        # With 3% slippage and 0.6% roundtrip fees: 2.8 * (0.97) * (0.997^2) ~= 2.70x net return
        self.db.add_snapshot({
            "token_address": token_addr,
            "interval_label": "t_60m",
            "timestamp": (base_time + timedelta(minutes=60)).isoformat(),
            "price_usd": 2.8,
            "liquidity_usd": 25000.0
        })

        label = self.labeler.compute_token_label(token_addr)
        self.assertIsNotNone(label)
        
        # Net return is ~2.70x:
        # Passes 2.0x threshold
        self.assertTrue(label["success_2x"])
        # Fails 3.0x threshold
        self.assertFalse(label["success_3x"])
        # Fails 5.0x threshold
        self.assertFalse(label["success_5x"])


if __name__ == "__main__":
    unittest.main()
