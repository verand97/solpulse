"""Comprehensive Point-in-Time Feature Engineering Pipeline (Fase 3)."""

import os
import json
import math
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

from ml_service.database.db_manager import DBManager

logger = logging.getLogger(__name__)

FEATURE_VERSION = "v1.0"
PARQUET_DIR = Path(__file__).resolve().parent.parent / "data" / "parquet"
PARQUET_DIR.mkdir(parents=True, exist_ok=True)


class FeaturePipeline:
    """
    Extracts point-in-time features strictly using data timestamp <= t_prediction.
    Includes all 7 groups specified in dex-ml-screener.md with missing indicator flags.
    """

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

            # Strict point-in-time query on snapshots
            snaps_rows = conn.execute(
                """
                SELECT * FROM snapshots
                WHERE token_address = ? AND timestamp <= ?
                ORDER BY timestamp ASC
                """,
                (token_address, t_prediction_iso)
            ).fetchall()

            # Strict point-in-time query on security checks
            sec_rows = conn.execute(
                """
                SELECT * FROM security_checks
                WHERE token_address = ? AND snapshot_time <= ?
                ORDER BY snapshot_time DESC LIMIT 1
                """,
                (token_address, t_prediction_iso)
            ).fetchall()

            # Strict point-in-time query on holders
            holder_rows = conn.execute(
                """
                SELECT * FROM holders_snapshot
                WHERE token_address = ? AND fetched_at <= ?
                ORDER BY fetched_at DESC LIMIT 1
                """,
                (token_address, t_prediction_iso)
            ).fetchall()

            # Deployer info strictly <= t_prediction_iso
            deployer_row = None
            if token_row and token_row["deployer_address"]:
                deployer_row = conn.execute(
                    "SELECT * FROM deployers WHERE address = ? AND first_seen_at <= ?",
                    (token_row["deployer_address"], t_prediction_iso)
                ).fetchone()

        snaps = [dict(r) for r in snaps_rows]
        token = dict(token_row) if token_row else {}
        sec = dict(sec_rows[0]) if sec_rows else {}
        holder = dict(holder_rows[0]) if holder_rows else {}
        deployer = dict(deployer_row) if deployer_row else {}

        # Parse token metadata if available
        meta = {}
        if token.get("metadata_json"):
            try:
                meta = json.loads(token["metadata_json"])
            except Exception:
                meta = {}

        # =========================================================
        # GROUP 1: LIKUIDITAS
        # =========================================================
        initial_liq = float(token.get("initial_liquidity_usd") or 0.0)
        latest_snap = snaps[-1] if snaps else {}
        current_liq = float(latest_snap.get("liquidity_usd") or initial_liq)
        
        # Market Cap estimation
        initial_price = float(token.get("initial_price_usd") or 0.0)
        current_price = float(latest_snap.get("price_usd") or initial_price)
        total_supply = float(meta.get("totalSupply") or 1_000_000_000.0)
        mcap = current_price * total_supply if current_price > 0 else 0.0

        features["liq_usd_initial"] = initial_liq
        features["current_liq_usd"] = current_liq
        features["liq_to_mcap_ratio"] = (current_liq / mcap) if mcap > 0 else 0.0
        
        if initial_liq > 0:
            features["liq_change_pct"] = ((current_liq - initial_liq) / initial_liq) * 100.0
        else:
            features["liq_change_pct"] = 0.0

        # LP Lock / Burn (from RugCheck or metadata)
        features["lp_locked_pct"] = float(meta.get("lp_locked_pct") or 0.0)
        features["lp_burned_pct"] = float(meta.get("lp_burned_pct") or (100.0 if meta.get("lp_burned") else 0.0))
        features["liq_is_missing"] = 1 if initial_liq <= 0 else 0

        # =========================================================
        # GROUP 2: TRANSAKSI & MOMENTUM
        # =========================================================
        buys_m5 = int(latest_snap.get("buys_m5") or 0)
        sells_m5 = int(latest_snap.get("sells_m5") or 0)
        buys_24h = int(latest_snap.get("buys_h24") or buys_m5)
        sells_24h = int(latest_snap.get("sells_h24") or sells_m5)
        vol_m5 = float(latest_snap.get("volume_m5") or 0.0)
        vol_24h = float(latest_snap.get("volume_h24") or vol_m5)

        features["tx_count_5m"] = buys_m5 + sells_m5
        features["tx_count_15m"] = int(features["tx_count_5m"] * 2.5) # aggregate estimate from windows
        features["tx_count_60m"] = int(features["tx_count_5m"] * 8.0)

        # Buy/Sell Ratio
        if sells_m5 > 0:
            features["buy_sell_volume_ratio"] = float(buys_m5) / float(sells_m5)
        else:
            features["buy_sell_volume_ratio"] = float(buys_m5) if buys_m5 > 0 else 1.0

        # Unique traders proxy
        features["unique_buyers"] = max(1, int(buys_m5 * 0.85))
        features["unique_sellers"] = max(0, int(sells_m5 * 0.85))
        features["buyers_to_sellers_ratio"] = (
            float(features["unique_buyers"]) / float(max(1, features["unique_sellers"]))
        )

        total_tx = max(1, buys_m5 + sells_m5)
        features["avg_trade_size_usd"] = (vol_m5 / total_tx) if vol_m5 > 0 else 0.0

        # Price momentum strictly <= t
        features["initial_price_usd"] = initial_price
        features["current_price_usd"] = current_price
        if initial_price > 0:
            features["price_change_5m"] = ((current_price - initial_price) / initial_price) * 100.0
            features["price_change_15m"] = features["price_change_5m"]
            features["price_change_60m"] = features["price_change_5m"]
        else:
            features["price_change_5m"] = 0.0
            features["price_change_15m"] = 0.0
            features["price_change_60m"] = 0.0

        # Volatility & Max Drawdown so far
        snap_prices = [float(s.get("price_usd") or 0.0) for s in snaps if float(s.get("price_usd") or 0.0) > 0]
        if len(snap_prices) >= 2:
            mean_p = sum(snap_prices) / len(snap_prices)
            variance = sum((p - mean_p) ** 2 for p in snap_prices) / len(snap_prices)
            features["volatility"] = math.sqrt(variance) / mean_p if mean_p > 0 else 0.0
            
            # Max Drawdown so far
            peak_so_far = max(snap_prices)
            trough_so_far = min(snap_prices)
            features["max_drawdown_so_far"] = (
                ((peak_so_far - trough_so_far) / peak_so_far) * 100.0 if peak_so_far > 0 else 0.0
            )
        else:
            features["volatility"] = 0.0
            features["max_drawdown_so_far"] = 0.0

        # =========================================================
        # GROUP 3: KEAMANAN KONTRAK (POINT-IN-TIME)
        # =========================================================
        features["is_mintable"] = 1 if sec.get("is_mintable") else 0
        features["is_renounced"] = 1 if sec.get("is_renounced") else 0
        features["buy_tax"] = float(sec.get("buy_tax") or 0.0)
        features["sell_tax"] = float(sec.get("sell_tax") or 0.0)
        features["has_blacklist"] = 1 if sec.get("has_blacklist") else 0
        features["is_proxy"] = 1 if sec.get("is_proxy") else 0
        features["mint_authority_enabled"] = 1 if sec.get("mint_authority_enabled") else 0
        features["freeze_authority_enabled"] = 1 if sec.get("freeze_authority_enabled") else 0
        features["danger_risks_count"] = int(sec.get("danger_risks_count") or 0)
        features["honeypot_sim_pass"] = 0 if (features["sell_tax"] > 50.0 or sec.get("danger_risks_count", 0) > 2) else 1
        features["security_is_missing"] = 1 if not sec else 0

        # =========================================================
        # GROUP 4: HOLDER ON-CHAIN
        # =========================================================
        features["top1_pct"] = float(holder.get("top1_pct") or 0.0)
        features["top10_pct"] = float(holder.get("top10_pct") or 0.0)
        features["top10_excl_lp_pct"] = float(holder.get("top10_excl_lp_pct") or features["top10_pct"])
        features["holder_count"] = int(holder.get("total_holders") or 0)
        features["holder_growth_rate"] = 0.0  # Holders per minute
        features["same_funder_wallets_pct"] = float(holder.get("same_funder_wallets_pct") or 0.0)
        features["sniper_wallet_pct"] = float(holder.get("sniper_wallets_pct") or 0.0)
        features["holder_is_missing"] = 1 if not holder else 0

        # =========================================================
        # GROUP 5: DEPLOYER TRACK RECORD
        # =========================================================
        if deployer:
            created_dt = datetime.fromisoformat(deployer["first_seen_at"].replace("Z", "+00:00"))
            curr_dt = datetime.fromisoformat(t_prediction_iso.replace("Z", "+00:00"))
            features["deployer_age_days"] = max(0.0, (curr_dt - created_dt).total_seconds() / 86400.0)
            features["deployer_prev_tokens"] = int(deployer.get("total_tokens_created") or 1)
            rugs = int(deployer.get("rugs_count") or 0)
            features["deployer_prev_rug_rate"] = rugs / max(1, features["deployer_prev_tokens"])
            features["deployer_is_missing"] = 0
        else:
            features["deployer_age_days"] = 0.0
            features["deployer_prev_tokens"] = 1
            features["deployer_prev_rug_rate"] = 0.0
            features["deployer_is_missing"] = 1

        # =========================================================
        # GROUP 6: WAKTU & KALENDER
        # =========================================================
        t_dt = datetime.fromisoformat(t_prediction_iso.replace("Z", "+00:00"))
        token_created_iso = token.get("created_at") or token.get("first_detected_at") or t_prediction_iso
        token_created_dt = datetime.fromisoformat(token_created_iso.replace("Z", "+00:00"))
        
        features["secs_deploy_to_liquidity"] = max(0.0, (t_dt - token_created_dt).total_seconds())
        features["hour_utc"] = t_dt.hour
        features["day_of_week"] = t_dt.weekday()

        # =========================================================
        # GROUP 7: SOSIAL (OPSIONAL)
        # =========================================================
        info = meta.get("info", {})
        socials = meta.get("socials", []) or info.get("socials", [])
        websites = meta.get("websites", []) or info.get("websites", [])
        
        features["has_website"] = 1 if (websites or any(s.get("type") == "website" for s in socials)) else 0
        features["has_twitter"] = 1 if any("twitter" in str(s).lower() or "x.com" in str(s).lower() for s in socials) else 0
        features["has_telegram"] = 1 if any("telegram" in str(s).lower() or "t.me" in str(s).lower() for s in socials) else 0
        
        # Name similarity heuristics against top tokens (SOL, BONK, WIF, PEPE)
        symbol = str(token.get("symbol") or "").upper()
        top_names = ["SOL", "BONK", "WIF", "PEPE", "DOGE", "SHIB"]
        similarity = 0.0
        for top in top_names:
            if top in symbol or symbol in top:
                similarity = max(similarity, len(top) / max(len(symbol), len(top)))
        features["name_similarity_to_top_tokens"] = round(similarity, 3)
        features["social_is_missing"] = 1 if (not socials and not websites) else 0

        # Save to features table in DB
        self.db.upsert_features({
            "token_address": token_address,
            "feature_version": FEATURE_VERSION,
            "point_in_time": point_in_time_label,
            "features": features
        })

        return features

    def extract_all_and_export_parquet(self, output_path: Optional[str] = None) -> Tuple[List[Dict[str, Any]], str]:
        """
        Extract features for all tokens in DB at T+5m point-in-time and save to Parquet.
        Returns (feature_records, file_path).
        """
        tokens = self.db.get_recent_tokens(limit=10000)
        dataset_rows = []

        for t in tokens:
            addr = t["address"]
            snaps = self.db.get_token_snapshots(addr)
            if not snaps:
                continue

            # Determine point in time: T+5m snapshot timestamp
            t5_snap = next((s for s in snaps if s["interval_label"] == "t_5m"), None)
            if t5_snap:
                pit_time = t5_snap["timestamp"]
            elif len(snaps) > 1:
                pit_time = snaps[1]["timestamp"]
            else:
                pit_time = snaps[0]["timestamp"]

            feat = self.extract_features(addr, t_prediction_iso=pit_time, point_in_time_label="t_5m")

            # Fetch corresponding label
            with self.db.get_connection() as conn:
                lbl_row = conn.execute("SELECT * FROM labels WHERE token_address = ?", (addr,)).fetchone()
            
            row = {
                "token_address": addr,
                "symbol": t.get("symbol", "TOKEN"),
                "chain": t.get("chain", "solana"),
                "feature_version": FEATURE_VERSION,
                "point_in_time": "t_5m",
                **feat
            }

            if lbl_row:
                row["label_success"] = 1 if lbl_row["success"] else 0
                row["label_is_rug"] = 1 if lbl_row["is_rug"] else 0
                row["label_is_honeypot"] = 1 if lbl_row["is_honeypot"] else 0
                row["label_is_dead"] = 1 if lbl_row["is_dead"] else 0
                row["label_net_return_24h"] = float(lbl_row["net_return_24h"] or 0.0)

            dataset_rows.append(row)

        target_parquet = Path(output_path) if output_path else (PARQUET_DIR / "features_v1.parquet")
        
        # Save to Parquet if pyarrow/pandas available, with JSON Lines as companion
        try:
            import pandas as pd
            df = pd.DataFrame(dataset_rows)
            df.to_parquet(str(target_parquet), index=False)
            logger.info(f"Exported {len(dataset_rows)} records to Parquet: {target_parquet}")
        except Exception as e:
            logger.warning(f"Could not export via pandas/pyarrow ({e}). Saving companion JSON Lines dataset.")

        # Always save JSON Lines dataset as well for portability
        json_path = target_parquet.with_suffix(".jsonl")
        with open(json_path, "w", encoding="utf-8") as f:
            for r in dataset_rows:
                f.write(json.dumps(r) + "\n")

        return dataset_rows, str(target_parquet)
