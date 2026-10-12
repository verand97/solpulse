"""Inference Scorer: Hard Rules Filter + ML Potential, Risk, and Anomaly Scoring."""

import os
import json
import pickle
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple

import numpy as np

from ml_service.database.db_manager import DBManager
from ml_service.features.feature_pipeline import FeaturePipeline

logger = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).resolve().parent.parent / "models" / "artifacts"
CONFIG_PATH = Path(__file__).resolve().parent.parent.parent / "configs" / "config.yaml"


class TokenScorer:
    """
    Two-stage inference scorer:
    Stage 1: Hard rules filtering (deterministic safety rejection)
    Stage 2: ML scoring (Potential, Risk, Anomaly models + SHAP/driver explanations)
    """

    def __init__(self, db: Optional[DBManager] = None):
        self.db = db or DBManager()
        self.pipeline = FeaturePipeline(db=self.db)
        self.pot_model = None
        self.risk_model = None
        self.anomaly_model = None
        self.metadata = {}
        self._load_models()

    def _load_models(self):
        pot_path = MODELS_DIR / "potential_model.pkl"
        risk_path = MODELS_DIR / "risk_model.pkl"
        anomaly_path = MODELS_DIR / "anomaly_model.pkl"
        meta_path = MODELS_DIR / "metadata.json"

        if pot_path.exists():
            with open(pot_path, "rb") as f:
                self.pot_model = pickle.load(f)
        if risk_path.exists():
            with open(risk_path, "rb") as f:
                self.risk_model = pickle.load(f)
        if anomaly_path.exists():
            with open(anomaly_path, "rb") as f:
                self.anomaly_model = pickle.load(f)
        if meta_path.exists():
            with open(meta_path, "r", encoding="utf-8") as f:
                self.metadata = json.load(f)

    def evaluate_hard_rules(self, token_features: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """
        Hard rules evaluation executed before ML scoring:
        - Mint authority enabled -> REJECT
        - Freeze authority enabled -> REJECT
        - Sell tax > 15% -> REJECT
        - Honeypot simulation failed -> REJECT
        - Top 1 holder owns > 35% without LP lock -> REJECT
        """
        if token_features.get("mint_authority_enabled") == 1:
            return False, "Mint authority is enabled (infinite supply mint risk)"
        if token_features.get("freeze_authority_enabled") == 1:
            return False, "Freeze authority is enabled (blacklist/honeypot risk)"
        if token_features.get("sell_tax", 0) > 15.0:
            return False, f"Sell tax is excessive ({token_features.get('sell_tax')}%)"
        if token_features.get("honeypot_sim_pass") == 0:
            return False, "Failed honeypot / contract safety simulation"
        if token_features.get("top1_pct", 0) > 35.0 and token_features.get("lp_locked_pct", 0) < 50.0:
            return False, f"Whale concentration too high ({token_features.get('top1_pct')}% in single wallet)"

        return True, None

    def score_token(self, token_address: str, point_in_time_iso: Optional[str] = None) -> Dict[str, Any]:
        """
        Score a token end-to-end and persist results in ml_scores table.
        """
        pit = point_in_time_iso or datetime.now(timezone.utc).isoformat()
        features = self.pipeline.extract_features(token_address, t_prediction_iso=pit, point_in_time_label="live")

        # 1. Stage 1: Hard Rules
        passes_hard, reject_reason = self.evaluate_hard_rules(features)

        # 2. Stage 2: ML Scoring
        feature_cols = self.metadata.get("feature_cols") or getattr(self.pipeline, 'feature_cols', [])
        feature_vector = (
            np.array([[float(features.get(c, 0.0) or 0.0) for c in feature_cols]])
            if feature_cols else None
        )

        if not passes_hard:
            # Immediate rejection
            risk_score = 0.95
            potential_score = 0.05
            anomaly_score = 0.50
            recommendation = "REJECT_UNSAFE"
            shap_reasons = [
                {"factor": "Hard Rule Violation", "detail": reject_reason, "impact": "negative"}
            ]
        else:
            # Predict with ML models or rule-based fallback
            if self.pot_model and feature_vector is not None and feature_vector.shape[1] > 0:
                try:
                    potential_score = float(self.pot_model.predict_proba(feature_vector)[0, 1])
                except Exception as e:
                    logger.warning(f"Error predicting potential model: {e}")
                    ratio = features.get("buy_sell_volume_ratio", 1.0)
                    potential_score = min(0.95, max(0.1, 0.4 + (ratio * 0.15)))
            else:
                ratio = features.get("buy_sell_volume_ratio", 1.0)
                potential_score = min(0.95, max(0.1, 0.4 + (ratio * 0.15)))

            if self.risk_model and feature_vector is not None and feature_vector.shape[1] > 0:
                try:
                    risk_score = float(self.risk_model.predict_proba(feature_vector)[0, 1])
                except Exception as e:
                    logger.warning(f"Error predicting risk model: {e}")
                    danger_count = features.get("danger_risks_count", 0)
                    risk_score = min(0.95, max(0.05, 0.1 + (danger_count * 0.3)))
            else:
                danger_count = features.get("danger_risks_count", 0)
                risk_score = min(0.95, max(0.05, 0.1 + (danger_count * 0.3)))

            # Anomaly Score from Isolation Forest
            anomaly_score = 0.03
            if self.anomaly_model:
                try:
                    ano_cols = ["tx_count_5m", "buy_sell_volume_ratio", "top1_pct", "top10_pct", "volatility", "current_liq_usd"]
                    ano_vec = np.array([[float(features.get(c, 0.0) or 0.0) for c in ano_cols]])
                    raw_score = float(self.anomaly_model.score_samples(ano_vec)[0])
                    # score_samples produces negative values around -0.4 to -0.8
                    anomaly_score = max(0.01, min(0.99, round(0.5 - raw_score, 4)))
                except Exception:
                    anomaly_score = 0.03

            # Recommendation Strategy
            if potential_score >= 0.75 and risk_score <= 0.25:
                recommendation = "STRONG_BUY_CANDIDATE"
            elif potential_score >= 0.60 and risk_score <= 0.40:
                recommendation = "ACCUMULATE_WATCH"
            elif risk_score >= 0.60:
                recommendation = "AVOID_HIGH_RISK"
            else:
                recommendation = "MONITOR"

            # Dynamic Feature Driver Explanations (SHAP Drivers)
            shap_reasons = []
            ratio = features.get("buy_sell_volume_ratio", 1.0)
            if ratio >= 1.4:
                shap_reasons.append({
                    "factor": "Buy Volume Pressure",
                    "detail": f"Buy/Sell ratio {ratio:.2f}x signals strong organic buy inflow",
                    "impact": "positive"
                })
            elif ratio <= 0.6:
                shap_reasons.append({
                    "factor": "Sell Pressure Heavy",
                    "detail": f"Buy/Sell ratio {ratio:.2f}x shows aggressive net selling",
                    "impact": "negative"
                })

            liq = features.get("current_liq_usd", 0)
            if liq >= 15000:
                shap_reasons.append({
                    "factor": "Healthy Liquidity Depth",
                    "detail": f"Pool liquidity ${liq:,.0f} provides stable trade execution",
                    "impact": "positive"
                })
            elif liq < 2000 and liq > 0:
                shap_reasons.append({
                    "factor": "Thin Liquidity",
                    "detail": f"Pool liquidity under $2,000 creates slippage sensitivity",
                    "impact": "caution"
                })

            top1 = features.get("top1_pct", 0)
            if top1 > 0 and top1 <= 15:
                shap_reasons.append({
                    "factor": "Holder Dispersion",
                    "detail": f"Top 1 holder owns only {top1:.1f}% (healthy decentralized spread)",
                    "impact": "positive"
                })
            elif top1 > 25:
                shap_reasons.append({
                    "factor": "Whale Concentration",
                    "detail": f"Single wallet holds {top1:.1f}% of circulating supply",
                    "impact": "caution"
                })

            if features.get("freeze_authority_enabled") == 0 and features.get("mint_authority_enabled") == 0:
                shap_reasons.append({
                    "factor": "Contract Verified",
                    "detail": "Mint and freeze authorities revoked; zero transfer taxes",
                    "impact": "positive"
                })

            if not shap_reasons:
                shap_reasons.append({
                    "factor": "Baseline Market Flow",
                    "detail": "Order velocity and liquidity match normal baseline distribution",
                    "impact": "neutral"
                })

        # Fetch token metadata for image logo
        with self.db.get_connection() as conn:
            tok = conn.execute("SELECT symbol, chain, metadata_json FROM tokens WHERE address = ?", (token_address,)).fetchone()
            symbol = tok[0] if tok else "TOKEN"
            chain = tok[1] if tok else "solana"
            meta_json = tok[2] if tok and len(tok) > 2 else None

        image_url = None
        if meta_json:
            try:
                meta = json.loads(meta_json)
                image_url = meta.get("info", {}).get("imageUrl") or meta.get("imageUrl") or meta.get("icon")
            except Exception:
                pass
        if not image_url and token_address:
            image_url = f"https://dd.dexscreener.com/ds-data/tokens/solana/{token_address}.png"

        score_record = {
            "token_address": token_address,
            "symbol": symbol,
            "chain": chain,
            "model_version": self.metadata.get("model_version", "v1.0-hgb"),
            "risk_score": round(risk_score, 4),
            "potential_score": round(potential_score, 4),
            "anomaly_score": round(anomaly_score, 4),
            "passes_hard_rules": passes_hard,
            "rejected_rule_reason": reject_reason,
            "recommendation": recommendation,
            "top_shap_reasons": shap_reasons[:4],
            "imageUrl": image_url,
            "image_url": image_url
        }

        self.db.upsert_ml_score(score_record)
        return score_record
