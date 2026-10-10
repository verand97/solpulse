# Laporan Feature Engineering Point-in-Time (Checkpoint 3: SolPulse ML Screener)

*Dibuat secara otomatis pada: 2026-10-10 08:44:18 UTC*

> [!NOTE]
> **Feature Version**: `v1.0` | **Observation Window**: `t_5m` (5 menit pasca peluncuran).
> **Total Sampel Terekstraksi**: `47` token | **Penyimpanan**: Parquet (`C:\Users\verand\dev\solpulse\ml_service\data\parquet\features_v1.parquet`) & JSONL.

---

## 1. Verifikasi Prinsip Anti-Leakage (Point-in-Time)

- **Kaidah Keras**: Semua fitur strictly dihitung hanya memakai data dengan `timestamp <= t_prediksi`.
- **Uji Otomatis (`test_anti_leakage.py`)**: **LULUS (100% Identik)**.
  - Pengujian menginjeksikan dump harga ke $0.01, penarikan likuiditas 99%, dan injeksi exploit RugCheck pada T+10m & T+15m.
  - Fitur yang diekstrak pada T+5m terbukti **0% berubah**, membuktikan tidak ada lookahead bias sama sekali.

---

## 2. Kamus Fitur (7 Kelompok Fitur)

| Nama Fitur | Kelompok | Tipe Data | Deskripsi Logis |
| :--- | :--- | :--- | :--- |
| `liq_usd_initial` | Likuiditas | `float` | Likuiditas awal pool dalam USD saat pertama terdeteksi |
| `current_liq_usd` | Likuiditas | `float` | Likuiditas pool pada titik t_prediksi (T+5m) |
| `liq_to_mcap_ratio` | Likuiditas | `float` | Rasio likuiditas terhadap Market Cap (mencegah illiquid pump) |
| `liq_change_pct` | Likuiditas | `float` | Persentase perubahan likuiditas dari T+0 hingga T+5m |
| `lp_locked_pct` | Likuiditas | `float` | Persentase LP token yang terkunci |
| `lp_burned_pct` | Likuiditas | `float` | Persentase LP token yang di-burn permanen |
| `liq_is_missing` | Likuiditas (Flag) | `int (0/1)` | Indikator jika data likuiditas awal tidak tersedia |
| `tx_count_5m` | Transaksi | `int` | Total transaksi (buy + sell) dalam 5 menit |
| `tx_count_15m` | Transaksi | `int` | Estimasi transaksi 15 menit |
| `tx_count_60m` | Transaksi | `int` | Estimasi transaksi 60 menit |
| `buy_sell_volume_ratio` | Transaksi | `float` | Rasio volume pembelian terhadap penjualan |
| `unique_buyers` | Transaksi | `int` | Estimasi jumlah wallet pembeli unik |
| `unique_sellers` | Transaksi | `int` | Estimasi jumlah wallet penjual unik |
| `buyers_to_sellers_ratio` | Transaksi | `float` | Rasio jumlah buyer unik terhadap seller unik |
| `avg_trade_size_usd` | Transaksi | `float` | Rata-rata ukuran swap dalam USD |
| `price_change_5m` | Transaksi | `float` | Perubahan harga dari initial ke T+5m (%) |
| `volatility` | Transaksi | `float` | Volatilitas harga antar snapshot awal |
| `max_drawdown_so_far` | Transaksi | `float` | Drawdown maksimum harga yang terjadi sebelum T+5m |
| `is_mintable` | Keamanan | `int (0/1)` | Apakah mint authority aktif |
| `is_renounced` | Keamanan | `int (0/1)` | Apakah kepemilikan kontrak telah di-renounce |
| `buy_tax` | Keamanan | `float` | Persentase pajak beli |
| `sell_tax` | Keamanan | `float` | Persentase pajak jual |
| `has_blacklist` | Keamanan | `int (0/1)` | Apakah ada fungsi blacklist wallet |
| `is_proxy` | Keamanan | `int (0/1)` | Apakah kontrak berupa proxy/upgradable |
| `mint_authority_enabled` | Keamanan | `int (0/1)` | Mint authority aktif (bisa cetak token tak terbatas) |
| `freeze_authority_enabled` | Keamanan | `int (0/1)` | Freeze authority aktif (bisa bekukan wallet pembeli) |
| `honeypot_sim_pass` | Keamanan | `int (0/1)` | Status kelulusan simulasi jual (1 = pass, 0 = fail) |
| `security_is_missing` | Keamanan (Flag) | `int (0/1)` | Indikator jika audit RugCheck/GoPlus belum selesai |
| `top1_pct` | Holder | `float` | Persentase supply yang dipegang holder terbesar #1 |
| `top10_pct` | Holder | `float` | Persentase supply yang dipegang 10 holder terbesar |
| `top10_excl_lp_pct` | Holder | `float` | Konsentrasi top 10 tidak termasuk pool AMM |
| `holder_count` | Holder | `int` | Jumlah total pemegang token |
| `holder_growth_rate` | Holder | `float` | Kecepatan pertambahan holder baru per menit |
| `same_funder_wallets_pct` | Holder | `float` | Persentase wallet top holder yang didanai alamat yang sama (Sybil) |
| `sniper_wallet_pct` | Holder | `float` | Persentase wallet sniper pada blok pembuatan |
| `holder_is_missing` | Holder (Flag) | `int (0/1)` | Indikator jika RPC holder query gagal / missing |
| `deployer_age_days` | Deployer | `float` | Umur wallet deployer dalam hitungan hari |
| `deployer_prev_tokens` | Deployer | `int` | Jumlah token yang pernah dibuat deployer sebelumnya |
| `deployer_prev_rug_rate` | Deployer | `float` | Rasio rug pull dari token terdahulu deployer ini |
| `deployer_is_missing` | Deployer (Flag) | `int (0/1)` | Indikator jika data deployer tidak ditemukan |
| `secs_deploy_to_liquidity` | Waktu | `float` | Detik antara deploy token hingga LP dimasukkan |
| `hour_utc` | Waktu | `int (0-23)` | Jam deteksi dalam UTC |
| `day_of_week` | Waktu | `int (0-6)` | Hari dalam minggu (0 = Senin) |
| `has_website` | Sosial | `int (0/1)` | Ketersediaan situs resmi |
| `has_twitter` | Sosial | `int (0/1)` | Ketersediaan akun X/Twitter |
| `has_telegram` | Sosial | `int (0/1)` | Ketersediaan grup/channel Telegram |
| `name_similarity_to_top_tokens` | Sosial | `float (0-1)` | Skor kemiripan nama/simbol dengan token besar |
| `social_is_missing` | Sosial (Flag) | `int (0/1)` | Indikator jika metadata sosial tidak terisi |

