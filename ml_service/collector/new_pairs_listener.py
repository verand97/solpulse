"""New Pairs Listener (Jalur A): Real-time forward collector for Solana tokens."""

import time
import json
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from ..database.db_manager import DBManager
from .clients.dexscreener import DexScreenerClient
from .clients.geckoterminal import GeckoTerminalClient
from .clients.rugcheck import RugCheckClient
from .clients.solana_rpc import SolanaRPCClient
from .snapshot_scheduler import SnapshotScheduler

logger = logging.getLogger(__name__)

class NewPairsListener:
    def __init__(self, db: Optional[DBManager] = None, poll_interval: int = 30):
        self.db = db or DBManager()
        self.poll_interval = poll_interval
        self.dex_client = DexScreenerClient()
        self.gecko_client = GeckoTerminalClient()
        self.rug_client = RugCheckClient()
        self.rpc_client = SolanaRPCClient()
        self.scheduler = SnapshotScheduler(self.db)
        self.is_running = False

    def process_new_token(
        self,
        token_address: str,
        symbol: Optional[str] = None,
        name: Optional[str] = None,
        pair_address: Optional[str] = None,
        initial_price: Optional[float] = None,
        initial_liquidity: Optional[float] = None,
        source: str = "dexscreener",
        raw_data: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Process, deduplicate, store, and schedule forward tracking for a token."""
        if not token_address:
            return False

        # Deduplication check
        if self.db.token_exists(token_address):
            return False

        now_utc = datetime.now(timezone.utc)
        logger.info(f"✨ [NEW TOKEN DETECTED] {symbol or 'UNKNOWN'} ({token_address}) on Solana via {source}")

        # 1. Save raw response
        raw_res_id = None
        if raw_data:
            raw_res_id = self.db.record_raw_response(
                endpoint=f"collector/new_token/{source}",
                response_body=json.dumps(raw_data),
                query_params=f"address={token_address}"
            )

        # 2. Insert Token Record
        self.db.upsert_token({
            "address": token_address,
            "symbol": symbol,
            "name": name,
            "chain": "solana",
            "decimals": 9,
            "first_detected_at": now_utc.isoformat(),
            "initial_liquidity_usd": initial_liquidity,
            "initial_price_usd": initial_price,
            "metadata": raw_data or {}
        })

        # 3. Insert Pair Record
        if pair_address:
            self.db.upsert_pair({
                "token_address": token_address,
                "pair_address": pair_address,
                "chain": "solana",
                "dex_id": "raydium",
                "base_token": token_address,
                "quote_token": "So11111111111111111111111111111111111111112"
            })

        # 4. Immediate T+0 Snapshot
        self.db.add_snapshot({
            "token_address": token_address,
            "pair_address": pair_address,
            "interval_label": "t_0",
            "timestamp": now_utc.isoformat(),
            "price_usd": initial_price or 0.0,
            "liquidity_usd": initial_liquidity or 0.0,
            "volume_h24": 0.0,
            "volume_m5": 0.0,
            "buys_h24": 0,
            "sells_h24": 0,
            "buys_m5": 0,
            "sells_m5": 0,
            "tx_count": 0,
            "raw_response_id": raw_res_id
        })

        # 5. Initial Point-in-time Security Audit
        try:
            rc_summary = self.rug_client.get_token_report_summary(token_address)
            if rc_summary:
                dangers = [r for r in rc_summary.get("risks", []) if r.get("level") == "danger"]
                self.db.add_security_check({
                    "token_address": token_address,
                    "chain": "solana",
                    "snapshot_time": now_utc.isoformat(),
                    "source": "rugcheck",
                    "danger_risks_count": len(dangers),
                    "score": rc_summary.get("score", 0.0),
                    "is_mintable": any("mint" in str(r.get("name", "")).lower() for r in dangers),
                    "is_renounced": not any("mint" in str(r.get("name", "")).lower() for r in dangers),
                    "raw_response_id": raw_res_id
                })
        except Exception as e:
            logger.warning(f"Could not perform initial RugCheck for {token_address}: {e}")

        # 6. Initial Holders Concentration via Solana RPC
        try:
            holders_info = self.rpc_client.get_holder_concentration(token_address)
            self.db.add_holder_snapshot({
                "token_address": token_address,
                "top1_pct": holders_info.get("top1_pct", 0.0),
                "top10_pct": holders_info.get("top10_pct", 0.0),
                "raw_response_id": raw_res_id
            })
        except Exception as e:
            logger.warning(f"Could not perform initial RPC holder audit for {token_address}: {e}")

        # 7. Schedule forward snapshots at T+1m, 5m, 15m, 30m, 60m, 6h, 24h
        self.scheduler.schedule_token_snapshots(token_address, pair_address)
        return True

    def poll_dexscreener(self) -> int:
        """Poll DexScreener token profiles for new Solana tokens."""
        new_count = 0
        try:
            profiles = self.dex_client.get_latest_token_profiles()
            for prof in profiles:
                if prof.get("chainId") != "solana":
                    continue
                address = prof.get("tokenAddress")
                if not address or self.db.token_exists(address):
                    continue

                # Fetch detailed pairs to get liquidity & price
                pairs = self.dex_client.get_token_pairs(address)
                sol_pairs = [p for p in pairs if p.get("chainId") == "solana"]
                if not sol_pairs:
                    continue

                best = max(sol_pairs, key=lambda x: x.get("liquidity", {}).get("usd", 0.0))
                price = float(best.get("priceUsd") or 0.0)
                liq = float(best.get("liquidity", {}).get("usd") or 0.0)

                success = self.process_new_token(
                    token_address=address,
                    symbol=best.get("baseToken", {}).get("symbol", prof.get("description", "NEW")[:10]),
                    name=best.get("baseToken", {}).get("name", "Solana Token"),
                    pair_address=best.get("pairAddress"),
                    initial_price=price,
                    initial_liquidity=liq,
                    source="dexscreener_profiles",
                    raw_data=best
                )
                if success:
                    new_count += 1
        except Exception as e:
            logger.error(f"Error polling DexScreener: {e}")
        return new_count

    def poll_geckoterminal(self) -> int:
        """Poll GeckoTerminal new pools on Solana."""
        new_count = 0
        try:
            pools = self.gecko_client.get_new_pools(network="solana", page=1)
            for p in pools:
                attrs = p.get("attributes", {})
                pair_address = attrs.get("address")
                relationships = p.get("relationships", {})
                base_token_id = relationships.get("base_token", {}).get("data", {}).get("id", "")
                
                # Format: solana_<token_address>
                token_address = base_token_id.replace("solana_", "") if "solana_" in base_token_id else None
                if not token_address or self.db.token_exists(token_address):
                    continue

                liq = float(attrs.get("reserve_in_usd") or 0.0)
                price = float(attrs.get("base_token_price_usd") or 0.0)
                name = attrs.get("name", "Solana Pool")

                success = self.process_new_token(
                    token_address=token_address,
                    symbol=name.split("/")[0].strip() if "/" in name else "NEW",
                    name=name,
                    pair_address=pair_address,
                    initial_price=price,
                    initial_liquidity=liq,
                    source="geckoterminal_new_pools",
                    raw_data=p
                )
                if success:
                    new_count += 1
        except Exception as e:
            logger.error(f"Error polling GeckoTerminal: {e}")
        return new_count

    def run_once(self) -> int:
        """Run a single polling cycle across all sources."""
        c1 = self.poll_dexscreener()
        c2 = self.poll_geckoterminal()
        return c1 + c2

    def run_forever(self):
        """Continuous execution loop (Jalur A)."""
        self.is_running = True
        logger.info(f"🚀 SolPulse Forward Collector (Jalur A) started. Polling every {self.poll_interval}s...")
        try:
            while self.is_running:
                found = self.run_once()
                if found > 0:
                    logger.info(f"Discovered and scheduled {found} new token(s).")
                time.sleep(self.poll_interval)
        except KeyboardInterrupt:
            logger.info("Collector stopped by user.")
        finally:
            self.stop()

    def stop(self):
        self.is_running = False
        self.scheduler.shutdown()
