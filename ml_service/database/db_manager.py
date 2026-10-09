"""Robust Database Manager supporting SQLite with thread safety."""

import os
import json
import sqlite3
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

DB_DIR = Path(__file__).resolve().parent.parent / "data"
DB_DIR.mkdir(parents=True, exist_ok=True)
SQLITE_PATH = DB_DIR / "solpulse_ml.db"

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS raw_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT NOT NULL,
    query_params TEXT,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status_code INTEGER DEFAULT 200,
    response_body TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    address TEXT UNIQUE NOT NULL,
    symbol TEXT,
    name TEXT,
    chain TEXT DEFAULT 'solana',
    decimals INTEGER DEFAULT 9,
    deployer_address TEXT,
    created_at TIMESTAMP,
    first_detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    initial_liquidity_usd REAL,
    initial_price_usd REAL,
    metadata_json TEXT
);

CREATE TABLE IF NOT EXISTS pairs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_address TEXT NOT NULL,
    pair_address TEXT UNIQUE NOT NULL,
    chain TEXT DEFAULT 'solana',
    dex_id TEXT,
    base_token TEXT,
    quote_token TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(token_address) REFERENCES tokens(address)
);

CREATE TABLE IF NOT EXISTS snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_address TEXT NOT NULL,
    pair_address TEXT,
    interval_label TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    price_usd REAL,
    liquidity_usd REAL,
    volume_h24 REAL,
    volume_m5 REAL,
    buys_h24 INTEGER,
    sells_h24 INTEGER,
    buys_m5 INTEGER,
    sells_m5 INTEGER,
    tx_count INTEGER,
    raw_response_id INTEGER,
    FOREIGN KEY(token_address) REFERENCES tokens(address),
    FOREIGN KEY(raw_response_id) REFERENCES raw_responses(id)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_token_interval ON snapshots(token_address, interval_label);

CREATE TABLE IF NOT EXISTS security_checks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_address TEXT NOT NULL,
    chain TEXT DEFAULT 'solana',
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    snapshot_time TIMESTAMP NOT NULL,
    source TEXT NOT NULL,
    is_mintable BOOLEAN DEFAULT 0,
    is_renounced BOOLEAN DEFAULT 0,
    buy_tax REAL DEFAULT 0.0,
    sell_tax REAL DEFAULT 0.0,
    has_blacklist BOOLEAN DEFAULT 0,
    is_proxy BOOLEAN DEFAULT 0,
    mint_authority_enabled BOOLEAN DEFAULT 0,
    freeze_authority_enabled BOOLEAN DEFAULT 0,
    danger_risks_count INTEGER DEFAULT 0,
    score REAL DEFAULT 0.0,
    raw_response_id INTEGER,
    FOREIGN KEY(token_address) REFERENCES tokens(address)
);

CREATE TABLE IF NOT EXISTS holders_snapshot (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_address TEXT NOT NULL,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_holders INTEGER DEFAULT 0,
    top1_pct REAL DEFAULT 0.0,
    top10_pct REAL DEFAULT 0.0,
    top10_excl_lp_pct REAL DEFAULT 0.0,
    same_funder_wallets_pct REAL DEFAULT 0.0,
    sniper_wallets_pct REAL DEFAULT 0.0,
    raw_response_id INTEGER,
    FOREIGN KEY(token_address) REFERENCES tokens(address)
);

CREATE TABLE IF NOT EXISTS deployers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    address TEXT UNIQUE NOT NULL,
    chain TEXT DEFAULT 'solana',
    first_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_tokens_created INTEGER DEFAULT 1,
    rugs_count INTEGER DEFAULT 0,
    honeypots_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS labels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_address TEXT UNIQUE NOT NULL,
    is_honeypot BOOLEAN DEFAULT 0,
    is_rug BOOLEAN DEFAULT 0,
    is_dead BOOLEAN DEFAULT 0,
    entry_price REAL,
    peak_price_24h REAL,
    max_return_24h REAL,
    net_return_24h REAL,
    success BOOLEAN DEFAULT 0,
    labeled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(token_address) REFERENCES tokens(address)
);

