# PROMPT V2: Implementasi ML Screening Token DEX (Website Sudah Ada)

> Website dasar **sudah dibuat**. Tugasmu sekarang hanya 4 hal:
>
> 1. **Mengumpulkan data on-chain** untuk training (backfill + collector berjalan terus).
> 2. **Membangun dataset** (label + fitur) tanpa data leakage.
> 3. **Melatih & mengevaluasi model ML** (risk + potential).
> 4. **Mengintegrasikan hasilnya ke website** lewat inference service + API + alert.
>
> Kerjakan per fase, berhenti di setiap checkpoint, tunjukkan hasil nyata (angka, bukan klaim).

---

## 0. ATURAN KERAS

- Ini alat **screening/riset**, bukan saran keuangan. **Tanpa auto-trading**, tanpa private key/seed phrase.
- Secret hanya lewat `.env` (jangan di-commit). Sediakan `.env.example`.
- **Jangan mengarang data.** Bila API tidak tersedia/limit, jelaskan alternatif dan lanjutkan dengan yang ada.
- Jangan ubah struktur website yang sudah ada tanpa alasan. Tambahkan modul ML sebagai layanan terpisah.
- Laporkan hasil model apa adanya, termasuk bila buruk.
- Berikan **kode lengkap siap salin** per file (bukan potongan/diff).

---

## 1. LANGKAH PERTAMA: AUDIT WEBSITE YANG ADA

Sebelum menulis apa pun, pelajari repo website saya:

1. Deteksi stack (framework frontend, backend, database, ORM, cara deploy).
2. Cari tabel/model yang sudah ada terkait token, pair, atau alert.
3. Tentukan cara paling minim-gangguan untuk integrasi:
   - **Default:** layanan Python terpisah (`ml-service/`, FastAPI) + database yang sama (atau skema `ml_*` terpisah).
   - Website membaca hasil lewat REST API / langsung dari tabel `ml_scores`.
4. Ringkas temuanmu dalam ≤ 15 baris dan ajukan **maksimal 3 pertanyaan** (chain prioritas, API key yang saya punya, anggaran RPC). Bila tidak dijawab, pakai default di bawah.

**Default:** chain **Solana** dulu (lalu Base/BSC), Python 3.11+, PostgreSQL + Parquet, LightGBM/XGBoost, Docker Compose.

---

## 3. FASE 1 — MENCARI & MENGUMPULKAN DATA ON-CHAIN (INTI PERMINTAAN)

### 3.0 Prinsip yang WAJIB dipahami agent

1. **Survivorship bias:** endpoint "new pools" hanya menampilkan token yang masih terdaftar. Token rug/mati sering
   hilang. Karena itu data training harus dikumpulkan dengan **dua jalur**:
   - **Jalur A (maju/forward):** collector berjalan terus, menyimpan _snapshot berseri_ tiap token baru sejak T+0.
     Ini data **paling bersih** dan wajib dijalankan sedini mungkin (mulai hari ini).
   - **Jalur B (mundur/backfill):** ambil histori dari sumber on-chain/analitik untuk mempercepat dataset awal.
2. **Leakage keamanan:** hasil GoPlus/RugCheck/Honeypot yang diambil _hari ini_ untuk token bulan lalu mencerminkan
   kondisi **sekarang**, bukan saat T+5m. Maka untuk fitur keamanan, **simpan hasil saat deteksi (forward)**.
   Untuk data backfill, tandai kolom keamanan sebagai `snapshot_time = fetched_at` dan jangan pakai sebagai fitur
   prediksi tanpa menandai asal-usulnya.
3. **Simpan data mentah JSON** setiap respons (tabel `raw_responses`) agar bisa dihitung ulang fiturnya kelak.
4. Catat `fetched_at` UTC pada setiap baris. Hormati rate limit (cache + exponential backoff).

### 3.1 Daftar sumber & perintah contoh

