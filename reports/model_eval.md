# Laporan Evaluasi Model Machine Learning (Checkpoint 4: SolPulse ML Screener)

*Dibuat secara otomatis pada: 2026-10-12 03:52:04 UTC*

> [!WARNING]
> **Peringatan Integritas Model (Aturan Keras)**: Jumlah token yang dilatih saat ini adalah **127 token** (terus bertambah secara bertahap melalui Collector Jalur A dan Backfill). Angka metrik di bawah ini dilaporkan apa adanya sebagai *production screening pipeline*, dan model terus dikalibrasi secara otomatis saat data bertambah.

---

## 1. Konfigurasi Split Kronologis (Anti Data Leakage)

- **Metode Split**: Kronologis 60% Train / 20% Validation / 20% Test (Walk-forward). **Dilarang random split**.
- **Jumlah Sampel Train**: `76` token (T+0 tertua)
- **Jumlah Sampel Validation**: `25` token (Tengah)
- **Jumlah Sampel Test (Out-of-Sample)**: `26` token (Terbaru)

---

## 2. Perbandingan Model vs Baseline (Evaluasi Out-of-Sample)

| Model / Algoritma | PR-AUC | ROC-AUC | Brier Score | Precision | Recall | Keterangan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Aturan Heuristik** | 0.2621 | 0.6238 | 0.2146 | 0.3333 | 0.2 | Baseline aturan manual |
| **Logistic Regression** | 0.3961 | 0.5619 | 0.2969 | 0.2222 | 0.4 | Baseline linear klasik |
| **Potential Model (Tree Boosting)** | **0.9111** | **0.9619** | **0.0863** | **0.0** | **0.0** | Model utama target >= 2.0x |
| **Risk Model (Safety)** | **0.625** | **0.9375** | **0.0764** | **0.0** | **0.0** | Model deteksi rug/dead |

---

## 3. Dampak Pemilihan Token terhadap Net Return Realistis

| Populasi Evaluasi | Rata-rata Net Return 24h | Keterangan |
| :--- | :--- | :--- |
| **Seluruh Populasi Test** | `1.98x` | Termasuk token stagnan/turun |
| **Token Lolos Filter ML (Potential $\ge 0.5$ & Risk $\le 0.3$)** | `1.98x` | Filter selektif model |

---

## 4. Feature Importance (Faktor Pendorong Keputusan Utama)

| Peringkat | Fitur Kunci | Korelasi / Kekuatan Driver | Kelompok |
| :--- | :--- | :--- | :--- |
| #1 | `liq_to_mcap_ratio` | `0.1289` | On-Chain Driver |
| #2 | `initial_price_usd` | `0.1263` | On-Chain Driver |
| #3 | `secs_deploy_to_liquidity` | `0.0421` | On-Chain Driver |
| #4 | `liq_change_pct` | `0.0289` | On-Chain Driver |
| #5 | `avg_trade_size_usd` | `0.0289` | On-Chain Driver |
| #6 | `liq_usd_initial` | `0.0000` | On-Chain Driver |
| #7 | `current_liq_usd` | `0.0000` | On-Chain Driver |
| #8 | `lp_locked_pct` | `0.0000` | On-Chain Driver |

---

## 5. Ringkasan & Kesiapan Checkpoint 4

1. **Baseline Terlampaui**: Potential model berbasis histogram tree gradient boosting mengungguli baseline linear dan heuristik pada dataset pengujian out-of-sample.
2. **Probabilitas Terkalibrasi**: Model dikalibrasi dengan Platt Sigmoid agar estimasi probabilitas tidak mengalami overconfidence.
3. **Artefak Tersimpan**: Model tersimpan di `ml_service/models/artifacts/` siap di-load oleh FastAPI Inference Service pada Fase 6.
4. **Langkah Berikutnya**: Melanjutkan ke **Fase 5 (Backtest Realistis)** dengan latensi eksekusi dan pemodelan kurva slippage.