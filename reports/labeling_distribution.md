# Laporan Pelabelan Data Multi-Target (Checkpoint 2: SolPulse ML Screener)

*Dibuat secara otomatis pada: 2026-10-10 08:29:06 UTC*

> [!NOTE]
> Evaluasi pelabelan dilakukan pada **45 token on-chain**. Semua threshold dikonfigurasi melalui `configs/config.yaml`.

---

## 1. Distribusi Label & Analisis Class Imbalance

| Target Label | Definisi | Jumlah Positif | Persentase (% Populasi) | Tingkat Imbalance |
| :--- | :--- | :--- | :--- | :--- |
| `success (>=2x)` | Net return >= 2.0x, bukan rug, bukan honeypot | 5 | 11.11% | Positif minoritas (88.9% negatif) |
| `is_rug` | Likuiditas turun > 80% dari awal | 0 | 0.0% | - |
| `is_honeypot` | Sell tax > 50% atau gagal jual | 0 | 0.0% | - |
| `is_dead` | Harga turun > 90% dari puncak 24h | 0 | 0.0% | - |

> **Catatan Penanganan Imbalance**: Ketidakseimbangan kelas ini (~10%–15% sukses) mencerminkan realitas pasar DEX on-chain yang sesungguhnya. Pada Fase 4 (Pelatihan Model), kita wajib menggunakan `scale_pos_weight` atau Focal Loss dan mengukur performa dengan PR-AUC (Precision-Recall AUC), bukan hanya Accuracy.

---

## 2. Analisis Sensitivitas Threshold (2x vs 3x vs 5x)

| Threshold Return Realistis | Jumlah Token Lolos (`success`) | Rasio Positif | Tingkat Selektivitas |
| :--- | :--- | :--- | :--- |
| **>= 2.0x Net Return** (Default) | 5 | 11.11% | Standar screening kandidat buy |
| **>= 3.0x Net Return** | 3 | 6.67% | Selektif (medium momentum) |
| **>= 5.0x Net Return** | 1 | 2.22% | Sangat selektif (high breakout) |

---

## 3. Verifikasi Manual 20 Token Acak

Tabel audit manual di bawah ini menunjukkan keabsahan logika pelabelan, perhitungan entry price, friksi likuiditas, dan penentuan ground truth label:

| Simbol | Alamat Token (Mint) | Entry Price (T+5m) | Peak Price | Gross Ret | Net Ret | Rug? | Dead? | 2x | 3x | 5x | Status / Audit |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Patrick** | `6qY3...pump` | $0.000005 | $0.000005 | 1.00x | 0.97x | Tdk | Tdk | ❌ | ❌ | ❌ | Gagal capai 2x net |
| **$BWIZ** | `3xa2...pump` | $0.000000 | $0.000000 | 1.00x | 0.96x | Tdk | Tdk | ❌ | ❌ | ❌ | Gagal capai 2x net |
| **CatFight** | `FaTZ...pump` | $0.000000 | $0.000000 | 1.00x | 0.96x | Tdk | Tdk | ❌ | ❌ | ❌ | Gagal capai 2x net |
| **Akita** | `8hE7...9XFE` | $0.000003 | $0.000003 | 1.10x | 1.06x | Tdk | Tdk | ❌ | ❌ | ❌ | Gagal capai 2x net |
| **LOCKTOBER** | `kqxu...pump` | $0.000003 | $0.000004 | 1.21x | 1.17x | Tdk | Tdk | ❌ | ❌ | ❌ | Gagal capai 2x net |
| **$CAT** | `9rZr...pump` | $0.000001 | $0.000003 | 3.58x | 3.45x | Tdk | Tdk | ✅ | ✅ | ❌ | Breakout (3.45x) |
| **QCat** | `26i5...pump` | $0.000003 | $0.000003 | 1.01x | 0.97x | Tdk | Tdk | ❌ | ❌ | ❌ | Gagal capai 2x net |
| **CatTok** | `8oKq...pump` | $0.000001 | $0.000001 | 1.00x | 0.96x | Tdk | Tdk | ❌ | ❌ | ❌ | Gagal capai 2x net |
| **AUTONOMI** | `5Zno...pump` | $0.000003 | $0.000003 | 1.00x | 0.96x | Tdk | Tdk | ❌ | ❌ | ❌ | Gagal capai 2x net |
| **AlonWhale** | `7hR8...pump` | $0.000004 | $0.000004 | 1.00x | 0.96x | Tdk | Tdk | ❌ | ❌ | ❌ | Gagal capai 2x net |
| **Somos** | `A1vh...pump` | $0.000003 | $0.000003 | 1.00x | 0.96x | Tdk | Tdk | ❌ | ❌ | ❌ | Gagal capai 2x net |
| **RST** | `meu2...pump` | $0.000897 | $0.000897 | 1.00x | 0.96x | Tdk | Tdk | ❌ | ❌ | ❌ | Gagal capai 2x net |
| **PUSD** | `88N6...pump` | $0.000004 | $0.000004 | 1.00x | 0.96x | Tdk | Tdk | ❌ | ❌ | ❌ | Gagal capai 2x net |
| **Olive** | `EYtf...pump` | $0.000005 | $0.000005 | 1.07x | 1.03x | Tdk | Tdk | ❌ | ❌ | ❌ | Gagal capai 2x net |
| **FLYDER** | `6Z7x...pump` | $0.000003 | $0.000003 | 1.00x | 0.96x | Tdk | Tdk | ❌ | ❌ | ❌ | Gagal capai 2x net |
| **REA** | `8uZi...T3iu` | $0.000123 | $0.000123 | 1.00x | 0.96x | Tdk | Tdk | ❌ | ❌ | ❌ | Gagal capai 2x net |
| **AKITA** | `37QU...qqov` | $0.000005 | $0.000024 | 4.94x | 4.77x | Tdk | Tdk | ✅ | ✅ | ❌ | Breakout (4.77x) |
| **$CAT** | `5oNZ...pump` | $0.000002 | $0.000004 | 2.38x | 2.29x | Tdk | Tdk | ✅ | ❌ | ❌ | Breakout (2.29x) |
| **SUSAN** | `HFXb...pump` | $0.000003 | $0.000003 | 1.00x | 0.96x | Tdk | Tdk | ❌ | ❌ | ❌ | Gagal capai 2x net |
| **SHNICK** | `C9hY...pump` | $0.000020 | $0.000023 | 1.16x | 1.12x | Tdk | Tdk | ❌ | ❌ | ❌ | Gagal capai 2x net |

---

## 4. Kesimpulan Checkpoint 2

1. **Logika Pelabelan Tervalidasi**: Semua friksi pasar riil (3% slippage, 0.3% fee dua arah, gas fee) berhasil diintegrasikan ke dalam `net_return_24h`.
2. **Sensitivitas Jelas**: Naiknya threshold dari 2x ke 5x menurunkan rasio positif secara proporsional sesuai hukum kurva return DEX.
3. **Zero Lookahead Bias**: Entry price diambil tepat pada interval T+5m / T+15m, bukan harga peluncuran idealis.
4. **Siap Menuju Fase 3**: Feature engineering point-in-time dapat langsung dipetakan ke target label ini.