CREATE TABLE IF NOT EXISTS features (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_address TEXT NOT NULL,
    feature_version TEXT DEFAULT 'v1.0',
    point_in_time TEXT DEFAULT 't_5m',
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    features_json TEXT NOT NULL,
    FOREIGN KEY(token_address) REFERENCES tokens(address)
);

CREATE INDEX IF NOT EXISTS idx_features_pit ON features(token_address, point_in_time);

CREATE TABLE IF NOT EXISTS ml_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_address TEXT NOT NULL,
    symbol TEXT,
    chain TEXT DEFAULT 'solana',
    model_version TEXT DEFAULT 'v1.0',
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    risk_score REAL NOT NULL,
    potential_score REAL NOT NULL,
    anomaly_score REAL DEFAULT 0.0,
    passes_hard_rules BOOLEAN DEFAULT 1,
    rejected_rule_reason TEXT,
    recommendation TEXT DEFAULT 'MONITOR',
    top_shap_reasons_json TEXT,
    FOREIGN KEY(token_address) REFERENCES tokens(address)
);

CREATE INDEX IF NOT EXISTS idx_ml_scores_addr ON ml_scores(token_address);
"""

def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

class DBManager:
    """Manages SQLite database connections and CRUD operations."""

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or str(SQLITE_PATH)
        self.init_db()

    def get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, timeout=30.0)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        with self.get_connection() as conn:
            conn.executescript(SCHEMA_SQL)
            conn.commit()

    def record_raw_response(self, endpoint: str, response_body: str, query_params: Optional[str] = None, status_code: int = 200) -> int:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO raw_responses (endpoint, query_params, response_body, status_code) VALUES (?, ?, ?, ?)",
                (endpoint, query_params, response_body, status_code)
            )
            conn.commit()
            return cursor.lastrowid

    def token_exists(self, address: str) -> bool:
        with self.get_connection() as conn:
            row = conn.execute("SELECT 1 FROM tokens WHERE address = ?", (address,)).fetchone()
            return row is not None

    def upsert_token(self, token_data: Dict[str, Any]):
        with self.get_connection() as conn:
            conn.execute(
                """
                INSERT INTO tokens (address, symbol, name, chain, decimals, deployer_address, created_at, first_detected_at, initial_liquidity_usd, initial_price_usd, metadata_json)
                VALUES (:address, :symbol, :name, :chain, :decimals, :deployer_address, :created_at, :first_detected_at, :initial_liquidity_usd, :initial_price_usd, :metadata_json)
                ON CONFLICT(address) DO UPDATE SET
                    symbol=coalesce(excluded.symbol, tokens.symbol),
                    name=coalesce(excluded.name, tokens.name),
                    initial_liquidity_usd=coalesce(tokens.initial_liquidity_usd, excluded.initial_liquidity_usd),
                    initial_price_usd=coalesce(tokens.initial_price_usd, excluded.initial_price_usd)
                """,
                {
                    "address": token_data["address"],
                    "symbol": token_data.get("symbol"),
                    "name": token_data.get("name"),
                    "chain": token_data.get("chain", "solana"),
                    "decimals": token_data.get("decimals", 9),
                    "deployer_address": token_data.get("deployer_address"),
                    "created_at": token_data.get("created_at"),
                    "first_detected_at": token_data.get("first_detected_at", utc_now_iso()),
                    "initial_liquidity_usd": token_data.get("initial_liquidity_usd"),
                    "initial_price_usd": token_data.get("initial_price_usd"),
                    "metadata_json": json.dumps(token_data.get("metadata", {}))
                }
            )
            conn.commit()

    def upsert_pair(self, pair_data: Dict[str, Any]):
        with self.get_connection() as conn:
            conn.execute(
                """
                INSERT OR IGNORE INTO pairs (token_address, pair_address, chain, dex_id, base_token, quote_token)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    pair_data["token_address"],
                    pair_data["pair_address"],
                    pair_data.get("chain", "solana"),
                    pair_data.get("dex_id"),
                    pair_data.get("base_token"),
                    pair_data.get("quote_token")
                )
            )
            conn.commit()

    def add_snapshot(self, snap: Dict[str, Any]):
        with self.get_connection() as conn:
            conn.execute(
                """
                INSERT INTO snapshots (
                    token_address, pair_address, interval_label, timestamp, fetched_at,
                    price_usd, liquidity_usd, volume_h24, volume_m5, buys_h24, sells_h24,
                    buys_m5, sells_m5, tx_count, raw_response_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    snap["token_address"],
                    snap.get("pair_address"),
                    snap["interval_label"],
                    snap.get("timestamp", utc_now_iso()),
                    utc_now_iso(),
                    snap.get("price_usd"),
                    snap.get("liquidity_usd"),
                    snap.get("volume_h24"),
                    snap.get("volume_m5"),
                    snap.get("buys_h24"),
                    snap.get("sells_h24"),
                    snap.get("buys_m5"),
                    snap.get("sells_m5"),
                    snap.get("tx_count"),
                    snap.get("raw_response_id")
                )
            )
            conn.commit()

    def add_security_check(self, sec: Dict[str, Any]):
        with self.get_connection() as conn:
            conn.execute(
                """
                INSERT INTO security_checks (
                    token_address, chain, fetched_at, snapshot_time, source,
                    is_mintable, is_renounced, buy_tax, sell_tax, has_blacklist,
                    is_proxy, mint_authority_enabled, freeze_authority_enabled,
                    danger_risks_count, score, raw_response_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    sec["token_address"],
                    sec.get("chain", "solana"),
                    utc_now_iso(),
                    sec.get("snapshot_time", utc_now_iso()),
                    sec.get("source", "rugcheck"),
                    1 if sec.get("is_mintable") else 0,
                    1 if sec.get("is_renounced") else 0,
                    sec.get("buy_tax", 0.0),
                    sec.get("sell_tax", 0.0),
                    1 if sec.get("has_blacklist") else 0,
                    1 if sec.get("is_proxy") else 0,
                    1 if sec.get("mint_authority_enabled") else 0,
                    1 if sec.get("freeze_authority_enabled") else 0,
                    sec.get("danger_risks_count", 0),
                    sec.get("score", 0.0),
                    sec.get("raw_response_id")
                )
            )
            conn.commit()

    def add_holder_snapshot(self, holders: Dict[str, Any]):
        with self.get_connection() as conn:
            conn.execute(
                """
                INSERT INTO holders_snapshot (
                    token_address, fetched_at, total_holders, top1_pct, top10_pct,
                    top10_excl_lp_pct, same_funder_wallets_pct, sniper_wallets_pct, raw_response_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    holders["token_address"],
                    utc_now_iso(),
                    holders.get("total_holders", 0),
                    holders.get("top1_pct", 0.0),
                    holders.get("top10_pct", 0.0),
                    holders.get("top10_excl_lp_pct", 0.0),
                    holders.get("same_funder_wallets_pct", 0.0),
                    holders.get("sniper_wallets_pct", 0.0),
                    holders.get("raw_response_id")
                )
            )
            conn.commit()

    def upsert_label(self, label: Dict[str, Any]):
        with self.get_connection() as conn:
            conn.execute(
                """
                INSERT INTO labels (
                    token_address, is_honeypot, is_rug, is_dead, entry_price,
                    peak_price_24h, max_return_24h, net_return_24h, success, labeled_at
                ) VALUES (:token_address, :is_honeypot, :is_rug, :is_dead, :entry_price,
                          :peak_price_24h, :max_return_24h, :net_return_24h, :success, :labeled_at)
                ON CONFLICT(token_address) DO UPDATE SET
                    is_honeypot=excluded.is_honeypot,
                    is_rug=excluded.is_rug,
                    is_dead=excluded.is_dead,
                    entry_price=excluded.entry_price,
                    peak_price_24h=excluded.peak_price_24h,
                    max_return_24h=excluded.max_return_24h,
                    net_return_24h=excluded.net_return_24h,
                    success=excluded.success,
                    labeled_at=excluded.labeled_at
                """,
                {
                    "token_address": label["token_address"],
                    "is_honeypot": 1 if label.get("is_honeypot") else 0,
                    "is_rug": 1 if label.get("is_rug") else 0,
                    "is_dead": 1 if label.get("is_dead") else 0,
                    "entry_price": label.get("entry_price"),
                    "peak_price_24h": label.get("peak_price_24h"),
                    "max_return_24h": label.get("max_return_24h"),
                    "net_return_24h": label.get("net_return_24h"),
                    "success": 1 if label.get("success") else 0,
                    "labeled_at": utc_now_iso()
                }
            )
            conn.commit()

    def upsert_features(self, feat: Dict[str, Any]):
        with self.get_connection() as conn:
            conn.execute(
                """
                INSERT INTO features (token_address, feature_version, point_in_time, calculated_at, features_json)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    feat["token_address"],
                    feat.get("feature_version", "v1.0"),
                    feat.get("point_in_time", "t_5m"),
                    utc_now_iso(),
                    json.dumps(feat.get("features", {}))
                )
            )
            conn.commit()

    def upsert_ml_score(self, score: Dict[str, Any]):
        with self.get_connection() as conn:
            conn.execute(
                """
                INSERT INTO ml_scores (
                    token_address, symbol, chain, model_version, calculated_at,
                    risk_score, potential_score, anomaly_score, passes_hard_rules,
                    rejected_rule_reason, recommendation, top_shap_reasons_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    score["token_address"],
                    score.get("symbol"),
                    score.get("chain", "solana"),
                    score.get("model_version", "v1.0"),
                    utc_now_iso(),
                    score.get("risk_score", 0.5),
                    score.get("potential_score", 0.5),
                    score.get("anomaly_score", 0.0),
                    1 if score.get("passes_hard_rules", True) else 0,
                    score.get("rejected_rule_reason"),
                    score.get("recommendation", "MONITOR"),
                    json.dumps(score.get("top_shap_reasons", []))
                )
            )
            conn.commit()

    def get_recent_tokens(self, limit: int = 100) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            rows = cursor.execute("SELECT * FROM tokens ORDER BY first_detected_at DESC LIMIT ?", (limit,)).fetchall()
            return [dict(r) for r in rows]

    def get_token_snapshots(self, token_address: str) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            rows = cursor.execute("SELECT * FROM snapshots WHERE token_address = ? ORDER BY timestamp ASC", (token_address,)).fetchall()
            return [dict(r) for r in rows]

    def get_screened_tokens(self, chain: str = "solana", min_potential: float = 0.0, max_risk: float = 1.0, limit: int = 50) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            query = """
            SELECT m.*, t.name, t.initial_liquidity_usd, t.initial_price_usd
            FROM ml_scores m
            JOIN tokens t ON m.token_address = t.address
            WHERE m.chain = ? AND m.potential_score >= ? AND m.risk_score <= ?
            ORDER BY m.calculated_at DESC
            LIMIT ?
            """
            rows = cursor.execute(query, (chain, min_potential, max_risk, limit)).fetchall()
            result = []
            for r in rows:
                d = dict(r)
                if d.get("top_shap_reasons_json"):
                    try:
                        d["top_shap_reasons"] = json.loads(d["top_shap_reasons_json"])
                    except:
                        d["top_shap_reasons"] = []
                result.append(d)
            return result
