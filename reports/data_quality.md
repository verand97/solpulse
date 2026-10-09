# Laporan Kualitas Data On-Chain (SolPulse ML Screener)

*Dibuat secara otomatis pada: 2026-10-09 04:37:26 UTC*

> [!IMPORTANT]
> **Status Kesiapan Data Model**: Target minimum adalah **>= 3.000 token berlabel lengkap** (ideal >= 10.000). Saat ini database baru mengumpulkan **47 token** (0 memiliki snapshot T+24h). Sesuai aturan keras nomor 0 & 3.2, model **belum layak dipercaya** untuk inferensi produksi dengan data parsial ini. Collector Jalur A wajib terus berjalan di background sementara backfill Jalur B dijalankan secara paralel.

---

## 1. Ringkasan Populasi Token

- **Total Token Terdeteksi**: `47`
- **Total Snapshot Deret Waktu**: `100`
- **Total Audit Keamanan (RugCheck/GoPlus)**: `60`
- **Total Audit Holder On-Chain**: `60`
- **Total Respons Mentah Tersimpan (`raw_responses`)**: `100`

### Distribusi Berdasarkan Chain
| Chain | Jumlah Token | Persentase |
| :--- | :--- | :--- |
| `solana` | 47 | 100.0% |

### Distribusi Berdasarkan Bulan Deteksi
| Periode (YYYY-MM) | Jumlah Token Baru |
| :--- | :--- |
| `2026-10` | 47 |

---

## 2. Kelengkapan Deret Waktu Snapshot (Jalur A & B)

| Interval Snapshot | Definisi Waktu | Token dengan Data | Kelengkapan (% dari total) |
| :--- | :--- | :--- | :--- |
| `t_0` | Deteksi awal (T+0s) | 47 | 100.0% |
| `t_1m` | 60 detik setelah deteksi | 40 | 85.1% |
| `t_5m` | 5 menit setelah deteksi (Entry Target) | 13 | 27.7% |
| `t_15m` | 15 menit setelah deteksi | 0 | 0.0% |
| `t_30m` | 30 menit setelah deteksi | 0 | 0.0% |
| `t_60m` | 1 jam setelah deteksi | 0 | 0.0% |
| `t_6h` | 6 jam setelah deteksi | 0 | 0.0% |
| `t_24h` | 24 jam setelah deteksi (Evaluasi Label Final) | 0 | 0.0% |

---

## 3. Analisis Missing Values per Kolom Kunci

| Kolom | Tabel | Missing Count | Missing Percentage | Dampak Fitur |
| :--- | :--- | :--- | :--- | :--- |
| `initial_price_usd` | `tokens` | 2 | 4.26% | Perhitungan baseline return |
| `initial_liquidity_usd` | `tokens` | 17 | 36.17% | Filter likuiditas awal & rasio mcap |
| `symbol` | `tokens` | 0 | 0.00% | Tampilan antarmuka & pencarian |

---

## 4. Rekomendasi Langkah Selanjutnya (Checkpoint 1)

1. Biarkan **Jalur A (Forward Collector)** terus beroperasi sebagai background daemon agar mengumpulkan token T+0 s/d T+24h asli tanpa survivorship bias.
2. Eksekusi **Jalur B (Historical Backfill)** untuk mengisi dataset awal hingga melampaui batas ambang 3.000 token sebelum pelatihan model (Fase 4).
3. Lanjutkan ke verifikasi skema Labeling Multi-target (Fase 2) dan Point-in-time Feature Engineering (Fase 3).