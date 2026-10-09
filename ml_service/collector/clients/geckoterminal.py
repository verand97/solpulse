"""GeckoTerminal API client with rate-limiting, backoff, and pagination."""

import time
import logging
from typing import Optional, Dict, Any, List
import requests

logger = logging.getLogger(__name__)

class GeckoTerminalClient:
    def __init__(self, base_url: str = "https://api.geckoterminal.com/api/v2", delay_seconds: float = 2.0):
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
        backoff = 2.0

        for attempt in range(max_retries):
            try:
                resp = self.session.get(url, params=params, timeout=12)
                if resp.status_code == 200:
                    return resp.json()
                elif resp.status_code == 429:
                    logger.warning(f"GeckoTerminal rate limited (429). Retrying in {backoff}s...")
                    time.sleep(backoff)
                    backoff *= 2.0
                elif resp.status_code == 404:
                    return None
                else:
                    logger.warning(f"GeckoTerminal {url} returned HTTP {resp.status_code}: {resp.text[:200]}")
                    return None
            except Exception as e:
                logger.error(f"GeckoTerminal request exception ({url}): {e}")
                time.sleep(backoff)
                backoff *= 1.5

        return None

    def get_new_pools(self, network: str = "solana", page: int = 1) -> List[Dict[str, Any]]:
        """Fetch newly created pools on the network."""
        res = self._get(f"networks/{network}/new_pools", params={"page": page})
        if res and "data" in res:
            return res["data"]
        return []

    def get_pool_info(self, network: str, pool_address: str) -> Optional[Dict[str, Any]]:
        """Fetch detailed pool information."""
        res = self._get(f"networks/{network}/pools/{pool_address}")
        if res and "data" in res:
            return res["data"]
        return None

    def get_pool_ohlcv(
        self,
        network: str,
        pool_address: str,
        timeframe: str = "minute",
        aggregate: int = 1,
        limit: int = 1000,
        before_timestamp: Optional[int] = None
    ) -> List[List[float]]:
        """
        Fetch OHLCV candlestick data.
        Returns: list of [timestamp, open, high, low, close, volume]
        """
        params = {"aggregate": aggregate, "limit": limit}
        if before_timestamp:
            params["before_timestamp"] = before_timestamp

        res = self._get(f"networks/{network}/pools/{pool_address}/ohlcv/{timeframe}", params=params)
        if res and "data" in res and "attributes" in res["data"]:
            return res["data"]["attributes"].get("ohlcv_list", [])
        return []

    def get_pool_trades(self, network: str, pool_address: str) -> List[Dict[str, Any]]:
        """Fetch latest trades for a specific pool."""
        res = self._get(f"networks/{network}/pools/{pool_address}/trades")
        if res and "data" in res:
            return res["data"]
        return []
