"""Unit tests for Phase 5: Realistic Backtesting Engine."""

import unittest
import numpy as np
import pandas as pd

from ml_service.backtest.backtester import RealisticBacktester


class TestRealisticBacktester(unittest.TestCase):
    def setUp(self):
        self.backtester = RealisticBacktester(
            position_size_usd=100.0,
            base_slippage_pct=3.0,
            dex_fee_pct=0.3,
            gas_usd=0.005,
            execution_latency_secs=45
        )

    def test_dynamic_slippage_scaling(self):
        """Friction must scale inversely with pool liquidity."""
        friction_low_liq = self.backtester.calculate_effective_friction(pool_liquidity_usd=2000.0)
        friction_high_liq = self.backtester.calculate_effective_friction(pool_liquidity_usd=200000.0)

        # Smaller pool liquidity causes significantly higher slippage + impact
        self.assertGreater(friction_low_liq, friction_high_liq)
        self.assertGreaterEqual(friction_high_liq, 0.035)  # At least base slippage + roundtrip fees

    def test_honeypot_and_rug_penalty(self):
        """Honeypot causes total 100% loss, and rug pull causes 95% drain penalty."""
        res_honeypot = self.backtester.simulate_trade(
            entry_price=1.0,
            peak_price=10.0,
            final_price=5.0,
            pool_liquidity=10000.0,
            is_rug=False,
            is_honeypot=True,
            strategy="tp_sl"
        )
        self.assertEqual(res_honeypot["return_multiplier"], 0.0)
        self.assertEqual(res_honeypot["pnl_usd"], -100.0)
        self.assertEqual(res_honeypot["exit_reason"], "HONEYPOT_LOSS")

        res_rug = self.backtester.simulate_trade(
            entry_price=1.0,
            peak_price=5.0,
            final_price=0.1,
            pool_liquidity=10000.0,
            is_rug=True,
            is_honeypot=False,
            strategy="tp_sl"
        )
        self.assertEqual(res_rug["return_multiplier"], 0.05)
        self.assertLessEqual(res_rug["pnl_usd"], -95.0)
        self.assertEqual(res_rug["exit_reason"], "RUG_PULL_DRAIN")

    def test_take_profit_and_stop_loss_logic(self):
        """Verify take-profit and stop-loss execution thresholds."""
        # 1. Take Profit trigger at 2.5x
        res_tp = self.backtester.simulate_trade(
            entry_price=1.0,
            peak_price=3.0,
            final_price=1.2,
            pool_liquidity=50000.0,
            is_rug=False,
            is_honeypot=False,
            strategy="tp_sl"
        )
        self.assertEqual(res_tp["exit_reason"], "TAKE_PROFIT_2.5X")
        self.assertGreater(res_tp["pnl_usd"], 100.0)  # Profitable trade

        # 2. Stop Loss trigger at -30%
        res_sl = self.backtester.simulate_trade(
            entry_price=1.0,
            peak_price=1.1,
            final_price=0.60,
            pool_liquidity=50000.0,
            is_rug=False,
            is_honeypot=False,
            strategy="tp_sl"
        )
        self.assertEqual(res_sl["exit_reason"], "STOP_LOSS_30PCT")
        self.assertLess(res_sl["pnl_usd"], -25.0)  # Loss capped by SL

    def test_backtest_dataset_simulation(self):
        """Verify backtest execution across mock test split."""
        df_test = pd.DataFrame({
            "current_price_usd": [1.0, 1.0, 1.0, 1.0],
            "initial_price_usd": [1.0, 1.0, 1.0, 1.0],
            "current_liq_usd": [10000.0, 20000.0, 15000.0, 8000.0],
            "label_net_return_24h": [2.6, 0.6, 1.5, 0.4],
            "label_is_rug": [0, 0, 0, 1],
            "label_is_honeypot": [0, 0, 0, 0],
            "label_is_dead": [0, 1, 0, 1],
            "tx_count_5m": [50, 5, 25, 2]
        })

        ml_probs = np.array([0.9, 0.1, 0.8, 0.2])
        risk_probs = np.array([0.1, 0.9, 0.2, 0.8])

        summary = self.backtester.run_backtest_on_dataset(df_test, ml_probs, risk_probs, strategy="tp_sl")
        self.assertIn("ml_model", summary)
        self.assertIn("heuristic_baseline", summary)
        self.assertIn("random_baseline", summary)
        self.assertEqual(summary["ml_model"]["total_trades"], 2)


if __name__ == "__main__":
    unittest.main()
