"""CLI runner for SolPulse Forward Collector (Jalur A)."""

import os
import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import logging
from ml_service.collector.new_pairs_listener import NewPairsListener

logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    level=logging.INFO
)

def main():
    listener = NewPairsListener(poll_interval=30)
    if "--once" in sys.argv:
        logging.info("Running single collector poll...")
        count = listener.run_once()
        logging.info(f"Poll completed. Processed {count} new token(s).")
    else:
        listener.run_forever()

if __name__ == "__main__":
    main()
