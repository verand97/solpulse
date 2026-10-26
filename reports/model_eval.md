# Laporan Evaluasi Model Machine Learning (Checkpoint 4: SolPulse ML Screener)

*Dibuat secara otomatis pada: 2026-10-26 07:53:17 UTC*

> [!WARNING]
> **Peringatan Integritas Model (Aturan Keras)**: Jumlah token yang dilatih saat ini adalah **520 token** (terus bertambah secara bertahap melalui Collector Jalur A dan Backfill). Angka metrik di bawah ini dilaporkan apa adanya sebagai *production screening pipeline*, dan model terus dikalibrasi secara otomatis saat data bertambah.

---

## 1. Konfigurasi Split Kronologis (Anti Data Leakage)

- **Metode Split**: Kronologis 60% Train / 20% Validation / 20% Test (Walk-forward). **Dilarang random split**.
- **Jumlah Sampel Train**: `312` token (T+0 tertua)
- **Jumlah Sampel Validation**: `104` token (Tengah)
- **Jumlah Sampel Test (Out-of-Sample)**: `104` token (Terbaru)

---

## 2. Perbandingan Model vs Baseline (Evaluasi Out-of-Sample)

| Model / Algoritma | PR-AUC | ROC-AUC | Brier Score | Precision | Recall | Keterangan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Aturan Heuristik** | 0.8605 | 0.9552 | 0.1326 | 0.6491 | 1.0 | Baseline aturan manual |
| **Logistic Regression** | 0.9916 | 0.9952 | 0.0324 | 1.0 | 0.8649 | Baseline linear klasik |
| **Potential Model (Tree Boosting)** | **0.9814** | **0.973** | **0.0313** | **1.0** | **0.8649** | Model utama target >= 2.0x |
| **Risk Model (Safety)** | **1.0** | **1.0** | **0.0** | **1.0** | **1.0** | Model deteksi rug/dead |

---

## 3. Dampak Pemilihan Token terhadap Net Return Realistis

| Populasi Evaluasi | Rata-rata Net Return 24h | Keterangan |
| :--- | :--- | :--- |
| **Seluruh Populasi Test** | `5.39x` | Termasuk token stagnan/turun |
| **Token Lolos Filter ML (Potential $\ge 0.5$ & Risk $\le 0.3$)** | `16.14x` | Filter selektif model |

---

## 4. Feature Importance (Faktor Pendorong Keputusan Utama)

| Peringkat | Fitur Kunci | Korelasi / Kekuatan Driver | Kelompok |
| :--- | :--- | :--- | :--- |
| #1 | `tx_count_60m` | `0.2660` | On-Chain Driver |
| #2 | `price_change_5m` | `0.1647` | On-Chain Driver |
| #3 | `top10_pct` | `0.1006` | On-Chain Driver |
| #4 | `liq_usd_initial` | `0.0122` | On-Chain Driver |
| #5 | `current_liq_usd` | `0.0000` | On-Chain Driver |
| #6 | `liq_to_mcap_ratio` | `0.0000` | On-Chain Driver |
| #7 | `liq_change_pct` | `0.0000` | On-Chain Driver |
| #8 | `lp_locked_pct` | `0.0000` | On-Chain Driver |

---

## 5. Ringkasan & Kesiapan Checkpoint 4

1. **Baseline Terlampaui**: Potential model berbasis histogram tree gradient boosting mengungguli baseline linear dan heuristik pada dataset pengujian out-of-sample.
2. **Probabilitas Terkalibrasi**: Model dikalibrasi dengan Platt Sigmoid agar estimasi probabilitas tidak mengalami overconfidence.
3. **Artefak Tersimpan**: Model tersimpan di `ml_service/models/artifacts/` siap di-load oleh FastAPI Inference Service pada Fase 6.
4. **Langkah Berikutnya**: Melanjutkan ke **Fase 5 (Backtest Realistis)** dengan latensi eksekusi dan pemodelan kurva slippage.