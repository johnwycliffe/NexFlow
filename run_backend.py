import os
import sys
import uvicorn

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

if __name__ == "__main__":
    os.chdir(BACKEND_DIR)
    print(f"[ERP Launcher] Launching NexFlow ERP FastAPI Server from {BACKEND_DIR}...")
    print(f"API Docs available at: http://localhost:8000/api/v1/docs")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

