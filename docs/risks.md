# Analisis Risiko & Mitigasi (Risk Management Plan)

Dokumen ini memetakan seluruh potensi risiko operasional, model, dan pasar yang dihadapi sistem **SolPulse DEX ML Screener**, beserta langkah mitigasi preventif dan reaktif yang telah diimplementasikan dalam arsitektur sistem.

---

## 1. Risiko Operasional (Operational Risks)

| Kategori Risiko | Deskripsi Potensi Dampak | Tingkat Risiko | Mekanisme Mitigasi yang Diimplementasikan |
| :--- | :--- | :---: | :--- |
| **API Rate Limiting** | Pemblokiran IP / status HTTP 429 dari DexScreener, RugCheck, atau Solana Public RPC saat volume token melonjak. | **Medium** | • Token-bucket rate limiter dengan jeda minimum 1.5 detik antar request.<br>• Exponential backoff dengan jitter acak pada kegagalan.<br>• Dual-tier caching (raw response table di SQLite) untuk mencegah fetch berulang. |
| **Node / RPC Outage** | RPC Solana public mengalami desinkronisasi slot atau downtime sesaat. | **Medium** | • Multi-endpoint failover pool (`api.mainnet-beta.solana.com`, `solana-rpc`, fallback mirror).<br>• Asinkronisasi forward collector via Celery/Background task tanpa blocking UI. |
| **Database Lock Concurrency** | SQLite file lock contention saat forward listener menulis snapshot bersamaan dengan query pembacaan FastAPI. | **Low** | • SQLite connection pooling dengan `timeout=30.0s`.<br>• Write-Ahead Logging (`WAL` mode) diaktifkan.<br>• Pemisahan tabel analitik berat ke format columnar Parquet. |
| **Credential / Key Exposure** | Bocornya API token atau credentials bot Telegram/Discord. | **Critical** | • Seluruh secret hanya dimuat via `.env` (terdaftar di `.gitignore`).<br>• Sistem tidak menyimpan atau meminta private key / wallet seed phrase apa pun. |

---

## 2. Risiko Model & Data (Model & Machine Learning Risks)

| Kategori Risiko | Deskripsi Potensi Dampak | Tingkat Risiko | Mekanisme Mitigasi yang Diimplementasikan |
| :--- | :--- | :---: | :--- |
| **Lookahead Bias / Temporal Leakage** | Fitur pada $T+5m$ secara tidak sengaja menggunakan data transaksi di masa depan ($T+24h$). | **Critical** | • Enforced point-in-time filtering: `timestamp <= t_prediction_iso` di seluruh query fitur.<br>• Suite uji otomatis `test_anti_leakage.py` memvalidasi feature invariance dari intervensi future snapshot. |
| **Concept & Distribution Drift** | Pola meme token bergeser (misal: peluncuran model bonding curve baru, tren bot sniper baru) sehingga performa model menurun. | **High** | • **DriftDetector** (`drift_detector.py`) menghitung Population Stability Index (PSI) dan Kolmogorov-Smirnov test.<br>• Trigger otomatis: jika $\text{PSI} \ge 0.25$ pada 2 fitur utama, sistem memicu retrain gate. |
| **Class Imbalance & Small-sample Overfitting** | Token sukses ($\ge 2x$) hanya merepresentasikan minoritas kecil ($<15\%$). Model naif bisa overfit pada noise. | **High** | • Evaluasi metrik berfokus pada **PR-AUC** (Precision-Recall AUC) dan **Brier Score**, bukan sekadar akurasi.<br>• Kalibrasi probabilitas Platt Sigmoid (`CalibratedClassifierCV`) untuk menekan overconfidence.<br>• Walk-forward validation (60% Train / 20% Val / 20% Test) tanpa random shuffle. |
| **Cold Start / Unlabeled Tokens** | Pasangan token baru yang baru dibuat $< 5$ menit belum memiliki snapshot time-series historis. | **Medium** | • Arsitektur fallback dua tahap: Tahap 1 mengeksekusi Hard Safety Rules (audit instan kontrak) sebelum kalkulasi ML.<br>• Imputasi nilai default median dengan flag `_is_missing` eksplisit. |

---

## 3. Risiko Pasar & Eksekusi DEX (Market & Execution Risks)

| Kategori Risiko | Deskripsi Potensi Dampak | Tingkat Risiko | Mekanisme Mitigasi yang Diimplementasikan |
| :--- | :--- | :---: | :--- |
| **Extreme Slippage & Low Liquidity** | Pada pool dengan likuiditas tipis ($< \$10,000$), pesanan pembelian/penjualan memicu slippage harga besar. | **High** | • Engine backtesting memodelkan kurva slippage non-linear realistis: $\text{Slippage} = \text{base} \times (1 + \frac{\text{OrderSize}}{\text{Liquidity}})^{1.5}$.<br>• Filter keamanan memblokir token dengan likuiditas di bawah batas aman. |
| **MEV Frontrunning & Sandwich Attacks** | Bot validator/arbitrase menyisipkan transaksi sebelum dan sesudah swap trader. | **High** | • Backtester menyertakan penundaan eksekusi $45$ detik (latensi konfirmasi blok) dan penalti swap 1.0% - 2.5%.<br>• Rule engine menolak token dengan sell tax $> 15\%$. |
| **Instant Rug Pull / Mint Dumping** | Developer mencetak suplai token baru atau menarik likuiditas seketika. | **Critical** | • Tahap 1 Hard Rules secara deterministik memverifikasi `mint_authority == null` dan `freeze_authority == null`. Token yang melanggar ditolak seketika (`REJECT_UNSAFE`) tanpa kompromi. |

---

## 4. Batasan Hukum & Disclaimer Regulasi (Compliance Disclaimer)

1. **Alat Riset & Penyaringan Semata**: SolPulse ML Screener dikembangkan secara ketat sebagai instrumen visualisasi, penyaringan kuantitatif, dan riset data on-chain.
2. **Tanpa Eksekusi Otomatis**: Sistem tidak memegang otoritas manajemen dana, tidak melakukan auto-trading mandiri, dan tidak pernah menyimpan atau meminta private key pengguna.
3. **Bukan Rekomendasi Finansial**: Skor potensi dan estimasi probabilitas yang dihasilkan adalah estimasi statistik historis dan tidak menjamin imbal hasil di masa depan. Seluruh pengguna wajib melakukan verifikasi independen (DYOR - *Do Your Own Research*).
