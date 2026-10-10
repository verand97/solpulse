"""Alert Service for High Potential & Low Risk Token Notifications (Telegram / Discord)."""

import os
import time
import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
import requests
from dotenv import load_dotenv

from ml_service.database.db_manager import DBManager

logger = logging.getLogger(__name__)

# Load bot env or ml_service env
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT_DIR / ".env")
load_dotenv(ROOT_DIR / "bot" / ".env")

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("ALLOWED_CHAT_ID") or os.getenv("TELEGRAM_CHAT_ID")
DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL")

ALERT_CHECKPOINT_FILE = Path(__file__).resolve().parent.parent / "data" / "alerted_tokens.json"


class AlertService:
    """Dispatches real-time alerts when tokens pass high-potential and low-risk thresholds."""

    def __init__(
        self,
        db: Optional[DBManager] = None,
        min_potential: float = 0.75,
        max_risk: float = 0.25,
        rate_limit_delay_seconds: float = 2.0
    ):
        self.db = db or DBManager()
        self.min_potential = min_potential
        self.max_risk = max_risk
        self.rate_limit_delay = rate_limit_delay_seconds
        self.alerted_addresses = self._load_alerted()

    def _load_alerted(self) -> set:
        if ALERT_CHECKPOINT_FILE.exists():
            try:
                with open(ALERT_CHECKPOINT_FILE, "r", encoding="utf-8") as f:
                    return set(json.load(f))
            except Exception:
                pass
        return set()

    def _save_alerted(self):
        ALERT_CHECKPOINT_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(ALERT_CHECKPOINT_FILE, "w", encoding="utf-8") as f:
            json.dump(list(self.alerted_addresses), f, indent=2)

    def format_alert_message(self, score_data: Dict[str, Any]) -> str:
        """Construct structured markdown message with metrics, SHAP factors, and disclaimer."""
        symbol = score_data.get("symbol", "TOKEN")
        addr = score_data.get("token_address", "")
        chain = score_data.get("chain", "solana").upper()
        pot = score_data.get("potential_score", 0.0)
        risk = score_data.get("risk_score", 0.0)
        reasons = score_data.get("top_shap_reasons", [])

        reason_bullets = ""
        for r in reasons[:3]:
            icon = "✅" if r.get("impact") == "positive" else ("⚠️" if r.get("impact") == "caution" else "ℹ️")
            reason_bullets += f"\n  {icon} *{r.get('factor')}*: {r.get('detail')}"

        msg = (
            f"🚀 *[SolPulse ML Alert] High Potential Token Detected!*\n\n"
            f"🪙 *Token*: ${symbol} ({chain})\n"
            f"📍 *Contract*: `{addr}`\n\n"
            f"📊 *ML Screener Scores*:\n"
            f"  • *Potential Score*: `{pot:.2f}` (Target >= 2.0x)\n"
            f"  • *Risk Score*: `{risk:.2f}` (Low Risk)\n"
            f"  • *Recommendation*: `{score_data.get('recommendation', 'BUY_CANDIDATE')}`\n\n"
            f"🔍 *Faktor Pendorong Utama*:{reason_bullets or ' Metrik likuiditas sehat'}\n\n"
            f"🔗 *Links*:\n"
            f"  • [DexScreener](https://dexscreener.com/solana/{addr})\n"
            f"  • [RugCheck](https://rugcheck.xyz/tokens/{addr})\n\n"
            f"⚠️ *Disclaimer*: Bukan saran keuangan (Not financial advice). Lakukan riset mandiri (DYOR)."
        )
        return msg

    def send_telegram_alert(self, message: str) -> bool:
        if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
            logger.info("Telegram bot token or chat ID not set in .env. Skipping Telegram alert dispatch.")
            return False

        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        payload = {
            "chat_id": TELEGRAM_CHAT_ID,
            "text": message,
            "parse_mode": "Markdown",
            "disable_web_page_preview": True
        }
        try:
            resp = requests.post(url, json=payload, timeout=8)
            return resp.status_code == 200
        except Exception as e:
            logger.error(f"Error sending Telegram alert: {e}")
            return False

    def send_discord_alert(self, message: str) -> bool:
        if not DISCORD_WEBHOOK_URL:
            return False

        # Convert markdown bold to Discord
        payload = {"content": message.replace("*", "**")}
        try:
            resp = requests.post(DISCORD_WEBHOOK_URL, json=payload, timeout=8)
            return resp.status_code in [200, 204]
        except Exception as e:
            logger.error(f"Error sending Discord alert: {e}")
            return False

    def should_alert(self, score_data: Dict[str, Any]) -> bool:
        """Check if score meets alert criteria and token has not been alerted yet."""
        addr = score_data.get("token_address")
        if not addr or addr in self.alerted_addresses:
            return False
        pot = float(score_data.get("potential_score") or 0.0)
        risk = float(score_data.get("risk_score") or 1.0)
        passes_hard = bool(score_data.get("passes_hard_rules", True))
        return passes_hard and pot >= self.min_potential and risk <= self.max_risk

    def dispatch_alert(self, score_data: Dict[str, Any]) -> bool:
        """Dispatch Telegram/Discord alert and save to alerted history."""
        addr = score_data.get("token_address")
        msg = self.format_alert_message(score_data)
        pot = score_data.get("potential_score")
        risk = score_data.get("risk_score")
        logger.info(f"🚨 DISPATCHING ALERT for {score_data.get('symbol')} ({addr}): Potential {pot}, Risk {risk}")
        self.send_telegram_alert(msg)
        self.send_discord_alert(msg)
        if addr:
            self.alerted_addresses.add(addr)
            self._save_alerted()
        time.sleep(self.rate_limit_delay)
        return True

    def check_and_alert(self, score_data: Dict[str, Any]) -> bool:
        """Check thresholds and dispatch alerts with deduplication."""
        if self.should_alert(score_data):
            return self.dispatch_alert(score_data)
        return False

