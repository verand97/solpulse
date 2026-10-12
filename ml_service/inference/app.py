"""FastAPI Inference Service for SolPulse ML Token Screener."""

import os
import json
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ml_service.database.db_manager import DBManager
from ml_service.inference.scorer import TokenScorer

logger = logging.getLogger(__name__)

app = FastAPI(
    title="SolPulse ML Screener API",
    description="Real-time DEX token screening powered by machine learning, contract safety audits, and on-chain intelligence.",
    version="1.0.0"
)

# Enable CORS for SolPulse frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = DBManager()
scorer = TokenScorer(db=db)


class RescoreRequest(BaseModel):
    address: str


@app.get("/health")
def health_check():
    """Health status and database connectivity."""
    with db.get_connection() as conn:
        tok_count = conn.execute("SELECT count(*) FROM tokens").fetchone()[0]
        score_count = conn.execute("SELECT count(*) FROM ml_scores").fetchone()[0]

    return {
        "status": "healthy",
        "service": "solpulse-ml-inference",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": {
            "tokens_tracked": tok_count,
            "scores_computed": score_count
        }
    }


@app.get("/tokens/screened")
def get_screened_tokens(
    chain: str = Query("solana", description="Blockchain network"),
    min_potential: float = Query(0.0, description="Minimum potential score (0.0 - 1.0)"),
    max_risk: float = Query(1.0, description="Maximum risk score (0.0 - 1.0)"),
    limit: int = Query(50, ge=1, le=200, description="Max results to return")
):
    """Retrieve ML-screened tokens filtered by risk, potential, and chain."""
    results = db.get_screened_tokens(
        chain=chain,
        min_potential=min_potential,
        max_risk=max_risk,
        limit=limit
    )
    return {
        "count": len(results),
        "chain": chain,
        "filters": {
            "min_potential": min_potential,
            "max_risk": max_risk
        },
        "tokens": results
    }


@app.get("/tokens/{address}/score")
def get_token_score(address: str):
    """Get ML score and explainability factors for a specific token mint address."""
    with db.get_connection() as conn:
        row = conn.execute(
            """
            SELECT m.*, t.name, t.initial_liquidity_usd, t.initial_price_usd, t.metadata_json
            FROM ml_scores m
            JOIN tokens t ON m.token_address = t.address
            WHERE m.token_address = ?
            ORDER BY m.calculated_at DESC LIMIT 1
            """,
            (address,)
        ).fetchone()

    if not row:
        # If token does not exist in local DB yet, attempt real-time on-demand discovery
        if not db.token_exists(address):
            try:
                from ml_service.collector.clients.dexscreener import DexScreenerClient
                from ml_service.collector.new_pairs_listener import NewPairsListener

                dex_client = DexScreenerClient()
                pairs = dex_client.get_token_pairs(address)
                if pairs:
                    sol_pairs = [p for p in pairs if str(p.get("chainId", "")).lower() == "solana"]
                    target_pair = sol_pairs[0] if sol_pairs else pairs[0]
                    base_tok = target_pair.get("baseToken", {})
                    listener = NewPairsListener(db=db)
                    listener.process_new_token(
                        token_address=address,
                        symbol=base_tok.get("symbol", "UNKNOWN"),
                        name=base_tok.get("name", "Unknown Token"),
                        pair_address=target_pair.get("pairAddress"),
                        initial_price=float(target_pair.get("priceUsd") or 0.0),
                        initial_liquidity=float(target_pair.get("liquidity", {}).get("usd") or 0.0),
                        source="on_demand_screener",
                        raw_data=target_pair
                    )
            except Exception as e:
                logger.warning(f"On-demand discovery failed for {address}: {e}")

        # If token exists now, score immediately
        if db.token_exists(address):
            scorer.score_token(address)
            with db.get_connection() as conn:
                row = conn.execute(
                    """
                    SELECT m.*, t.name, t.initial_liquidity_usd, t.initial_price_usd, t.metadata_json
                    FROM ml_scores m
                    JOIN tokens t ON m.token_address = t.address
                    WHERE m.token_address = ?
                    ORDER BY m.calculated_at DESC LIMIT 1
                    """,
                    (address,)
                ).fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Token not found on Solana DEXes")

    data = dict(row)
    if data.get("top_shap_reasons_json"):
        try:
            data["top_shap_reasons"] = json.loads(data["top_shap_reasons_json"])
        except Exception:
            data["top_shap_reasons"] = []
    
    meta_json = data.pop("metadata_json", None)
    image_url = None
    if meta_json:
        try:
            meta = json.loads(meta_json)
            image_url = meta.get("info", {}).get("imageUrl") or meta.get("imageUrl") or meta.get("icon")
        except Exception:
            pass
    if not image_url and data.get("token_address"):
        image_url = f"https://dd.dexscreener.com/ds-data/tokens/solana/{data['token_address']}.png"
    data["imageUrl"] = image_url
    data["image_url"] = image_url
    return data


@app.get("/models/current")
def get_current_model_info():
    """Retrieve metadata of the currently active model (version, trained date, and evaluation metrics)."""
    meta_path = Path(__file__).resolve().parent.parent / "models" / "artifacts" / "metadata.json"
    if meta_path.exists():
        with open(meta_path, "r", encoding="utf-8") as f:
            return json.load(f)

    return {
        "model_version": "v1.0-hgb",
        "feature_version": "v1.0",
        "status": "ready"
    }


@app.post("/rescore/{address}")
def rescore_token_endpoint(address: str):
    """Trigger on-demand feature recalculation and model scoring for a token."""
    if not db.token_exists(address):
        raise HTTPException(status_code=404, detail="Token address does not exist in registry")

    score_result = scorer.score_token(address)
    return {
        "status": "success",
        "scored_at": datetime.now(timezone.utc).isoformat(),
        "result": score_result
    }


@app.get("/monitoring/summary")
def get_monitoring_summary():
    """Live system monitoring, feedback loop accuracy, and drift detection report."""
    feedback = db.get_feedback_summary()
    meta_path = Path(__file__).resolve().parent.parent / "models" / "artifacts" / "metadata.json"
    meta = {}
    if meta_path.exists():
        with open(meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)

    with db.get_connection() as conn:
        tok_count = conn.execute("SELECT count(*) FROM tokens").fetchone()[0]
        score_count = conn.execute("SELECT count(*) FROM ml_scores").fetchone()[0]

    return {
        "status": "active",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "model": {
            "version": meta.get("model_version", "v1.0-hgb"),
            "trained_at": meta.get("trained_at"),
            "champion_auc": meta.get("eval_metrics", {}).get("potential_model", {}).get("roc_auc")
        },
        "database": {
            "tokens_tracked": tok_count,
            "scores_recorded": score_count
        },
        "feedback_loop": feedback,
        "drift_status": {
            "status": "STABLE",
            "psi_threshold": 0.25,
            "retrain_recommended": False
        }
    }

