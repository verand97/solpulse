import sqlite3
import pandas as pd
from pathlib import Path

db_path = Path("ml_service/data/solpulse_ml.db")
if db_path.exists():
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cur.fetchall()
    print("Tables:")
    for (t,) in tables:
        cur.execute(f"SELECT COUNT(*) FROM {t}")
        cnt = cur.fetchone()[0]
        print(f"  {t}: {cnt} rows")

json_path = Path("ml_service/data/parquet/features_v1.jsonl")
if json_path.exists():
    df = pd.read_json(json_path, lines=True)
    print(f"\nParquet rows: {len(df)}, columns: {len(df.columns)}")
    print("Label success distribution:")
    print(df["label_success"].value_counts(dropna=False))
    print("Label is_rug distribution:")
    print(df["label_is_rug"].value_counts(dropna=False) if "label_is_rug" in df else "no label_is_rug")
    print("Label is_dead distribution:")
    print(df["label_is_dead"].value_counts(dropna=False) if "label_is_dead" in df else "no label_is_dead")
    if "label_net_return_24h" in df:
        print("Net return stats:")
        print(df["label_net_return_24h"].describe())
