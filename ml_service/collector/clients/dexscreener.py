"""DexScreener API client with rate-limiting, backoff, and raw response recording."""

import time
import logging
from typing import Optional, Dict, Any, List
import requests

logger = logging.getLogger(__name__)

class DexScreenerClient:
    def __init__(self, base_url: str = "https://api.dexscreener.com", delay_seconds: float = 0.3):
        self.base_url = base_url.rstrip("/")
        self.delay_seconds = delay_seconds
        self.last_call_time = 0.0
        self.session = requests.Session()
        self.session.headers.update({"Accept": "application/json", "User-Agent": "SolPulse-Screener/1.0"})

    def _throttle(self):
        elapsed = time.time() - self.last_call_time
        if elapsed < self.delay_seconds:
            time.sleep(self.delay_seconds - elapsed)
        self.last_call_time = time.time()

    def _get(self, endpoint: str, params: Optional[Dict[str, Any]] = None, max_retries: int = 3) -> Optional[Dict[str, Any]]:
        self._throttle()
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        backoff = 1.0

        for attempt in range(max_retries):
            try:
                resp = self.session.get(url, params=params, timeout=10)
                if resp.status_code == 200:
                    return resp.json()
                elif resp.status_code == 429:
                    logger.warning(f"DexScreener rate limited (429). Retrying in {backoff}s...")
                    time.sleep(backoff)
                    backoff *= 2.0
                else:
                    logger.warning(f"DexScreener {url} returned HTTP {resp.status_code}: {resp.text[:200]}")
                    return None
            except Exception as e:
                logger.error(f"DexScreener request exception ({url}): {e}")
                time.sleep(backoff)
                backoff *= 1.5

        return None

    def get_latest_token_profiles(self) -> List[Dict[str, Any]]:
        """Fetch recently updated/created token profiles on DexScreener."""
        res = self._get("token-profiles/latest/v1")
        if isinstance(res, list):
            return res
        return []

    def get_token_pairs(self, token_address: str) -> List[Dict[str, Any]]:
        """Get all pairs for a specific token address."""
        res = self._get(f"latest/dex/tokens/{token_address}")
        if res and "pairs" in res and res["pairs"]:
            return res["pairs"]
        return []

    def get_pair_detail(self, chain_id: str, pair_address: str) -> Optional[Dict[str, Any]]:
        """Get pair details by pair address and chain ID."""
        res = self._get(f"latest/dex/pairs/{chain_id}/{pair_address}")
        if res and "pair" in res:
            return res["pair"]
        return None
