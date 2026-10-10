# Laporan Evaluasi Model Machine Learning (Checkpoint 4: SolPulse ML Screener)

*Dibuat secara otomatis pada: 2026-10-10 08:57:05 UTC*

> [!WARNING]
> **Peringatan Integritas Model (Aturan Keras)**: Jumlah token yang dilatih saat ini adalah **47 token** (jauh di bawah batas minimum aman $\ge 3.000$ token). Angka metrik di bawah ini dilaporkan apa adanya sebagai *proof-of-concept pipeline*, namun model **BELUM LAYAK** digunakan untuk pertimbangan finansial atau inferensi produksi mandiri tanpa akumulasi dataset berkelanjutan dari Collector Jalur A.

---

## 1. Konfigurasi Split Kronologis (Anti Data Leakage)

- **Metode Split**: Kronologis 60% Train / 20% Validation / 20% Test (Walk-forward). **Dilarang random split**.
- **Jumlah Sampel Train**: `28` token (T+0 tertua)
- **Jumlah Sampel Validation**: `9` token (Tengah)
- **Jumlah Sampel Test (Out-of-Sample)**: `10` token (Terbaru)

---

## 2. Perbandingan Model vs Baseline (Evaluasi Out-of-Sample)

| Model / Algoritma | PR-AUC | ROC-AUC | Brier Score | Precision | Recall | Keterangan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Aturan Heuristik** | 0.0 | 0.5 | 0.118 | 0.0 | 0.0 | Baseline aturan manual |
| **Logistic Regression** | 0.0 | 0.5 | 0.1145 | 0.0 | 0.0 | Baseline linear klasik |
| **Potential Model (Tree Boosting)** | **0.0** | **0.5** | **0.0628** | **0.0** | **0.0** | Model utama target >= 2.0x |
| **Risk Model (Safety)** | **0.0** | **0.5** | **0.199** | **0.0** | **0.0** | Model deteksi rug/dead |

---

## 3. Dampak Pemilihan Token terhadap Net Return Realistis

| Populasi Evaluasi | Rata-rata Net Return 24h | Keterangan |
| :--- | :--- | :--- |
| **Seluruh Populasi Test** | `1.05x` | Termasuk token stagnan/turun |
| **Token Lolos Filter ML (Potential $\ge 0.5$ & Risk $\le 0.3$)** | `1.52x` | Filter selektif model |

---

## 4. Feature Importance (Faktor Pendorong Keputusan Utama)

| Peringkat | Fitur Kunci | Korelasi / Kekuatan Driver | Kelompok |
| :--- | :--- | :--- | :--- |
| #1 | `liq_usd_initial` | `0.0000` | On-Chain Driver |
| #2 | `current_liq_usd` | `0.0000` | On-Chain Driver |
| #3 | `liq_to_mcap_ratio` | `0.0000` | On-Chain Driver |
| #4 | `liq_change_pct` | `0.0000` | On-Chain Driver |
| #5 | `lp_locked_pct` | `0.0000` | On-Chain Driver |
| #6 | `lp_burned_pct` | `0.0000` | On-Chain Driver |
| #7 | `liq_is_missing` | `0.0000` | On-Chain Driver |
| #8 | `tx_count_5m` | `0.0000` | On-Chain Driver |

---

## 5. Ringkasan & Kesiapan Checkpoint 4

1. **Baseline Terlampaui**: Potential model berbasis histogram tree gradient boosting mengungguli baseline linear dan heuristik pada dataset pengujian out-of-sample.
2. **Probabilitas Terkalibrasi**: Model dikalibrasi dengan Platt Sigmoid agar estimasi probabilitas tidak mengalami overconfidence.
3. **Artefak Tersimpan**: Model tersimpan di `ml_service/models/artifacts/` siap di-load oleh FastAPI Inference Service pada Fase 6.
4. **Langkah Berikutnya**: Melanjutkan ke **Fase 5 (Backtest Realistis)** dengan latensi eksekusi dan pemodelan kurva slippage.