> Endpoint/limit bisa berubah. Agent **wajib memverifikasi ke dokumentasi resmi** sebelum menggunakannya dan
> menuliskan hasilnya di `docs/data_sources.md`.

**A. GeckoTerminal (pool baru + OHLCV historis)** — gratis, rate limit ketat (sekitar puluhan request/menit)

```bash
# Pool baru per jaringan (network id: solana, base, bsc, eth)
curl -s "https://api.geckoterminal.com/api/v2/networks/solana/new_pools?page=1" -H "accept: application/json"

# Trending pools
curl -s "https://api.geckoterminal.com/api/v2/networks/solana/trending_pools"

# Info pool
curl -s "https://api.geckoterminal.com/api/v2/networks/solana/pools/<POOL_ADDRESS>"

# OHLCV menit/jam (timeframe: minute|hour|day, aggregate: 1,5,15 / 1,4,12 / 1)
curl -s "https://api.geckoterminal.com/api/v2/networks/solana/pools/<POOL_ADDRESS>/ohlcv/minute?aggregate=1&limit=1000"

# Trades terbaru pada pool
curl -s "https://api.geckoterminal.com/api/v2/networks/solana/pools/<POOL_ADDRESS>/trades"
```

Untuk OHLCV lebih lama, gunakan parameter `before_timestamp` untuk paginasi mundur.

**B. DexScreener** — profil token terbaru, pair, likuiditas, jumlah buy/sell

```bash
# Detail semua pair dari token
curl -s "https://api.dexscreener.com/latest/dex/tokens/<TOKEN_ADDRESS>"

# Detail pair
curl -s "https://api.dexscreener.com/latest/dex/pairs/solana/<PAIR_ADDRESS>"

# Pencarian
curl -s "https://api.dexscreener.com/latest/dex/search?q=<QUERY>"

# Token profile terbaru (untuk menemukan token baru + link sosial)
curl -s "https://api.dexscreener.com/token-profiles/latest/v1"
```

**C. Keamanan kontrak**

```bash
# GoPlus — EVM (chain_id: 1 eth, 56 bsc, 8453 base)
curl -s "https://api.gopluslabs.io/api/v1/token_security/8453?contract_addresses=<TOKEN_ADDRESS>"

# GoPlus — Solana
curl -s "https://api.gopluslabs.io/api/v1/solana/token_security?contract_addresses=<MINT_ADDRESS>"

# Honeypot.is — simulasi buy/sell (EVM)
curl -s "https://api.honeypot.is/v2/IsHoneypot?address=<TOKEN_ADDRESS>&chainID=56"

# RugCheck — laporan token Solana
curl -s "https://api.rugcheck.xyz/v1/tokens/<MINT_ADDRESS>/report"
```

**D. RPC langsung (holder, deployer, funding wallet)**

```bash
# Solana: top holder suatu mint (RPC standar)
curl -s https://api.mainnet-beta.solana.com -X POST -H "Content-Type: application/json" -d '{
  "jsonrpc":"2.0","id":1,"method":"getTokenLargestAccounts","params":["<MINT_ADDRESS>"]}'

# Solana: supply token
curl -s https://api.mainnet-beta.solana.com -X POST -H "Content-Type: application/json" -d '{
  "jsonrpc":"2.0","id":1,"method":"getTokenSupply","params":["<MINT_ADDRESS>"]}'

# Solana: riwayat transaksi suatu alamat (deployer / pool)
curl -s https://api.mainnet-beta.solana.com -X POST -H "Content-Type: application/json" -d '{
  "jsonrpc":"2.0","id":1,"method":"getSignaturesForAddress","params":["<ADDRESS>",{"limit":100}]}'
```

RPC publik gratis sangat dibatasi; gunakan provider (Helius / QuickNode / Alchemy) via `.env`. Untuk EVM gunakan
`eth_getLogs` (event `PairCreated`, `Transfer`, `Swap`) atau Etherscan-family API (`getsourcecode`, `txlist`, `tokentx`).

**E. Backfill historis dari data publik / analitik (Jalur B)**

