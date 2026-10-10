"""Data Drift and Population Stability Index (PSI) Detector for DEX ML Screener."""

import logging
from typing import Dict, Any, List, Tuple, Optional
import numpy as np
import pandas as pd
from scipy import stats

logger = logging.getLogger(__name__)


class DriftDetector:
    """
    Monitors distribution shifts between the baseline training distribution
    and incoming live inference feature distributions.
    """

    PSI_THRESHOLD_MODERATE = 0.10
    PSI_THRESHOLD_SIGNIFICANT = 0.25

    def __init__(self, num_buckets: int = 10, epsilon: float = 1e-4):
        self.num_buckets = num_buckets
        self.epsilon = epsilon

    def calculate_psi(self, reference: np.ndarray, current: np.ndarray) -> float:
        """
        Calculate Population Stability Index (PSI) between reference and current feature samples.
        PSI = sum((Current% - Reference%) * ln(Current% / Reference%))
        
        PSI < 0.10: No significant change
        0.10 <= PSI < 0.25: Moderate shift, monitor closely
        PSI >= 0.25: Significant drift, retrain recommended
        """
        ref_clean = reference[~np.isnan(reference)]
        cur_clean = current[~np.isnan(current)]

        if len(ref_clean) < 5 or len(cur_clean) < 5:
            return 0.0

        # Create quantiles based on reference distribution
        percentiles = np.linspace(0, 100, self.num_buckets + 1)
        breakpoints = np.percentile(ref_clean, percentiles)
        breakpoints[0] = -np.inf
        breakpoints[-1] = np.inf

        # Handle identical percentiles (e.g. sparse features with many 0s)
        breakpoints = np.unique(breakpoints)
        if len(breakpoints) < 2:
            return 0.0

        # Bin counts
        ref_counts, _ = np.histogram(ref_clean, bins=breakpoints)
        cur_counts, _ = np.histogram(cur_clean, bins=breakpoints)

        # Convert to proportions with epsilon smoothing
        ref_pct = (ref_counts + self.epsilon) / (len(ref_clean) + self.epsilon * len(ref_counts))
        cur_pct = (cur_counts + self.epsilon) / (len(cur_clean) + self.epsilon * len(cur_counts))

        # PSI sum
        psi_value = np.sum((cur_pct - ref_pct) * np.log(cur_pct / ref_pct))
        return float(psi_value)

    def calculate_ks(self, reference: np.ndarray, current: np.ndarray) -> Tuple[float, float]:
        """
        Perform two-sample Kolmogorov-Smirnov test.
        Returns: (ks_statistic, p_value)
        """
        ref_clean = reference[~np.isnan(reference)]
        cur_clean = current[~np.isnan(current)]
        if len(ref_clean) < 5 or len(cur_clean) < 5:
            return 0.0, 1.0

        res = stats.ks_2samp(ref_clean, cur_clean)
        return float(res.statistic), float(res.pvalue)

    def evaluate_features_drift(
        self,
        ref_df: pd.DataFrame,
        cur_df: pd.DataFrame,
        features: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Run PSI and KS drift checks across specified features.
        """
        cols = features or [c for c in ref_df.columns if c in cur_df.columns and pd.api.types.is_numeric_dtype(ref_df[c])]
        
        feature_reports = {}
        high_drift_count = 0
        moderate_drift_count = 0

        for col in cols:
            ref_vals = ref_df[col].to_numpy(dtype=float)
            cur_vals = cur_df[col].to_numpy(dtype=float)

            psi = self.calculate_psi(ref_vals, cur_vals)
            ks_stat, ks_pval = self.calculate_ks(ref_vals, cur_vals)

            if psi >= self.PSI_THRESHOLD_SIGNIFICANT:
                status = "SIGNIFICANT_DRIFT"
                high_drift_count += 1
            elif psi >= self.PSI_THRESHOLD_MODERATE:
                status = "MODERATE_DRIFT"
                moderate_drift_count += 1
            else:
                status = "STABLE"

            feature_reports[col] = {
                "psi": round(psi, 4),
                "ks_stat": round(ks_stat, 4),
                "ks_pvalue": round(ks_pval, 4),
                "status": status
            }

        retrain_recommended = high_drift_count >= 2 or (high_drift_count + moderate_drift_count) >= max(3, len(cols) // 3)

        return {
            "retrain_recommended": retrain_recommended,
            "total_features_evaluated": len(cols),
            "high_drift_features_count": high_drift_count,
            "moderate_drift_features_count": moderate_drift_count,
            "feature_reports": feature_reports
        }
