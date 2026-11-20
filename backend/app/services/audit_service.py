from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import AuditLog, User


async def log_audit_trail(
    db: AsyncSession,
    user: User | None,
    module: str,
    action: str,
    change_notes: str,
    target_id: str | None = None,
) -> AuditLog:
    user_id = user.id if user else None
    user_role = user.role.value if (user and hasattr(user, "role")) else "SYSTEM"

    audit_entry = AuditLog(
        user_id=user_id,
        user_role=user_role,
        module=module,
        action=action,
        target_id=str(target_id) if target_id else None,
        change_notes=change_notes,
    )
    db.add(audit_entry)
    await db.flush()
    return audit_entry

