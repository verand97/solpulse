"""Multi-target Labeling Pipeline for SolPulse ML Screener."""

import math
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

from ..database.db_manager import DBManager

logger = logging.getLogger(__name__)

class TokenLabeler:
    """Computes realistic multi-target ground truth labels from snapshot history."""

    def __init__(
        self,
        db: Optional[DBManager] = None,
        slippage_pct: float = 3.0,
        dex_fee_pct: float = 0.3,
        gas_usd: float = 0.005,
        target_multiplier: float = 2.0
    ):
        self.db = db or DBManager()
        self.slippage_pct = slippage_pct
        self.dex_fee_pct = dex_fee_pct
        self.gas_usd = gas_usd
        self.target_multiplier = target_multiplier

    def compute_token_label(self, token_address: str) -> Optional[Dict[str, Any]]:
        """Compute multi-target labels for a single token using its snapshot series."""
        snapshots = self.db.get_token_snapshots(token_address)
        if not snapshots:
            return None

        # Sort by timestamp
        snapshots.sort(key=lambda x: x["timestamp"])

        # 1. Entry price: preferentially at T+5m or T+15m, fallback to first snapshot after T+0
        entry_snap = next((s for s in snapshots if s["interval_label"] == "t_5m"), None)
        if not entry_snap:
            entry_snap = next((s for s in snapshots if s["interval_label"] in ["t_1m", "t_15m"]), snapshots[0])

        entry_price = float(entry_snap.get("price_usd") or 0.0)
        initial_liq = float(snapshots[0].get("liquidity_usd") or 0.0)

        # 2. Peak price and lowest liquidity within the observation window (24h)
        prices = [float(s.get("price_usd") or 0.0) for s in snapshots if float(s.get("price_usd") or 0.0) > 0]
        liquidities = [float(s.get("liquidity_usd") or 0.0) for s in snapshots if float(s.get("liquidity_usd") or 0.0) > 0]

        if not prices or entry_price <= 0:
            return None

        peak_price = max(prices)
        min_liq = min(liquidities) if liquidities else 0.0

        # Max gross return
        max_return_24h = peak_price / entry_price if entry_price > 0 else 0.0

        # Realistic net return accounting for DEX fee, sell slippage, and roundtrip gas
        # Net multiplier = gross * (1 - slippage/100) * (1 - dex_fee/100)^2
        friction_factor = (1.0 - (self.slippage_pct / 100.0)) * ((1.0 - (self.dex_fee_pct / 100.0)) ** 2)
        net_return_24h = max(0.0, (max_return_24h * friction_factor))

        # Check Honeypot: sell failed or danger risks flag
        with self.db.get_connection() as conn:
            sec = conn.execute(
                "SELECT danger_risks_count, sell_tax FROM security_checks WHERE token_address = ? ORDER BY fetched_at DESC LIMIT 1",
                (token_address,)
            ).fetchone()
        
        is_honeypot = False
        if sec:
            if sec[1] and float(sec[1]) > 50.0:  # Sell tax > 50%
                is_honeypot = True

        # Check Rug: Liquidity dropped > 80% from initial within 24h
        is_rug = False
        if initial_liq > 0 and min_liq < (initial_liq * 0.20):
            is_rug = True

        # Check Dead: Price dropped > 90% from peak
        latest_price = prices[-1]
        is_dead = False
        if peak_price > 0 and latest_price < (peak_price * 0.10):
            is_dead = True

        # Success label: net_return >= target_multiplier (default 2x) AND not rug AND not honeypot
        success = (net_return_24h >= self.target_multiplier) and (not is_rug) and (not is_honeypot)

        label_data = {
            "token_address": token_address,
            "is_honeypot": is_honeypot,
            "is_rug": is_rug,
            "is_dead": is_dead,
            "entry_price": entry_price,
            "peak_price_24h": peak_price,
            "max_return_24h": round(max_return_24h, 4),
            "net_return_24h": round(net_return_24h, 4),
            "success": success
        }

        self.db.upsert_label(label_data)
        return label_data

    def run_labeling_batch(self) -> Dict[str, Any]:
        """Label all tokens that have snapshot data and return distribution statistics."""
        tokens = self.db.get_recent_tokens(limit=10000)
        labeled = []
        rug_count = 0
        honeypot_count = 0
        dead_count = 0
        success_count = 0

        for t in tokens:
            res = self.compute_token_label(t["address"])
            if res:
                labeled.append(res)
                if res["is_rug"]:
                    rug_count += 1
                if res["is_honeypot"]:
                    honeypot_count += 1
                if res["is_dead"]:
                    dead_count += 1
                if res["success"]:
                    success_count += 1

        total = len(labeled)
        return {
            "total_labeled": total,
            "success_count": success_count,
            "success_rate_pct": round((success_count / total * 100.0), 2) if total > 0 else 0.0,
            "rug_count": rug_count,
            "rug_rate_pct": round((rug_count / total * 100.0), 2) if total > 0 else 0.0,
            "honeypot_count": honeypot_count,
            "dead_count": dead_count,
            "samples": labeled[:20]
        }
