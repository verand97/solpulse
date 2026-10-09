# Verifikasi & Spesifikasi Sumber Data On-Chain DEX

Dokumen ini mencatat verifikasi resmi endpoint, rate limits, skema respons, dan strategi caching untuk modul collector SolPulse ML Screener.

---

## 1. GeckoTerminal API

- **Dokumentasi Resmi**: [GeckoTerminal API Docs](https://www.geckoterminal.com/dex-api)
- **Base URL**: `https://api.geckoterminal.com/api/v2`
- **Rate Limit**: ~30 request / menit (Free Tier). Wajib memakai delay dan exponential backoff.
- **Header**: `Accept: application/json`

### Endpoint Utama
| Endpoint | Keterangan | Penggunaan di SolPulse |
| :--- | :--- | :--- |
| `GET /networks/{network}/new_pools?page=1` | Daftar pool yang baru dibuat per chain (`solana`, `base`, `bsc`) | Forward detection (T+0) |
| `GET /networks/{network}/trending_pools` | Daftar pool yang sedang trending | Feature benchmark / volume validation |
| `GET /networks/{network}/pools/{pool_address}` | Metadata pool lengkap, likuiditas USD, reserve base/quote | Snapshot Likuiditas T+1m s/d T+24h |
| `GET /networks/{network}/pools/{pool_address}/ohlcv/{timeframe}` | OHLCV bars (`minute`, `hour`, `day`). Parameter: `aggregate` (1, 5, 15), `limit` (max 1000), `before_timestamp` | Backfill & perhitungan return / volatilitas |
| `GET /networks/{network}/pools/{pool_address}/trades` | Transaksi swap terbaru | Menghitung buy/sell count, unique traders |

---

## 2. DexScreener API

- **Dokumentasi Resmi**: [DexScreener API Docs](https://docs.dexscreener.com/api/reference)
- **Base URL**: `https://api.dexscreener.com`
- **Rate Limit**: ~300 request / menit (sangat toleran, namun disarankan max 5 req/sec).

### Endpoint Utama
| Endpoint | Keterangan | Penggunaan di SolPulse |
| :--- | :--- | :--- |
| `GET /token-profiles/latest/v1` | Profil token baru yang diunggah (ikon, deskripsi, sosial media) | Deteksi dini token baru + fitur sosial |
| `GET /latest/dex/tokens/{token_addresses}` | Detail pair multi-token (hingga 30 address dipisah koma) | Bulk enrichment harga, likuiditas, txns, volume |
| `GET /latest/dex/pairs/{chainId}/{pairAddress}` | Detail pair spesifik | Snapshot metrik pair |
| `GET /latest/dex/search?q={query}` | Pencarian token / pair berdasarkan nama atau simbol | Pencarian historis |

---

## 3. Keamanan Kontrak (Contract Security)

### A. RugCheck (Solana)
- **Base URL**: `https://api.rugcheck.xyz`
- **Endpoint**:
  - `GET /v1/tokens/{mint_address}/report/summary` — Ringkasan risiko bahaya (`danger` risks, skor keamanan keseluruhan)
  - `GET /v1/tokens/{mint_address}/report` — Laporan detail kepemilikan LP, mint authority, freeze authority, top holders, mutability.
- **Prinsip Anti-Leakage**: Hasil RugCheck harus disimpan dengan timestamp saat pemanggilan (`fetched_at`). Untuk forward detection, dicatat saat T+1m / T+5m. Untuk backfill, tidak boleh dijadikan fitur prediksi t_0 tanpa penandaan snapshot_time.

### B. GoPlus Security (EVM & Solana)
- **Base URL**: `https://api.gopluslabs.io`
- **Endpoint Solana**: `GET /api/v1/solana/token_security?contract_addresses={mint}`
- **Endpoint Base/BSC/ETH**: `GET /api/v1/token_security/{chain_id}?contract_addresses={address}`
  - Chain ID: `8453` (Base), `56` (BSC), `1` (Ethereum).
- **Deteksi Kunci**: `is_mintable`, `is_honeypot`, `buy_tax`, `sell_tax`, `cannot_sell_all`, `hidden_owner`.

### C. Honeypot.is (EVM)
- **Base URL**: `https://api.honeypot.is`
- **Endpoint**: `GET /v2/IsHoneypot?address={token_address}&chainID={chain_id}`
- **Fungsi**: Simulasi buy dan sell secara real-time on-chain untuk mendeteksi jebakan honeypot, token blacklist, dan estimasi slippage realistis.

---

## 4. Solana RPC Langsung

- **Endpoint Default**: `https://api.mainnet-beta.solana.com` (disarankan menggunakan Helius / QuickNode / Alchemy pada produksi via `.env`).
- **Rate Limit Public**: ~40 request / 10 detik.

### Metrik yang Diekstrak
1. `getTokenSupply`: Menghitung total dan circulating supply.
2. `getTokenLargestAccounts`: Mengambil 20 akun pemegang token terbesar untuk menghitung `top1_pct`, `top10_pct`, dan konsentrasi wallet.
3. `getSignaturesForAddress`: Mengambil histori transaksi awal deployer/mint untuk mendeteksi waktu deploy vs waktu penyuntikan likuiditas (`secs_deploy_to_liquidity`).

---

## 5. Sumber Backfill Historis (Jalur B)

1. **Dune Analytics**: Query tabel `dex_solana.trades` dan `dex.trades` untuk mengekstrak token yang lahir dalam 6 bulan terakhir, volume 24 jam pertama, dan return riil.
2. **GeckoTerminal Historical OHLCV**: Paginasi mundur dengan `before_timestamp` untuk membentuk snapshot deret waktu harga pada interval T+1m, T+5m, T+15m, T+30m, T+60m, T+6h, T+24h.
3. **Dataset Komunitas & Repositori Rug Pull**: Label tambahan untuk verifikasi ground truth `is_rug` dan `is_honeypot`.
