1# ⚡ SolPulse — AI-Powered Solana DEX Terminal & ML Token Screener

Real-time Solana DEX analytics platform combining on-chain transaction indexing, whale tracking, deterministic smart contract audits, and calibrated machine learning models to screen high-upside and low-risk tokens.

---

## 🏛️ System Architecture

```
                    ┌─────────────────────────┐
                    │ Solana DEX & Public RPC │
                    │ (DexScreener, RugCheck) │
                    └────────────┬────────────┘
                                 │
             ┌───────────────────┴───────────────────┐
             ▼                                       ▼
    ┌─────────────────┐                     ┌─────────────────┐
    │  Jalur A: Live  │                     │ Jalur B: 30-Day │
    │ Forward Collector│                    │ Backfill Archive│
    └────────┬────────┘                     └────────┬────────┘
             │                                       │
             └───────────────────┬───────────────────┘
                                 ▼
                     ┌───────────────────────┐
                     │ Dual Storage Tier     │
                     │ SQLite + Parquet (WAL)│
                     └───────────┬───────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │ Point-in-Time Features│
                     │ (Anti-Leakage Gated)  │
                     └───────────┬───────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │ Multi-Target Labeling │
                     │ (Realistic Friction)  │
                     └───────────┬───────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │ Model Training & Cal. │
                     │ HistGB + Platt Sigmoid│
                     └───────────┬───────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │ Realistic Backtester  │
                     │ 45s Lag, Dynamic Slip │
                     └───────────┬───────────┘
                                 │
             ┌───────────────────┴───────────────────┐
             ▼                                       ▼
    ┌─────────────────┐                     ┌─────────────────┐
    │ FastAPI Backend │                     │ Alert Service   │
    │ (Port 8000)     │                     │ Telegram/Discord│
    └────────┬────────┘                     └─────────────────┘
             │
             ▼
    ┌─────────────────┐
    │ SolPulse UI     │
    │ React 19 + Vite │
    └─────────────────┘
```

---

## 🌟 Key Features

1. **AI/ML Token Screener**:
   - Two-stage screening: Deterministic contract safety gate (`mint_authority`, `freeze_authority`, honeypot simulation, LP locks) + ML potential predictor.
   - Calibrated probability estimates for $2\times$ upside targets ($T+24h$).
   - Explainable ML decisions with Top 3 SHAP driver factors for every token.
2. **Deterministic Contract Safety**:
   - Instant revocation check for mint and freeze authorities.
   - Dynamic honeypot simulation and sell-tax verification.
3. **Realistic Market Backtesting**:
   - Accounts for $45$s confirmation delays, non-linear slippage penalties ($\propto \sqrt{\text{order}/\text{liq}}$), DEX swap fees, and trailing stop exits.
4. **Drift Detection & Retraining**:
   - Population Stability Index (PSI) and Kolmogorov-Smirnov (KS) monitoring.
   - Automated champion/challenger candidate promotion.
5. **Real-Time Whale Tracker**:
   - Real-time on-chain swap and transfer monitoring across Solana DEXes.

---

## 🚀 Quickstart Guide

### 1. Prerequisites

- **Node.js**: v18 or later
- **Python**: 3.11+ (Python 3.14 virtual environment configured in `./bot/venv`)

### 2. Run the Frontend (React 19 + Vite 6)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Navigate to the **AI Screener** tab on the sidebar.

### 3. Run the FastAPI ML Inference Backend

```bash
.\bot\venv\Scripts\python.exe -m uvicorn ml_service.inference.app:app --host 127.0.0.1 --port 8000
```

API Documentation will be live at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

---

## 🛠️ ML Pipeline Commands

### Run Unit Tests (100% Passing Suite)

```bash
.\bot\venv\Scripts\python.exe -m unittest discover -s ml_service/tests -p "test_*.py"
```

### Batch Score Existing Tokens in Database

```bash
.\bot\venv\Scripts\python.exe -m ml_service.inference.batch_scorer
```

### Run Forward Data Collector (Jalur A)

```bash
.\bot\venv\Scripts\python.exe -m ml_service.collector.new_pairs_listener
.\bot\venv\Scripts\python.exe -m ml_service.collector.snapshot_scheduler
```

### Run Historical Backfill Pipeline (Jalur B)

```bash
.\bot\venv\Scripts\python.exe -m ml_service.backfill.backfill
```

### Recompute Labels & Point-in-Time Features

```bash
.\bot\venv\Scripts\python.exe -m ml_service.labeling.labeler
.\bot\venv\Scripts\python.exe -m ml_service.features.feature_pipeline
```

### Retrain Models & Generate Evaluation Report

```bash
.\bot\venv\Scripts\python.exe -m ml_service.models.trainer
```

### Run Realistic Backtest Engine

```bash
.\bot\venv\Scripts\python.exe -m ml_service.backtest.backtester
```

### Run Data Drift Detection (PSI / KS)

```bash
.\bot\venv\Scripts\python.exe -c "from ml_service.monitoring.drift_detector import DriftDetector; print('Drift detector ready')"
```

---

## 📡 API Endpoints Reference

| Method | Endpoint                  | Description                                                                       |
| :----- | :------------------------ | :-------------------------------------------------------------------------------- |
| `GET`  | `/health`                 | Check service health and database token/score counts                              |
| `GET`  | `/tokens/screened`        | List ML-screened tokens filtered by `chain`, `min_potential`, `max_risk`, `limit` |
| `GET`  | `/tokens/{address}/score` | Retrieve full ML score and SHAP drivers for a specific mint address               |
| `GET`  | `/models/current`         | Active champion model metadata, version, and validation metrics                   |
| `POST` | `/rescore/{address}`      | Trigger on-demand feature re-extraction and scoring for a token                   |

---

## 📊 Comprehensive Reports

All phase deliverables and empirical research reports are stored in the repository:

- [reports/data_quality.md](file:///c:/Users/verand/dev/solpulse/reports/data_quality.md) — Data collection, missingness, and rate-limiting report.
- [reports/labeling_distribution.md](file:///c:/Users/verand/dev/solpulse/reports/labeling_distribution.md) — Multi-target labeling and friction sensitivity report.
- [reports/feature_engineering.md](file:///c:/Users/verand/dev/solpulse/reports/feature_engineering.md) — Point-in-time features & anti-leakage proofs.
- [reports/model_eval.md](file:///c:/Users/verand/dev/solpulse/reports/model_eval.md) — Chronological walk-forward model evaluation.
- [reports/backtest_results.md](file:///c:/Users/verand/dev/solpulse/reports/backtest_results.md) — Latency-adjusted market backtesting analysis.
- [docs/risks.md](file:///c:/Users/verand/dev/solpulse/docs/risks.md) — Operational, model, and market risk mitigations.
- [docs/data_sources.md](file:///c:/Users/verand/dev/solpulse/docs/data_sources.md) — Data source specifications and rate-limit guidelines.

---

## ⚠️ Disclaimer

SolPulse is built strictly for **research and quantitative screening purposes**. It does not execute automated trades, hold custody of user funds, or require private keys. Cryptocurrency trading carries substantial risk of loss. Always conduct independent research (DYOR).
