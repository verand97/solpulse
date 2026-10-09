"""Database models and schema definitions for SolPulse ML Screener."""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional

try:
    from sqlalchemy import (
        Column,
        Integer,
        String,
        Float,
        Boolean,
        DateTime,
        Text,
        ForeignKey,
        Index,
    )
    from sqlalchemy.orm import declarative_base, relationship

    Base = declarative_base()
    HAS_SQLALCHEMY = True
except ImportError:
    HAS_SQLALCHEMY = False
    Base = object

if HAS_SQLALCHEMY:
    class RawResponse(Base):
        """Raw JSON responses from external APIs."""
        __tablename__ = "raw_responses"

        id = Column(Integer, primary_key=True, autoincrement=True)
        endpoint = Column(String(255), nullable=False)
        query_params = Column(Text, nullable=True)
        fetched_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
        status_code = Column(Integer, nullable=False, default=200)
        response_body = Column(Text, nullable=False)

    class TokenModel(Base):
        """Token core information."""
        __tablename__ = "tokens"

        id = Column(Integer, primary_key=True, autoincrement=True)
        address = Column(String(64), unique=True, nullable=False, index=True)
        symbol = Column(String(32), nullable=True, index=True)
        name = Column(String(128), nullable=True)
        chain = Column(String(32), default="solana", nullable=False, index=True)
        decimals = Column(Integer, default=9)
        deployer_address = Column(String(64), nullable=True, index=True)
        created_at = Column(DateTime, nullable=True)
        first_detected_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
        initial_liquidity_usd = Column(Float, nullable=True)
        initial_price_usd = Column(Float, nullable=True)
        metadata_json = Column(Text, nullable=True)

    class PairModel(Base):
        __tablename__ = "pairs"

        id = Column(Integer, primary_key=True, autoincrement=True)
        token_address = Column(String(64), ForeignKey("tokens.address"), nullable=False, index=True)
        pair_address = Column(String(64), unique=True, nullable=False, index=True)
        chain = Column(String(32), default="solana", nullable=False)
        dex_id = Column(String(32), nullable=True)
        base_token = Column(String(64), nullable=True)
        quote_token = Column(String(64), nullable=True)
        created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    class SnapshotModel(Base):
        __tablename__ = "snapshots"

        id = Column(Integer, primary_key=True, autoincrement=True)
        token_address = Column(String(64), ForeignKey("tokens.address"), nullable=False, index=True)
        pair_address = Column(String(64), nullable=True, index=True)
        interval_label = Column(String(16), nullable=False, index=True)
        timestamp = Column(DateTime, nullable=False, index=True)
        fetched_at = Column(DateTime, default=datetime.utcnow, nullable=False)
        price_usd = Column(Float, nullable=True)
        liquidity_usd = Column(Float, nullable=True)
        volume_h24 = Column(Float, nullable=True)
        volume_m5 = Column(Float, nullable=True)
        buys_h24 = Column(Integer, nullable=True)
        sells_h24 = Column(Integer, nullable=True)
        buys_m5 = Column(Integer, nullable=True)
        sells_m5 = Column(Integer, nullable=True)
        tx_count = Column(Integer, nullable=True)
        raw_response_id = Column(Integer, ForeignKey("raw_responses.id"), nullable=True)

    class SecurityCheckModel(Base):
        __tablename__ = "security_checks"

        id = Column(Integer, primary_key=True, autoincrement=True)
        token_address = Column(String(64), ForeignKey("tokens.address"), nullable=False, index=True)
        chain = Column(String(32), default="solana", nullable=False)
        fetched_at = Column(DateTime, default=datetime.utcnow, nullable=False)
        snapshot_time = Column(DateTime, nullable=False)
        source = Column(String(32), nullable=False)
        is_mintable = Column(Boolean, default=False)
        is_renounced = Column(Boolean, default=False)
        buy_tax = Column(Float, default=0.0)
        sell_tax = Column(Float, default=0.0)
        has_blacklist = Column(Boolean, default=False)
        is_proxy = Column(Boolean, default=False)
        mint_authority_enabled = Column(Boolean, default=False)
        freeze_authority_enabled = Column(Boolean, default=False)
        danger_risks_count = Column(Integer, default=0)
        score = Column(Float, default=0.0)
        raw_response_id = Column(Integer, ForeignKey("raw_responses.id"), nullable=True)

    class HoldersSnapshotModel(Base):
        __tablename__ = "holders_snapshot"

        id = Column(Integer, primary_key=True, autoincrement=True)
        token_address = Column(String(64), ForeignKey("tokens.address"), nullable=False, index=True)
        fetched_at = Column(DateTime, default=datetime.utcnow, nullable=False)
        total_holders = Column(Integer, default=0)
        top1_pct = Column(Float, default=0.0)
        top10_pct = Column(Float, default=0.0)
        top10_excl_lp_pct = Column(Float, default=0.0)
        same_funder_wallets_pct = Column(Float, default=0.0)
        sniper_wallets_pct = Column(Float, default=0.0)
        raw_response_id = Column(Integer, ForeignKey("raw_responses.id"), nullable=True)

    class DeployerModel(Base):
        __tablename__ = "deployers"

        id = Column(Integer, primary_key=True, autoincrement=True)
        address = Column(String(64), unique=True, nullable=False, index=True)
        chain = Column(String(32), default="solana", nullable=False)
        first_seen_at = Column(DateTime, default=datetime.utcnow, nullable=False)
        total_tokens_created = Column(Integer, default=1)
        rugs_count = Column(Integer, default=0)
        honeypots_count = Column(Integer, default=0)

    class LabelModel(Base):
        __tablename__ = "labels"

        id = Column(Integer, primary_key=True, autoincrement=True)
        token_address = Column(String(64), ForeignKey("tokens.address"), unique=True, nullable=False, index=True)
        is_honeypot = Column(Boolean, default=False, nullable=False)
        is_rug = Column(Boolean, default=False, nullable=False)
        is_dead = Column(Boolean, default=False, nullable=False)
        entry_price = Column(Float, nullable=True)
        peak_price_24h = Column(Float, nullable=True)
        max_return_24h = Column(Float, nullable=True)
        net_return_24h = Column(Float, nullable=True)
        success = Column(Boolean, default=False, nullable=False)
        labeled_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    class FeatureModel(Base):
        __tablename__ = "features"

        id = Column(Integer, primary_key=True, autoincrement=True)
        token_address = Column(String(64), ForeignKey("tokens.address"), nullable=False, index=True)
        feature_version = Column(String(16), default="v1.0", nullable=False)
        point_in_time = Column(String(16), default="t_5m", nullable=False)
        calculated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
        features_json = Column(Text, nullable=False)

    class MLScoreModel(Base):
        __tablename__ = "ml_scores"

        id = Column(Integer, primary_key=True, autoincrement=True)
        token_address = Column(String(64), ForeignKey("tokens.address"), nullable=False, index=True)
        symbol = Column(String(32), nullable=True)
        chain = Column(String(32), default="solana", nullable=False)
        model_version = Column(String(32), default="v1.0-lgb", nullable=False)
        calculated_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
        risk_score = Column(Float, nullable=False)
        potential_score = Column(Float, nullable=False)
        anomaly_score = Column(Float, default=0.0)
        passes_hard_rules = Column(Boolean, default=True, nullable=False)
        rejected_rule_reason = Column(String(255), nullable=True)
        recommendation = Column(String(32), default="MONITOR")
        top_shap_reasons_json = Column(Text, nullable=True)

else:
    # Pure Python data containers when running without SQLAlchemy
    RawResponse = dict
    TokenModel = dict
    PairModel = dict
    SnapshotModel = dict
    SecurityCheckModel = dict
    HoldersSnapshotModel = dict
    DeployerModel = dict
    LabelModel = dict
    FeatureModel = dict
    MLScoreModel = dict
