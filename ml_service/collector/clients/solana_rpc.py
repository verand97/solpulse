"""Solana JSON-RPC client for on-chain holder and supply verification."""

import time
import logging
from typing import Optional, Dict, Any, List
import requests

logger = logging.getLogger(__name__)

class SolanaRPCClient:
    def __init__(self, rpc_url: str = "https://api.mainnet-beta.solana.com", delay_seconds: float = 0.5):
        self.rpc_url = rpc_url
        self.delay_seconds = delay_seconds
        self.last_call_time = 0.0
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})

    def _throttle(self):
        elapsed = time.time() - self.last_call_time
        if elapsed < self.delay_seconds:
            time.sleep(self.delay_seconds - elapsed)
        self.last_call_time = time.time()

    def _call(self, method: str, params: list, max_retries: int = 3) -> Optional[Any]:
        self._throttle()
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": method,
            "params": params
        }
        backoff = 1.0

        for attempt in range(max_retries):
            try:
                resp = self.session.post(self.rpc_url, json=payload, timeout=12)
                if resp.status_code == 200:
                    data = resp.json()
                    if "result" in data:
                        return data["result"]
                    elif "error" in data:
                        logger.warning(f"Solana RPC error ({method}): {data['error']}")
                        return None
                elif resp.status_code == 429:
                    logger.warning(f"Solana RPC 429 rate limit. Waiting {backoff}s...")
                    time.sleep(backoff)
                    backoff *= 2.0
            except Exception as e:
                logger.error(f"Solana RPC exception ({method}): {e}")
                time.sleep(backoff)
                backoff *= 1.5

        return None

    def get_token_supply(self, mint_address: str) -> Optional[Dict[str, Any]]:
        """Get total token supply."""
        res = self._call("getTokenSupply", [mint_address])
        if res and "value" in res:
            return res["value"]
        return None

    def get_token_largest_accounts(self, mint_address: str) -> List[Dict[str, Any]]:
        """Get top 20 token accounts by balance."""
        res = self._call("getTokenLargestAccounts", [mint_address])
        if res and "value" in res:
            return res["value"]
        return []

    def get_holder_concentration(self, mint_address: str) -> Dict[str, float]:
        """Calculate top1 and top10 percentage from largest accounts."""
        supply_info = self.get_token_supply(mint_address)
        largest = self.get_token_largest_accounts(mint_address)

        if not supply_info or not largest:
            return {"top1_pct": 0.0, "top10_pct": 0.0, "total_supply": 0.0}

        try:
            total_supply = float(supply_info.get("uiAmount") or 0.0)
            if total_supply <= 0:
                return {"top1_pct": 0.0, "top10_pct": 0.0, "total_supply": 0.0}

            top1_amount = float(largest[0].get("uiAmount") or 0.0) if len(largest) > 0 else 0.0
            top10_amount = sum(float(acc.get("uiAmount") or 0.0) for acc in largest[:10])

            top1_pct = (top1_amount / total_supply) * 100.0
            top10_pct = (top10_amount / total_supply) * 100.0

            return {
                "top1_pct": round(top1_pct, 2),
                "top10_pct": round(top10_pct, 2),
                "total_supply": total_supply
            }
        except Exception as e:
            logger.error(f"Error computing holder concentration for {mint_address}: {e}")
            return {"top1_pct": 0.0, "top10_pct": 0.0, "total_supply": 0.0}