- **Dune Analytics** (query SQL, ekspor via API): dataset `dex.trades`, `dex_solana.trades`, `tokens.erc20`.
  Contoh pola query (agent harus menyesuaikan nama tabel setelah mengecek skema Dune terbaru):
  ```sql
  -- token yang pertama kali diperdagangkan dalam 6 bulan terakhir + volume 24 jam pertama
  WITH first_trade AS (
    SELECT token_bought_address AS token, MIN(block_time) AS first_ts
    FROM dex.trades
    WHERE blockchain = 'base' AND block_time > NOW() - INTERVAL '180' DAY
    GROUP BY 1
  )
  SELECT f.token, f.first_ts,
         SUM(t.amount_usd) AS vol_usd_24h,
         COUNT(*) AS tx_24h,
         COUNT(DISTINCT t.taker) AS unique_takers_24h
  FROM first_trade f
  JOIN dex.trades t
    ON t.token_bought_address = f.token
   AND t.block_time BETWEEN f.first_ts AND f.first_ts + INTERVAL '24' HOUR
  GROUP BY 1, 2;
  ```
- **Google BigQuery public crypto datasets** (`bigquery-public-data.crypto_ethereum`, dan dataset chain lain yang
  tersedia): cocok untuk log `Transfer`/`Swap`/`PairCreated` skala besar di EVM.
- **The Graph subgraph** (Uniswap v2/v3, PancakeSwap) via GraphQL untuk `swaps`, `mints`, `burns`, `pairs`.
- **Dataset komunitas** (Kaggle/HuggingFace, repo rug-pull research) sebagai tambahan label `is_rug`; verifikasi
  lisensi dan kualitas sebelum dipakai.

### 3.2 Yang harus dibangun agent

1. `new_pairs_listener.py`: polling GeckoTerminal/DexScreener tiap 30–60 detik, deteksi pair baru, deduplikasi.
2. `snapshot_scheduler.py`: untuk tiap token baru, jadwalkan snapshot di **T+1m, 5m, 15m, 30m, 60m, 6h, 24h**:
   harga, likuiditas, volume, buys/sells, holder, top-10%, status keamanan. Simpan tiap snapshot sebagai baris baru.
3. `backfill.py`: ambil OHLCV + trades historis untuk pool dari daftar yang ditemukan (Dune/BigQuery/Graph),
   dengan checkpoint (bisa dilanjutkan bila terhenti).
4. Tabel inti: `tokens`, `pairs`, `snapshots`, `security_checks`, `holders_snapshot`, `deployers`, `raw_responses`,
   `labels`, `features`, `ml_scores`.
5. Laporan kualitas data (`reports/data_quality.md`): jumlah token per chain/bulan, % missing per kolom,
   distribusi umur, jumlah token yang sudah memiliki snapshot lengkap sampai T+24h.

**Target minimum:** ≥ 3.000 token berlabel lengkap untuk percobaan awal (idealnya ≥ 10.000). Bila belum cukup,
agent harus **mengatakan terus terang** bahwa model belum layak dipercaya dan menyarankan menunggu collector.

**Checkpoint 1:** skema DB + collector jalan + laporan kualitas data + test collector (mock respons).

---

## 4. FASE 2 — LABELING

Label **multi-target** (config di `configs/config.yaml`, semua threshold bisa diubah):

| Label            | Definisi default                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------- |
| `is_honeypot`    | Simulasi jual gagal atau sell tax > 50%                                                  |
| `is_rug`         | Likuiditas turun > 80% dalam 24 jam, atau deployer menarik LP / menjual mayoritas supply |
| `is_dead`        | Harga turun > 90% dari puncak dalam 6 jam dan volume hampir nol                          |
| `entry_price`    | Harga pada **T+5m atau T+15m** (bukan harga peluncuran)                                  |
| `max_return_24h` | Harga tertinggi 24 jam / `entry_price`                                                   |
| `net_return_24h` | Return realistis setelah slippage (dari kurva likuiditas), fee, dan tax                  |
| `success`        | `net_return_24h >= 2x` **dan** bukan rug/honeypot                                        |

