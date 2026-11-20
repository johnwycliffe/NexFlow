import sys
import os
import asyncio

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
os.chdir(BACKEND_DIR)

from app.core.database import async_session_factory, async_engine
from sqlalchemy import text

async def verify():
    async with async_session_factory() as session:
        res = await session.execute(text("SELECT id, full_name, email, role, job_title, department_id, is_active FROM users ORDER BY id ASC"))
        rows = [dict(r._mapping) for r in res.fetchall()]
        print(f"Total Users in MySQL: {len(rows)}")
        for r in rows:
            print(f"ID {r['id']}: {r['full_name']} | {r['email']} | Role: {r['role']} | Job: {r['job_title']} | Dept: {r['department_id']} | Active: {r['is_active']}")
    await async_engine.dispose()

if __name__ == "__main__":
    asyncio.run(verify())

