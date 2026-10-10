"""Unit Tests for Drift Detection (PSI / KS) and Retraining Pipeline."""

import unittest
import numpy as np
import pandas as pd

from ml_service.monitoring.drift_detector import DriftDetector
from ml_service.monitoring.retrainer import ModelRetrainer


class TestMonitoring(unittest.TestCase):

    def setUp(self):
        self.detector = DriftDetector(num_buckets=10)
        np.random.seed(42)

    def test_psi_identical_distributions(self):
        ref = np.random.normal(loc=10.0, scale=2.0, size=500)
        cur = np.random.normal(loc=10.0, scale=2.0, size=500)
        psi = self.detector.calculate_psi(ref, cur)
        self.assertLess(psi, 0.10, f"Identical distributions should have PSI < 0.10, got {psi}")

    def test_psi_significant_drift(self):
        ref = np.random.normal(loc=5.0, scale=1.0, size=500)
        cur = np.random.normal(loc=15.0, scale=3.0, size=500)
        psi = self.detector.calculate_psi(ref, cur)
        self.assertGreater(psi, 0.25, f"Shifted distributions should have PSI > 0.25, got {psi}")

    def test_ks_statistic(self):
        ref = np.random.uniform(0, 10, size=300)
        cur = np.random.uniform(20, 30, size=300)
        stat, pval = self.detector.calculate_ks(ref, cur)
        self.assertGreater(stat, 0.8)
        self.assertLess(pval, 0.01)

    def test_dataframe_drift_evaluation(self):
        vals_a = np.random.normal(0, 1, 500)
        ref_df = pd.DataFrame({
            "feature_a": vals_a,
            "feature_b": np.random.normal(5, 1, 500)
        })
        cur_df = pd.DataFrame({
            "feature_a": vals_a.copy(),  # 0 drift
            "feature_b": np.random.normal(25, 5, 500)  # Heavy drift
        })


        report = self.detector.evaluate_features_drift(ref_df, cur_df)
        self.assertIn("feature_reports", report)
        self.assertIn("feature_a", report["feature_reports"])
        self.assertEqual(report["feature_reports"]["feature_a"]["status"], "STABLE")
        self.assertEqual(report["feature_reports"]["feature_b"]["status"], "SIGNIFICANT_DRIFT")

    def test_retrainer_metadata_loading(self):
        retrainer = ModelRetrainer()
        meta = retrainer.load_champion_metadata()
        self.assertIsInstance(meta, dict)
        self.assertIn("model_version", meta)


if __name__ == "__main__":
    unittest.main()
