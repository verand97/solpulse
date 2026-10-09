"""Generate Data Quality Report (reports/data_quality.md) from the SolPulse ML database."""

import os
import sys
from pathlib import Path
from datetime import datetime, timezone

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml_service.database.db_manager import DBManager

REPORTS_DIR = PROJECT_ROOT / "reports"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)
REPORT_PATH = REPORTS_DIR / "data_quality.md"

def generate_report(db: DBManager) -> str:
    with db.get_connection() as conn:
        cursor = conn.cursor()

        # 1. Total tokens and by chain
        total_tokens = cursor.execute("SELECT count(*) FROM tokens").fetchone()[0]
        chain_counts = cursor.execute("SELECT chain, count(*) FROM tokens GROUP BY chain").fetchall()
        
        # 2. Tokens by month
        month_counts = cursor.execute("""
            SELECT strftime('%Y-%m', first_detected_at) as ym, count(*)
            FROM tokens
            GROUP BY ym
            ORDER BY ym DESC
        """).fetchall()

        # 3. Snapshot coverage
        total_snapshots = cursor.execute("SELECT count(*) FROM snapshots").fetchone()[0]
        intervals = cursor.execute("""
            SELECT interval_label, count(DISTINCT token_address)
            FROM snapshots
            GROUP BY interval_label
        """).fetchall()
        interval_map = {row[0]: row[1] for row in intervals}

        tokens_with_t24h = interval_map.get("t_24h", 0)

        # 4. Missing percentage on tokens
        missing_price = cursor.execute("SELECT count(*) FROM tokens WHERE initial_price_usd IS NULL OR initial_price_usd = 0").fetchone()[0]
        missing_liq = cursor.execute("SELECT count(*) FROM tokens WHERE initial_liquidity_usd IS NULL OR initial_liquidity_usd = 0").fetchone()[0]
        missing_symbol = cursor.execute("SELECT count(*) FROM tokens WHERE symbol IS NULL OR symbol = ''").fetchone()[0]

        pct_missing_price = (missing_price / total_tokens * 100.0) if total_tokens > 0 else 0.0
        pct_missing_liq = (missing_liq / total_tokens * 100.0) if total_tokens > 0 else 0.0
        pct_missing_symbol = (missing_symbol / total_tokens * 100.0) if total_tokens > 0 else 0.0

        # 5. Security & Holder checks count
        sec_count = cursor.execute("SELECT count(*) FROM security_checks").fetchone()[0]
        holder_count = cursor.execute("SELECT count(*) FROM holders_snapshot").fetchone()[0]
        raw_count = cursor.execute("SELECT count(*) FROM raw_responses").fetchone()[0]

    now_utc_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    # Honest assessment
    is_ready_for_production_ml = total_tokens >= 3000 and tokens_with_t24h >= 1000
    status_alert = (
        "> [!IMPORTANT]\n"
        f"> **Status Kesiapan Data Model**: Target minimum adalah **≥ 3.000 token berlabel lengkap** (ideal ≥ 10.000). "
        f"Saat ini database mengumpulkan **{total_tokens} token** ({tokens_with_t24h} memiliki snapshot T+24h). "
        "Sesuai aturan keras nomor 0 & 3.2, model belum layak dipercaya untuk inferensi produksi dengan data parsial ini. "
        "Collector Jalur A wajib terus berjalan di background sementara backfill Jalur B dijalankan secara paralel."
    ) if not is_ready_for_production_ml else (
        "> [!NOTE]\n"
        f"> **Status Kesiapan Data Model**: Database telah mengumpulkan {total_tokens} token. Siap untuk tahap Feature Engineering & Model Training."
    )

    md_lines = [
        "# Laporan Kualitas Data On-Chain (SolPulse ML Screener)",
        "",
        f"*Dibuat secara otomatis pada: {now_utc_str}*",
        "",
        status_alert,
        "",
        "---",
        "",
        "## 1. Ringkasan Populasi Token",
        "",
        f"- **Total Token Terdeteksi**: `{total_tokens:,}`",
        f"- **Total Snapshot Deret Waktu**: `{total_snapshots:,}`",
        f"- **Total Audit Keamanan (RugCheck/GoPlus)**: `{sec_count:,}`",
        f"- **Total Audit Holder On-Chain**: `{holder_count:,}`",
        f"- **Total Respons Mentah Tersimpan (`raw_responses`)**: `{raw_count:,}`",
        "",
        "### Distribusi Berdasarkan Chain",
        "| Chain | Jumlah Token | Persentase |",
        "| :--- | :--- | :--- |"
    ]

    for c, cnt in chain_counts:
        pct = (cnt / total_tokens * 100.0) if total_tokens > 0 else 0.0
        md_lines.append(f"| `{c}` | {cnt:,} | {pct:.1f}% |")

    md_lines.extend([
        "",
        "### Distribusi Berdasarkan Bulan Deteksi",
        "| Periode (YYYY-MM) | Jumlah Token Baru |",
        "| :--- | :--- |"
    ])

    for ym, cnt in month_counts:
        md_lines.append(f"| `{ym or 'N/A'}` | {cnt:,} |")

    md_lines.extend([
        "",
        "---",
        "",
        "## 2. Kelengkapan Deret Waktu Snapshot (Jalur A & B)",
        "",
        "| Interval Snapshot | Definisi Waktu | Token dengan Data | Kelengkapan (% dari total) |",
        "| :--- | :--- | :--- | :--- |",
        f"| `t_0` | Deteksi awal (T+0s) | {interval_map.get('t_0', 0):,} | {(interval_map.get('t_0', 0) / max(total_tokens, 1) * 100):.1f}% |",
        f"| `t_1m` | 60 detik setelah deteksi | {interval_map.get('t_1m', 0):,} | {(interval_map.get('t_1m', 0) / max(total_tokens, 1) * 100):.1f}% |",
        f"| `t_5m` | 5 menit setelah deteksi (Entry Target) | {interval_map.get('t_5m', 0):,} | {(interval_map.get('t_5m', 0) / max(total_tokens, 1) * 100):.1f}% |",
        f"| `t_15m` | 15 menit setelah deteksi | {interval_map.get('t_15m', 0):,} | {(interval_map.get('t_15m', 0) / max(total_tokens, 1) * 100):.1f}% |",
        f"| `t_30m` | 30 menit setelah deteksi | {interval_map.get('t_30m', 0):,} | {(interval_map.get('t_30m', 0) / max(total_tokens, 1) * 100):.1f}% |",
        f"| `t_60m` | 1 jam setelah deteksi | {interval_map.get('t_60m', 0):,} | {(interval_map.get('t_60m', 0) / max(total_tokens, 1) * 100):.1f}% |",
        f"| `t_6h` | 6 jam setelah deteksi | {interval_map.get('t_6h', 0):,} | {(interval_map.get('t_6h', 0) / max(total_tokens, 1) * 100):.1f}% |",
        f"| `t_24h` | 24 jam setelah deteksi (Evaluasi Label Final) | {tokens_with_t24h:,} | {(tokens_with_t24h / max(total_tokens, 1) * 100):.1f}% |",
        "",
        "---",
        "",
        "## 3. Analisis Missing Values per Kolom Kunci",
        "",
        "| Kolom | Tabel | Missing Count | Missing Percentage | Dampak Fitur |",
        "| :--- | :--- | :--- | :--- | :--- |",
        f"| `initial_price_usd` | `tokens` | {missing_price:,} | {pct_missing_price:.2f}% | Perhitungan baseline return |",
        f"| `initial_liquidity_usd` | `tokens` | {missing_liq:,} | {pct_missing_liq:.2f}% | Filter likuiditas awal & rasio mcap |",
        f"| `symbol` | `tokens` | {missing_symbol:,} | {pct_missing_symbol:.2f}% | Tampilan antarmuka & pencarian |",
        "",
        "---",
        "",
        "## 4. Rekomendasi Langkah Selanjutnya (Checkpoint 1)",
        "",
        "1. Biarkan **Jalur A (Forward Collector)** terus beroperasi sebagai background daemon agar mengumpulkan token T+0 s/d T+24h asli tanpa survivorship bias.",
        "2. Eksekusi **Jalur B (Historical Backfill)** untuk mengisi dataset awal hingga melampaui batas ambang 3.000 token sebelum pelatihan model (Fase 4).",
        "3. Lanjutkan ke verifikasi skema Labeling Multi-target (Fase 2) dan Point-in-time Feature Engineering (Fase 3)."
    ]

    report_content = "\n".join(md_lines)
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        f.write(report_content)

    print(f"Report written to {REPORT_PATH}")
    return report_content

if __name__ == "__main__":
    db = DBManager()
    generate_report(db)
