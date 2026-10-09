"""Snapshot Scheduler (Jalur A): Serial point-in-time snapshots for tracked tokens."""

import time
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.date import DateTrigger

from ..database.db_manager import DBManager
from .clients.dexscreener import DexScreenerClient
from .clients.rugcheck import RugCheckClient
from .clients.solana_rpc import SolanaRPCClient

logger = logging.getLogger(__name__)

# Standard snapshot intervals in seconds from initial detection
INTERVALS = {
    "t_1m": 60,
    "t_5m": 300,
    "t_15m": 900,
    "t_30m": 1800,
    "t_60m": 3600,
    "t_6h": 21600,
    "t_24h": 86400
}

class SnapshotScheduler:
    def __init__(self, db: Optional[DBManager] = None):
        self.db = db or DBManager()
        self.dex_client = DexScreenerClient()
        self.rug_client = RugCheckClient()
        self.rpc_client = SolanaRPCClient()
        self.scheduler = BackgroundScheduler()
        self.scheduler.start()

    def schedule_token_snapshots(self, token_address: str, pair_address: Optional[str] = None):
        """Schedule future point-in-time snapshots for a newly detected token."""
        now = time.time()
        for label, delay_seconds in INTERVALS.items():
            run_time = datetime.fromtimestamp(now + delay_seconds, tz=timezone.utc)
            job_id = f"snap_{token_address}_{label}"
            
            try:
                self.scheduler.add_job(
                    self.execute_snapshot,
                    trigger=DateTrigger(run_date=run_time),
                    args=[token_address, pair_address, label],
                    id=job_id,
                    replace_existing=True
                )
                logger.info(f"Scheduled {label} snapshot for {token_address} at {run_time.isoformat()}")
            except Exception as e:
                logger.error(f"Failed to schedule {label} for {token_address}: {e}")

    def execute_snapshot(self, token_address: str, pair_address: Optional[str], interval_label: str):
        """Execute a point-in-time snapshot and store all metrics."""
        logger.info(f"Executing {interval_label} snapshot for {token_address}")
        fetched_at = datetime.now(timezone.utc)
        
        # 1. Fetch pair & liquidity metrics from DexScreener
        pairs = self.dex_client.get_token_pairs(token_address)
        best_pair = None
        raw_res_id = None
        
        if pairs:
            # Save raw response
            raw_res_id = self.db.record_raw_response(
                endpoint=f"latest/dex/tokens/{token_address}",
                response_body=json.dumps(pairs[:3]),
                query_params=f"interval={interval_label}"
            )
            # Find matching or highest liquidity Solana pair
            sol_pairs = [p for p in pairs if p.get("chainId") == "solana"]
            if sol_pairs:
                best_pair = max(sol_pairs, key=lambda x: x.get("liquidity", {}).get("usd", 0.0))
            else:
                best_pair = pairs[0]

        if best_pair:
            price_usd = float(best_pair.get("priceUsd") or 0.0)
            liquidity_usd = float(best_pair.get("liquidity", {}).get("usd") or 0.0)
            vol_24h = float(best_pair.get("volume", {}).get("h24") or 0.0)
            vol_m5 = float(best_pair.get("volume", {}).get("m5") or 0.0)
            txns = best_pair.get("txns", {})
            buys_24h = int(txns.get("h24", {}).get("buys") or 0)
            sells_24h = int(txns.get("h24", {}).get("sells") or 0)
            buys_m5 = int(txns.get("m5", {}).get("buys") or 0)
            sells_m5 = int(txns.get("m5", {}).get("sells") or 0)
            tx_count = buys_24h + sells_24h

            self.db.add_snapshot({
                "token_address": token_address,
                "pair_address": best_pair.get("pairAddress") or pair_address,
                "interval_label": interval_label,
                "timestamp": fetched_at.isoformat(),
                "price_usd": price_usd,
                "liquidity_usd": liquidity_usd,
                "volume_h24": vol_24h,
                "volume_m5": vol_m5,
                "buys_h24": buys_24h,
                "sells_h24": sells_24h,
                "buys_m5": buys_m5,
                "sells_m5": sells_m5,
                "tx_count": tx_count,
                "raw_response_id": raw_res_id
            })

        # 2. At key intervals (e.g. t_5m, t_60m, t_24h), also capture holder & security status
        if interval_label in ["t_5m", "t_60m", "t_24h"]:
            try:
                # Holders concentration via Solana RPC
                holder_metrics = self.rpc_client.get_holder_concentration(token_address)
                self.db.add_holder_snapshot({
                    "token_address": token_address,
                    "total_holders": 0,
                    "top1_pct": holder_metrics.get("top1_pct", 0.0),
                    "top10_pct": holder_metrics.get("top10_pct", 0.0),
                    "top10_excl_lp_pct": holder_metrics.get("top10_pct", 0.0),
                    "same_funder_wallets_pct": 0.0,
                    "sniper_wallets_pct": 0.0,
                    "raw_response_id": raw_res_id
                })
            except Exception as e:
                logger.error(f"Error fetching RPC holder concentration for {token_address}: {e}")

            try:
                # Security status via RugCheck
                rc_report = self.rug_client.get_token_report_summary(token_address)
                if rc_report:
                    dangers = [r for r in rc_report.get("risks", []) if r.get("level") == "danger"]
                    self.db.add_security_check({
                        "token_address": token_address,
                        "chain": "solana",
                        "snapshot_time": fetched_at.isoformat(),
                        "source": "rugcheck",
                        "danger_risks_count": len(dangers),
                        "score": rc_report.get("score", 0.0),
                        "is_mintable": any("mint" in str(r.get("name", "")).lower() for r in dangers),
                        "is_renounced": not any("mint" in str(r.get("name", "")).lower() for r in dangers),
                        "raw_response_id": raw_res_id
                    })
            except Exception as e:
                logger.error(f"Error checking RugCheck for {token_address}: {e}")

    def shutdown(self):
        self.scheduler.shutdown(wait=False)
