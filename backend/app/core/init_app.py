import os
import sys

# Ensure backend directory is in sys.path even when invoked from arbitrary paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

import getpass
import re
import logging
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import async_session_factory, Base, async_engine
from app.core.security import hash_password
from app.core.config import settings
import app.models
from app.models.user import User, RoleEnum

logger = logging.getLogger("erp.init")

EMAIL_REGEX = r"^[\w\.-]+@[\w\.-]+\.\w+$"


async def ensure_tables_exist():
    """Ensure database schema tables are created and additive columns migrated."""
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        # Safe migration check for existing users table
        try:
            from sqlalchemy import text
            query = text(
                "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS "
                "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'"
            )
            res = await conn.execute(query)
            existing_cols = {row[0].lower() for row in res.fetchall()}

            if "department_id" not in existing_cols:
                logger.info("Safe Migration: Adding column 'department_id' to users table...")
                await conn.execute(text("ALTER TABLE users ADD COLUMN department_id INT NULL"))
                try:
                    await conn.execute(text(
                        "ALTER TABLE users ADD CONSTRAINT fk_users_department "
                        "FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL"
                    ))
                except Exception as fk_err:
                    logger.warning(f"Note on foreign key fk_users_department: {fk_err}")

            if "job_title" not in existing_cols:
                logger.info("Safe Migration: Adding column 'job_title' to users table...")
                await conn.execute(text("ALTER TABLE users ADD COLUMN job_title VARCHAR(150) NOT NULL DEFAULT 'Staff Officer'"))

            # Ensure email and hashed_password can be NULL for uncredentialed officers
            try:
                await conn.execute(text("ALTER TABLE users MODIFY COLUMN email VARCHAR(255) NULL"))
                await conn.execute(text("ALTER TABLE users MODIFY COLUMN hashed_password VARCHAR(255) NULL"))
            except Exception as e:
                logger.warning(f"Note on column nullability: {e}")
        except Exception as e:
            logger.warning(f"Schema column check notice: {e}")


async def check_admin_exists(db: AsyncSession) -> bool:
    """Check if at least one ADMINISTRATOR exists in database."""
    query = select(func.count()).select_from(User).where(User.role == RoleEnum.ADMINISTRATOR)
    result = await db.execute(query)
    count = result.scalar_one_or_none() or 0
    return count > 0


def prompt_admin_credentials():
    """Interactive CLI prompt using getpass."""
    print("\n" + "=" * 65)
    print("  [ERP SETUP] No administrator account detected.")
    print("  First-time deployment initialization.")
    print("=" * 65)

    # 1. Prompt Email
    while True:
        email = input("  Admin Email: ").strip()
        if not email:
            print("  [!] Email cannot be empty. Please retry.")
            continue
        if not re.match(EMAIL_REGEX, email):
            print("  [!] Invalid email format (e.g., admin@company.com). Please retry.")
            continue
        break

    # 2. Prompt Full Name
    while True:
        full_name = input("  Admin Full Name: ").strip()
        if not full_name:
            print("  [!] Full Name cannot be empty. Please retry.")
            continue
        break

    # 3. Prompt Password with confirmation
    while True:
        password = getpass.getpass("  Admin Password: ")
        if len(password) < 6:
            print("  [!] Password must be at least 6 characters long. Please retry.")
            continue

        confirm = getpass.getpass("  Confirm Password: ")
        if password != confirm:
            print("  [!] Passwords do not match. Please retry.")
            continue
        break

    return email, full_name, password


async def create_admin_user(db: AsyncSession, email: str, full_name: str, password: str) -> User:
    admin_user = User(
        email=email,
        full_name=full_name,
        hashed_password=hash_password(password),
        role=RoleEnum.ADMINISTRATOR,
        department="Executive Administration",
        is_active=True,
    )
    db.add(admin_user)
    await db.commit()
    await db.refresh(admin_user)
    return admin_user


async def init_admin_flow():
    """
    Core initialization hook:
    - Runs schema creation
    - Checks for ADMINISTRATOR count
    - If 0, prompts interactively (or uses ENV fallback if non-interactive)
    - If > 0, skips prompt and boots server
    """
    await ensure_tables_exist()

    async with async_session_factory() as db:
        admin_exists = await check_admin_exists(db)
        if admin_exists:
            print("[ERP SETUP] Administrator account verified. Booting production system...")
            return

        # Check if environment variables provided for automated non-interactive setup
        if settings.INITIAL_ADMIN_EMAIL and settings.INITIAL_ADMIN_PASSWORD:
            print(f"[ERP SETUP] Seeding administrator account from environment: {settings.INITIAL_ADMIN_EMAIL}")
            await create_admin_user(
                db=db,
                email=settings.INITIAL_ADMIN_EMAIL,
                full_name=settings.INITIAL_ADMIN_FULL_NAME or "Super Administrator",
                password=settings.INITIAL_ADMIN_PASSWORD,
            )
            print("[ERP SETUP] Administrator seeded successfully from ENV.")
            return

        # If running in interactive terminal
        if sys.stdin and sys.stdin.isatty():
            email, full_name, password = prompt_admin_credentials()
            await create_admin_user(db, email, full_name, password)
            print("\n  [ERP SETUP] Administrator initialized successfully. Proceeding to launch...")
            print("=" * 65 + "\n")
        else:
            # Fallback for headless environments where stdin is not a TTY
            default_email = "admin@mfg-nexflow.com"
            default_name = "System Administrator"
            default_pass = "Admin@123456"
            print(f"[ERP SETUP] Non-interactive terminal detected. Seeding default admin ({default_email} / {default_pass})")
            await create_admin_user(db, default_email, default_name, default_pass)
            print("[ERP SETUP] Administrator created successfully.")


if __name__ == "__main__":
    import asyncio
    asyncio.run(init_admin_flow())
