import sys
import os
import asyncio

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
os.chdir(BACKEND_DIR)

from sqlalchemy import select, text, delete, update
from app.core.database import async_session_factory, async_engine
from app.core.security import hash_password
from app.models.user import User, RoleEnum, UserRole, Role, Department

# Target customized officers to preserve / establish
OFFICERS_SPEC = [
    {
        "preferred_id": 3,
        "full_name": "Alexander Vance",
        "email": "admin@nexflow.mfg",
        "role_enum": RoleEnum.ADMINISTRATOR,
        "role_name": "Administrator",
        "job_title": "Plant Operations Administrator",
        "dept_name": "Plant Operations & IT",
    },
    {
        "preferred_id": 4,
        "full_name": "Diana",
        "email": "e.rostova@mfg-nexflow.com",
        "role_enum": RoleEnum.PRODUCTION_PLANNER,
        "role_name": "Production Planner",
        "job_title": "Production Planner",
        "dept_name": "Supply Chain & Planning",
    },
    {
        "preferred_id": 6,
        "full_name": "Santhosh",
        "email": "d.oconnor@mfg-nexflow.com",
        "role_enum": RoleEnum.INVENTORY_OFFICER,
        "role_name": "Store / Inventory Officer",
        "job_title": "Store / Inventory Officer",
        "dept_name": "Warehouse & Logistics",
    },
    {
        "preferred_id": 8,
        "full_name": "Barry Allen",
        "email": "h.weber@mfg-nexflow.com",
        "role_enum": RoleEnum.PRODUCTION_SUPERVISOR,
        "role_name": "Production Supervisor",
        "job_title": "Production Supervisor",
        "dept_name": "Shop Floor Operations",
    },
    {
        "preferred_id": 10,
        "full_name": "Clark kent",
        "email": "c.lindqvist@mfg-nexflow.com",
        "role_enum": RoleEnum.QUALITY_INSPECTOR,
        "role_name": "Quality Inspector",
        "job_title": "Quality Inspector",
        "dept_name": "Quality Assurance",
    },
    {
        "preferred_id": 12,
        "full_name": "Bruce Wayne",
        "email": "m.sterling@mfg-nexflow.com",
        "role_enum": RoleEnum.MANAGEMENT_VIEWER,
        "role_name": "Management Viewer",
        "job_title": "Executive Manager",
        "dept_name": "Executive Board",
    },
]

async def run_cleanup():
    async with async_session_factory() as session:
        print("[CLEANUP] Starting officer deduplication...")

        # 1. Look up departments & roles
        dept_rows = (await session.execute(select(Department))).scalars().all()
        dept_by_name = {d.name: d.id for d in dept_rows}

        role_rows = (await session.execute(select(Role))).scalars().all()
        role_by_name = {r.role_name: r.id for r in role_rows}

        # 2. Get all existing users
        res = await session.execute(text("SELECT id, full_name, email, role, department_id, job_title FROM users ORDER BY id ASC"))
        current_users = [dict(r._mapping) for r in res.fetchall()]
        print(f"[CLEANUP] Current users count in MySQL: {len(current_users)}")
        for u in current_users:
            print(f"  Existing user: id={u['id']}, name='{u['full_name']}', email='{u['email']}', role={u['role']}")

        preserved_ids = set()

        # Always preserve id 1 if it is johnch / admin
        u1 = next((u for u in current_users if u["id"] == 1), None)
        if u1:
            preserved_ids.add(1)
            print("[CLEANUP] Preserving admin user ID 1 (johnch)")

        # For each spec officer, find matching user or update preferred_id
        for spec in OFFICERS_SPEC:
            target_dept_id = dept_by_name.get(spec["dept_name"])
            target_role_id = role_by_name.get(spec["role_name"])

            # Check if user with this email or preferred_id exists
            matched = next((u for u in current_users if u["email"] == spec["email"]), None)
            if not matched:
                matched = next((u for u in current_users if u["id"] == spec["preferred_id"]), None)

            if matched:
                uid = matched["id"]
                preserved_ids.add(uid)
                print(f"[CLEANUP] Updating officer ID {uid} -> {spec['full_name']} ({spec['email']})")
                await session.execute(
                    update(User)
                    .where(User.id == uid)
                    .values(
                        full_name=spec["full_name"],
                        email=spec["email"],
                        role=spec["role_enum"],
                        department=spec["dept_name"],
                        department_id=target_dept_id,
                        job_title=spec["job_title"],
                        is_active=True
                    )
                )
                # Map role in user_roles
                if target_role_id:
                    ur_check = await session.execute(
                        text("SELECT 1 FROM user_roles WHERE user_id = :uid AND role_id = :rid"),
                        {"uid": uid, "rid": target_role_id}
                    )
                    if not ur_check.scalar():
                        await session.execute(
                            text("INSERT INTO user_roles (user_id, role_id) VALUES (:uid, :rid)"),
                            {"uid": uid, "rid": target_role_id}
                        )
            else:
                # Insert new user
                new_u = User(
                    full_name=spec["full_name"],
                    email=spec["email"],
                    hashed_password=hash_password("Demo@123456"),
                    role=spec["role_enum"],
                    department=spec["dept_name"],
                    department_id=target_dept_id,
                    job_title=spec["job_title"],
                    is_active=True
                )
                session.add(new_u)
                await session.flush()
                preserved_ids.add(new_u.id)
                print(f"[CLEANUP] Created missing officer ID {new_u.id} -> {spec['full_name']} ({spec['email']})")
                if target_role_id:
                    await session.execute(
                        text("INSERT INTO user_roles (user_id, role_id) VALUES (:uid, :rid)"),
                        {"uid": new_u.id, "rid": target_role_id}
                    )

        # 3. Identify redundant duplicate IDs to delete
        all_ids = {u["id"] for u in current_users}
        redundant_ids = all_ids - preserved_ids
        print(f"[CLEANUP] Preserved IDs: {sorted(list(preserved_ids))}")
        print(f"[CLEANUP] Redundant IDs to remove: {sorted(list(redundant_ids))}")

        if redundant_ids:
            # Reassign any audit_logs referencing redundant IDs to id 1 (or first preserved id)
            safe_target_id = 1 if 1 in preserved_ids else list(preserved_ids)[0]
            await session.execute(
                text("UPDATE audit_logs SET user_id = :safe_id WHERE user_id IN :bad_ids"),
                {"safe_id": safe_target_id, "bad_ids": tuple(redundant_ids)}
            )
            # Delete redundant user_roles
            await session.execute(
                text("DELETE FROM user_roles WHERE user_id IN :bad_ids"),
                {"bad_ids": tuple(redundant_ids)}
            )
            # Delete redundant users
            await session.execute(
                text("DELETE FROM users WHERE id IN :bad_ids"),
                {"bad_ids": tuple(redundant_ids)}
            )

        await session.commit()
        print("[CLEANUP] Commit successful.")

        # 4. Print final roster
        res_final = await session.execute(text("SELECT id, full_name, email, role, job_title, department_id, is_active FROM users ORDER BY id ASC"))
        print("\n[CLEANUP] === FINAL DE-DUPLICATED MYSQL USERS ROSTER ===")
        for r in res_final.fetchall():
            print(dict(r._mapping))

    await async_engine.dispose()

if __name__ == "__main__":
    asyncio.run(run_cleanup())

