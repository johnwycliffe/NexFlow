import os
import sys
import asyncio

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from scripts.seed_data import seed_all_demo_data

if __name__ == "__main__":
    print(f"[ERP Launcher] Seeding Demo ERP Data from {BACKEND_DIR}...")
    asyncio.run(seed_all_demo_data())