Kewajiban:

- Laporkan distribusi label dan _class imbalance_.
- Analisis sensitivitas threshold (2x vs 3x vs 5x).
- Verifikasi manual 20 token acak (tampilkan tabel) sebelum lanjut.

**Checkpoint 2:** distribusi label + 20 contoh terverifikasi.

---

## 5. FASE 3 — FEATURE ENGINEERING (POINT-IN-TIME)

Setiap fitur hanya boleh memakai data dengan `timestamp <= t_prediksi`. Buat **test otomatis anti-leakage**
(mis. ubah data setelah `t` dan pastikan fitur tidak berubah).

Kelompok fitur:

1. **Likuiditas:** `liq_usd_initial`, `liq_to_mcap_ratio`, `liq_change_pct`, `lp_locked_pct`, `lp_burned_pct`.
2. **Transaksi:** `buy_sell_volume_ratio`, `unique_buyers`, `unique_sellers`, `buyers_to_sellers_ratio`,
   `tx_count_{5m,15m,60m}`, `avg_trade_size_usd`, `price_change_{5m,15m,60m}`, `volatility`, `max_drawdown_so_far`.
3. **Keamanan:** `is_mintable`, `is_renounced`, `buy_tax`, `sell_tax`, `has_blacklist`, `is_proxy`,
   `mint_authority_enabled`, `freeze_authority_enabled`, `honeypot_sim_pass`.
4. **Holder:** `top1_pct`, `top10_pct`, `top10_excl_lp_pct`, `holder_count`, `holder_growth_rate`,
   `same_funder_wallets_pct`, `sniper_wallet_pct`.
5. **Deployer:** `deployer_age_days`, `deployer_prev_tokens`, `deployer_prev_rug_rate`.
6. **Waktu:** `secs_deploy_to_liquidity`, `hour_utc`, `day_of_week`.
7. **Sosial (opsional):** `has_website`, `has_twitter`, `has_telegram`, `name_similarity_to_top_tokens`.

Aturan: simpan `feature_version`, tambahkan flag `_is_missing` (jangan asal isi 0), simpan ke Parquet.

**Checkpoint 3:** daftar fitur + statistik + test anti-leakage lulus.

---

## 6. FASE 4 — PELATIHAN MODEL

1. **Split kronologis** (mis. 60/20/20 berdasarkan waktu deteksi token). **Dilarang random split.**
   Gunakan purged walk-forward CV; token yang sama tidak boleh ada di dua split.
2. **Baseline:** Logistic Regression + aturan heuristik sederhana. Model ML harus mengalahkan baseline ini.
3. **Model utama:** LightGBM & XGBoost, tuning Optuna. Tangani imbalance dengan class weight/`scale_pos_weight`.
   Latih **dua model**: `risk_model` (rug/honeypot/dead) dan `potential_model` (`success`).
4. **Anomaly detection:** IsolationForest/Autoencoder pada fitur transaksi + holder sebagai lapisan tambahan.
5. **Kalibrasi** probabilitas (isotonic/Platt) agar skor 0.8 benar-benar ~80%.
6. **Opsional:** LSTM/1D-CNN pada deret harga-volume per menit, hanya bila terbukti meningkatkan metrik.
7. **Metrik wajib:** PR-AUC, ROC-AUC, Precision@K, Recall pada threshold, Brier score, kurva kalibrasi,
   rata-rata `net_return` token yang lolos filter vs seluruh populasi. **Bukan hanya accuracy.**
8. **Interpretabilitas:** SHAP global dan per token.
9. Simpan model + metadata (versi fitur, tanggal data, metrik) di `models/` atau MLflow.

Keluaran: `reports/model_eval.md` (tabel metrik, kurva, feature importance, analisis kegagalan).

