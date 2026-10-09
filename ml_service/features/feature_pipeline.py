"""Point-in-Time Feature Engineering Pipeline with strict anti-leakage enforcement."""

import math
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from ..database.db_manager import DBManager

logger = logging.getLogger(__name__)

FEATURE_VERSION = "v1.0"

class FeaturePipeline:
    """Extracts features strictly using data timestamp <= t_prediction."""

    def __init__(self, db: Optional[DBManager] = None):
        self.db = db or DBManager()

    def extract_features(
        self,
        token_address: str,
        t_prediction_iso: str,
        point_in_time_label: str = "t_5m"
    ) -> Dict[str, Any]:
        """
        Extract features strictly point-in-time.
        Any data with timestamp > t_prediction_iso is completely ignored (Anti-leakage).
        """
        features: Dict[str, Any] = {}

        # 1. Fetch Token baseline
        with self.db.get_connection() as conn:
            token_row = conn.execute(
                "SELECT * FROM tokens WHERE address = ?", (token_address,)
            ).fetchone()
            
            # Fetch snapshots strictly <= t_prediction_iso
            snaps_rows = conn.execute(
                """
                SELECT * FROM snapshots
                WHERE token_address = ? AND timestamp <= ?
                ORDER BY timestamp ASC
                """,
                (token_address, t_prediction_iso)
            ).fetchall()

            # Fetch security checks strictly <= t_prediction_iso
            sec_rows = conn.execute(
                """
                SELECT * FROM security_checks
                WHERE token_address = ? AND snapshot_time <= ?
                ORDER BY snapshot_time DESC LIMIT 1
                """,
                (token_address, t_prediction_iso)
            ).fetchall()

            # Fetch holders snapshot strictly <= t_prediction_iso
            holder_rows = conn.execute(
                """
                SELECT * FROM holders_snapshot
                WHERE token_address = ? AND fetched_at <= ?
                ORDER BY fetched_at DESC LIMIT 1
                """,
                (token_address, t_prediction_iso)
            ).fetchall()

        # Convert to dicts
        snaps = [dict(r) for r in snaps_rows]
        token = dict(token_row) if token_row else {}
        sec = dict(sec_rows[0]) if sec_rows else {}
        holder = dict(holder_rows[0]) if holder_rows else {}

        # 1. Group: Liquidity Features
        initial_liq = float(token.get("initial_liquidity_usd") or 0.0)
        features["liq_usd_initial"] = initial_liq
        features["liq_usd_initial_is_missing"] = 1 if initial_liq == 0 else 0

        latest_snap = snaps[-1] if snaps else {}
        current_liq = float(latest_snap.get("liquidity_usd") or initial_liq)
        features["current_liq_usd"] = current_liq
        
        if initial_liq > 0:
            features["liq_change_pct"] = ((current_liq - initial_liq) / initial_liq) * 100.0
        else:
            features["liq_change_pct"] = 0.0

        # 2. Group: Transaction & Price Momentum Features
        initial_price = float(token.get("initial_price_usd") or 0.0)
        current_price = float(latest_snap.get("price_usd") or initial_price)
        
        features["initial_price_usd"] = initial_price
        features["current_price_usd"] = current_price
        
        if initial_price > 0:
            features["price_change_5m_pct"] = ((current_price - initial_price) / initial_price) * 100.0
        else:
            features["price_change_5m_pct"] = 0.0

        buys_m5 = int(latest_snap.get("buys_m5") or 0)
        sells_m5 = int(latest_snap.get("sells_m5") or 0)
        features["buys_m5"] = buys_m5
        features["sells_m5"] = sells_m5
        features["tx_count_5m"] = buys_m5 + sells_m5

        if sells_m5 > 0:
            features["buy_sell_ratio"] = float(buys_m5) / float(sells_m5)
        else:
            features["buy_sell_ratio"] = float(buys_m5) if buys_m5 > 0 else 1.0

        # 3. Group: Security Features (Point-in-Time)
        features["is_mintable"] = 1 if sec.get("is_mintable") else 0
        features["is_renounced"] = 1 if sec.get("is_renounced") else 0
        features["buy_tax"] = float(sec.get("buy_tax") or 0.0)
        features["sell_tax"] = float(sec.get("sell_tax") or 0.0)
        features["mint_authority_enabled"] = 1 if sec.get("mint_authority_enabled") else 0
        features["freeze_authority_enabled"] = 1 if sec.get("freeze_authority_enabled") else 0
        features["danger_risks_count"] = int(sec.get("danger_risks_count") or 0)
        features["rugcheck_score"] = float(sec.get("score") or 0.0)
        features["security_is_missing"] = 1 if not sec else 0

        # 4. Group: Holder Concentration Features
        features["top1_pct"] = float(holder.get("top1_pct") or 0.0)
        features["top10_pct"] = float(holder.get("top10_pct") or 0.0)
        features["holder_is_missing"] = 1 if not holder else 0

        # 5. Group: Time & Calendar Features
        t_dt = datetime.fromisoformat(t_prediction_iso.replace("Z", "+00:00"))
        features["hour_utc"] = t_dt.hour
        features["day_of_week"] = t_dt.weekday()

        # Save to features table
        self.db.upsert_features({
            "token_address": token_address,
            "feature_version": FEATURE_VERSION,
            "point_in_time": point_in_time_label,
            "features": features
        })

        return features
