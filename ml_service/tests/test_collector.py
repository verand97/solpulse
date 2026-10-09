"""Unit tests for Phase 1 Collector (Jalur A & Jalur B) with mock responses."""

import os
import shutil
import tempfile
import unittest
from unittest.mock import MagicMock
from pathlib import Path

from ..database.db_manager import DBManager
from ..collector.new_pairs_listener import NewPairsListener
from ..collector.snapshot_scheduler import SnapshotScheduler
from ..backfill.backfill import HistoricalBackfill


class TestCollector(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.db_path = str(Path(self.temp_dir) / "test_solpulse.db")
        self.db = DBManager(db_path=self.db_path)

    def tearDown(self):
        # Allow Windows file lock to release
        try:
            shutil.rmtree(self.temp_dir, ignore_errors=True)
        except Exception:
            pass

    def test_database_initialization(self):
        """Verify that all core tables are created properly."""
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = {row[0] for row in cursor.fetchall()}
            
            required_tables = {
                "tokens", "pairs", "snapshots", "security_checks",
                "holders_snapshot", "deployers", "raw_responses",
                "labels", "features", "ml_scores"
            }
            for t in required_tables:
                self.assertIn(t, tables, f"Table '{t}' must exist in schema")

    def test_process_new_token_and_deduplication(self):
        """Verify token processing, deduplication, raw response recording, and T+0 snapshot."""
        listener = NewPairsListener(db=self.db)
        
        # Mock client calls
        listener.rug_client.get_token_report_summary = MagicMock(return_value={
            "score": 150.0,
            "risks": [{"name": "Single holder owns 10%", "level": "warn"}]
        })
        listener.rpc_client.get_holder_concentration = MagicMock(return_value={
            "top1_pct": 12.5,
            "top10_pct": 34.0,
            "total_supply": 1000000.0
        })

        test_token = "So1111111111111111111111111111111111111111TEST1"
        mock_raw = {"info": "test_token_metadata", "symbol": "TEST"}

        # 1. First ingestion must succeed
        success1 = listener.process_new_token(
            token_address=test_token,
            symbol="TEST",
            name="Test Token",
            pair_address="PairAddress123",
            initial_price=0.005,
            initial_liquidity=25000.0,
            source="mock_test",
            raw_data=mock_raw
        )
        self.assertTrue(success1)
        self.assertTrue(self.db.token_exists(test_token))

        # 2. Second ingestion of identical address must be deduplicated (return False)
        success2 = listener.process_new_token(
            token_address=test_token,
            symbol="TEST",
            name="Test Token Duplicate",
            pair_address="PairAddress123",
            initial_price=0.005,
            initial_liquidity=25000.0,
            source="mock_test"
        )
        self.assertFalse(success2)

        # 3. Verify T+0 snapshot was saved
        snapshots = self.db.get_token_snapshots(test_token)
        self.assertEqual(len(snapshots), 1)
        self.assertEqual(snapshots[0]["interval_label"], "t_0")
        self.assertEqual(snapshots[0]["price_usd"], 0.005)
        self.assertEqual(snapshots[0]["liquidity_usd"], 25000.0)

        # 4. Verify Raw Response was recorded
        with self.db.get_connection() as conn:
            raw_count = conn.execute("SELECT count(*) FROM raw_responses").fetchone()[0]
            self.assertGreaterEqual(raw_count, 1)

        listener.stop()

    def test_snapshot_scheduler_execution(self):
        """Verify execution of scheduled snapshots and metric persistence."""
        scheduler = SnapshotScheduler(db=self.db)
        test_token = "So1111111111111111111111111111111111111111TEST2"
        
        self.db.upsert_token({
            "address": test_token,
            "symbol": "SNAP",
            "name": "Snapshot Token",
            "initial_price_usd": 0.01,
            "initial_liquidity_usd": 5000.0
        })

        # Mock DexScreener pair response
        scheduler.dex_client.get_token_pairs = MagicMock(return_value=[{
            "chainId": "solana",
            "pairAddress": "PairXYZ",
            "priceUsd": "0.015",
            "liquidity": {"usd": 12000.0},
            "volume": {"h24": 45000.0, "m5": 1200.0},
            "txns": {
                "h24": {"buys": 120, "sells": 45},
                "m5": {"buys": 8, "sells": 2}
            }
        }])
        scheduler.rpc_client.get_holder_concentration = MagicMock(return_value={
            "top1_pct": 8.0,
            "top10_pct": 25.0
        })
        scheduler.rug_client.get_token_report_summary = MagicMock(return_value={
            "score": 0.0,
            "risks": []
        })

        # Execute T+5m snapshot
        scheduler.execute_snapshot(test_token, "PairXYZ", "t_5m")

        snaps = self.db.get_token_snapshots(test_token)
        self.assertEqual(len(snaps), 1)
        self.assertEqual(snaps[0]["interval_label"], "t_5m")
        self.assertEqual(snaps[0]["price_usd"], 0.015)
        self.assertEqual(snaps[0]["liquidity_usd"], 12000.0)
        self.assertEqual(snaps[0]["buys_m5"], 8)
        self.assertEqual(snaps[0]["sells_m5"], 2)

        scheduler.shutdown()

    def test_backfill_pipeline_and_checkpoint(self):
        """Verify historical backfill with mock OHLCV and checkpointing."""
        cp_path = str(Path(self.temp_dir) / "test_cp.json")
        backfill = HistoricalBackfill(db=self.db, checkpoint_path=cp_path)
        
        base_ts = 1700000000
        mock_ohlcv = [
            [base_ts + (i * 60), 0.001, 0.0012, 0.0009, 0.0011 + (i * 0.0001), 500.0]
            for i in range(120)
        ]
        backfill.gecko.get_pool_ohlcv = MagicMock(return_value=mock_ohlcv)

        token_addr = "So1111111111111111111111111111111111111111BF1"
        pool_addr = "PoolBF1"

        res = backfill.backfill_token_from_pool(
            network="solana",
            pool_address=pool_addr,
            token_address=token_addr,
            symbol="BF1"
        )
        self.assertTrue(res)

        # Check snapshots were generated
        snaps = self.db.get_token_snapshots(token_addr)
        self.assertGreater(len(snaps), 0)

        # Second run should skip due to checkpoint
        res_skip = backfill.backfill_token_from_pool(
            network="solana",
            pool_address=pool_addr,
            token_address=token_addr,
            symbol="BF1"
        )
        self.assertTrue(res_skip)


if __name__ == "__main__":
    unittest.main()