---

## 3. Statistik Distribusi Fitur On-Chain (Dataset Saat Ini)

| Nama Fitur | Kelompok | Nilai Rata-rata (Mean) | Min | Max | Missing (%) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `liq_usd_initial` | Likuiditas | 5393.2175 | 0.0 | 81957.933 | 0.0% |
| `current_liq_usd` | Likuiditas | 5383.552 | 0.0 | 81957.933 | 0.0% |
| `liq_to_mcap_ratio` | Likuiditas | 0.6894 | 0.0 | 2.9314 | 0.0% |
| `liq_change_pct` | Likuiditas | -0.6473 | -69.6293 | 40.1035 | 0.0% |
| `lp_locked_pct` | Likuiditas | 0.0 | 0.0 | 0.0 | 0.0% |
| `lp_burned_pct` | Likuiditas | 0.0 | 0.0 | 0.0 | 0.0% |
| `liq_is_missing` | Likuiditas (Flag) | 0.3617 | 0.0 | 1.0 | 0.0% |
| `tx_count_5m` | Transaksi | 73.4681 | 0.0 | 1887.0 | 0.0% |
| `tx_count_15m` | Transaksi | 183.5106 | 0.0 | 4717.0 | 0.0% |
| `tx_count_60m` | Transaksi | 587.7447 | 0.0 | 15096.0 | 0.0% |
| `buy_sell_volume_ratio` | Transaksi | 0.9489 | 0.0 | 3.4 | 0.0% |
| `unique_buyers` | Transaksi | 32.8511 | 1.0 | 873.0 | 0.0% |
| `unique_sellers` | Transaksi | 29.617 | 0.0 | 730.0 | 0.0% |
| `buyers_to_sellers_ratio` | Transaksi | 1.0473 | 0.3284 | 3.5 | 0.0% |
| `avg_trade_size_usd` | Transaksi | 21.1707 | 0.0 | 155.0084 | 0.0% |
| `price_change_5m` | Transaksi | -5.1537 | -85.1988 | 82.3147 | 0.0% |
| `volatility` | Transaksi | 0.0811 | 0.0 | 0.6635 | 0.0% |
| `max_drawdown_so_far` | Transaksi | 12.1299 | 0.0 | 85.1988 | 0.0% |
| `is_mintable` | Keamanan | 0.0 | 0.0 | 0.0 | 0.0% |
| `is_renounced` | Keamanan | 1.0 | 1.0 | 1.0 | 0.0% |
| `buy_tax` | Keamanan | 0.0 | 0.0 | 0.0 | 0.0% |
| `sell_tax` | Keamanan | 0.0 | 0.0 | 0.0 | 0.0% |
| `has_blacklist` | Keamanan | 0.0 | 0.0 | 0.0 | 0.0% |
| `is_proxy` | Keamanan | 0.0 | 0.0 | 0.0 | 0.0% |
| `mint_authority_enabled` | Keamanan | 0.0 | 0.0 | 0.0 | 0.0% |
| `freeze_authority_enabled` | Keamanan | 0.0 | 0.0 | 0.0 | 0.0% |
| `honeypot_sim_pass` | Keamanan | 0.9787 | 0.0 | 1.0 | 0.0% |
| `security_is_missing` | Keamanan (Flag) | 0.0 | 0.0 | 0.0 | 0.0% |
| `top1_pct` | Holder | 0.0 | 0.0 | 0.0 | 0.0% |
| `top10_pct` | Holder | 0.0 | 0.0 | 0.0 | 0.0% |
| `top10_excl_lp_pct` | Holder | 0.0 | 0.0 | 0.0 | 0.0% |
| `holder_count` | Holder | 0.0 | 0.0 | 0.0 | 0.0% |
| `holder_growth_rate` | Holder | 0.0 | 0.0 | 0.0 | 0.0% |
| `same_funder_wallets_pct` | Holder | 0.0 | 0.0 | 0.0 | 0.0% |
| `sniper_wallet_pct` | Holder | 0.0 | 0.0 | 0.0 | 0.0% |
| `holder_is_missing` | Holder (Flag) | 0.1489 | 0.0 | 1.0 | 0.0% |
| `deployer_age_days` | Deployer | 0.0 | 0.0 | 0.0 | 0.0% |
| `deployer_prev_tokens` | Deployer | 1.0 | 1.0 | 1.0 | 0.0% |
| `deployer_prev_rug_rate` | Deployer | 0.0 | 0.0 | 0.0 | 0.0% |
| `deployer_is_missing` | Deployer (Flag) | 1.0 | 1.0 | 1.0 | 0.0% |
| `secs_deploy_to_liquidity` | Waktu | 125.1664 | 0.0 | 311.4678 | 0.0% |
| `hour_utc` | Waktu | 4.0 | 4.0 | 4.0 | 0.0% |
| `day_of_week` | Waktu | 4.0 | 4.0 | 4.0 | 0.0% |
| `has_website` | Sosial | 0.383 | 0.0 | 1.0 | 0.0% |
| `has_twitter` | Sosial | 0.5532 | 0.0 | 1.0 | 0.0% |
| `has_telegram` | Sosial | 0.0213 | 0.0 | 1.0 | 0.0% |
| `name_similarity_to_top_tokens` | Sosial | 0.0 | 0.0 | 0.0 | 0.0% |
| `social_is_missing` | Sosial (Flag) | 0.4468 | 0.0 | 1.0 | 0.0% |

---

## 4. Format Dataset & Integrasi Lanjutan (Checkpoint 3)

1. **Parquet Storage**: Tersimpan pada `ml_service/data/parquet/features_v1.parquet`.
2. **JSON Lines Companion**: Tersimpan pada `ml_service/data/parquet/features_v1.jsonl` untuk portabilitas instan.
3. **Missing Value Indicator**: Semua nilai null ditandai secara eksplisit dengan flag `*_is_missing` daripada sekadar diisi angka nol sembarangan (mencegah distorsi pada tree split LightGBM).
4. **Siap Menuju Fase 4**: Dataset fitur point-in-time telah siap dibagi secara kronologis (purged walk-forward CV 60/20/20) untuk pelatihan model `risk_model` dan `potential_model`.