**Checkpoint 4:** model terlatih + laporan evaluasi jujur.

---

## 7. FASE 5 — BACKTEST REALISTIS

- Entry dengan latensi (30–120 detik), bukan harga ideal.
- Hitung slippage dari likuiditas, fee DEX, gas/priority fee, tax.
- Ukuran posisi kecil dan dibatasi % likuiditas pool.
- Aturan keluar: take-profit / stop-loss / time-stop; bandingkan strategi.
- Laporkan: win rate, expectancy, max drawdown, distribusi return (median, persentil), hasil per bulan & per chain,
  serta perbandingan dengan **baseline acak** dan baseline heuristik.
- Pastikan token rug/mati ikut dalam evaluasi.

**Checkpoint 5:** backtest valid hanya bila unggul pada periode **out-of-sample**. Jika tidak, katakan dengan jelas.

---

## 8. FASE 6 — INFERENCE SERVICE & INTEGRASI KE WEBSITE

1. **Hard rules dulu** sebelum ML: honeypot gagal, mint/freeze authority aktif, sell tax > batas, LP tidak terkunci
   dengan top1 > batas → langsung ditolak.
2. `scorer.py`: ambil snapshot T+5m / T+15m → bangun fitur → hitung `risk_score`, `potential_score`, `anomaly_score`
   → simpan ke `ml_scores` beserta alasan utama (SHAP top 3) dan `model_version`.
3. **API (FastAPI)**, contoh endpoint:
   - `GET /health`
   - `GET /tokens/screened?chain=&min_potential=&max_risk=&limit=`
   - `GET /tokens/{address}/score`
   - `GET /models/current` (versi, tanggal latih, metrik)
   - `POST /rescore/{address}` (butuh auth)
4. **Integrasi website:** tambahkan halaman/komponen sesuai stack yang ditemukan pada audit (tabel token
   ter-screening, detail token dengan skor + alasan SHAP, badge risiko, filter chain, auto-refresh/SSE).
5. **Alert** Telegram/Discord bila `risk_score <= 0.2` dan `potential_score >= 0.8` (konfigurabel),
   dengan deduplikasi, rate limit, dan disclaimer "bukan saran keuangan".
6. Setiap keputusan dicatat; 1 jam & 24 jam kemudian catat hasil aktual untuk **feedback loop** pelabelan.

**Checkpoint 6:** demo end-to-end: pair baru terdeteksi → skor muncul di website → alert terkirim.

---

## 9. FASE 7 — MONITORING & RETRAINING

- Drift fitur & skor (PSI/KS), alarm kualitas data (API gagal, missing melonjak).
- Precision@K live mingguan vs hasil aktual.
- Retraining terjadwal (mingguan/bulanan), model baru dipromosikan hanya bila menang pada validasi terbaru
  (champion–challenger).
- Dashboard ringkas (jumlah token dipindai, alert, distribusi skor, hit rate).

---

## 10. KUALITAS KODE

Type hints, `ruff` + `black` + `mypy`, pre-commit; unit test (collector mock, labeling, fitur, scorer, anti-leakage);
logging JSON dengan correlation id per token; tanpa angka ajaib (semua di YAML); `README.md` berisi
cara setup, cara menjalankan tiap fase, dan contoh output; `docs/risks.md` berisi daftar risiko & mitigasi.

---

## 11. URUTAN KERJA YANG DIMINTA

1. Audit repo website → ringkasan + maks. 3 pertanyaan.
2. **Jalankan Jalur A (collector maju) secepat mungkin**, karena dataset bersih butuh waktu mengumpul.
3. Backfill (Jalur B) paralel → labeling → fitur → training → backtest → integrasi → monitoring.
4. Setelah tiap fase: ringkasan hasil, angka metrik, masalah yang ditemukan, lalu **tunggu persetujuan saya**.
5. Bila data belum cukup untuk melatih model yang layak, **hentikan dan katakan terus terang** —
   jangan memaksakan model yang tidak bisa dipercaya.
