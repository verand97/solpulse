"""RugCheck API client for Solana token safety audits."""

import time
import logging
from typing import Optional, Dict, Any
import requests

logger = logging.getLogger(__name__)

class RugCheckClient:
    def __init__(self, base_url: str = "https://api.rugcheck.xyz", delay_seconds: float = 1.0):
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

    def get_token_report_summary(self, mint_address: str, max_retries: int = 3) -> Optional[Dict[str, Any]]:
        """Fetch report summary with risk levels and overall score."""
        self._throttle()
        url = f"{self.base_url}/v1/tokens/{mint_address}/report/summary"
        backoff = 1.0

        for attempt in range(max_retries):
            try:
                resp = self.session.get(url, timeout=10)
                if resp.status_code == 200:
                    return resp.json()
                elif resp.status_code == 429:
                    logger.warning(f"RugCheck rate limited. Retrying in {backoff}s...")
                    time.sleep(backoff)
                    backoff *= 2.0
                elif resp.status_code == 404:
                    return None
            except Exception as e:
                logger.error(f"RugCheck error for {mint_address}: {e}")
                time.sleep(backoff)
                backoff *= 1.5

        return None

    def get_token_full_report(self, mint_address: str, max_retries: int = 3) -> Optional[Dict[str, Any]]:
        """Fetch detailed report with token authorities, holders, and LP lock status."""
        self._throttle()
        url = f"{self.base_url}/v1/tokens/{mint_address}/report"
        backoff = 1.0

        for attempt in range(max_retries):
            try:
                resp = self.session.get(url, timeout=10)
                if resp.status_code == 200:
                    return resp.json()
                elif resp.status_code == 429:
                    time.sleep(backoff)
                    backoff *= 2.0
                elif resp.status_code == 404:
                    return None
            except Exception as e:
                logger.error(f"RugCheck report error for {mint_address}: {e}")
                time.sleep(backoff)
                backoff *= 1.5

        return None
