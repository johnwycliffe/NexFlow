import os
import sys
import asyncio

# Add backend directory to sys.path and switch working directory if needed
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.core.init_app import init_admin_flow

if __name__ == "__main__":
    print(f"[ERP Launcher] Executing Administrator Setup from {BACKEND_DIR}...")
    asyncio.run(init_admin_flow())

