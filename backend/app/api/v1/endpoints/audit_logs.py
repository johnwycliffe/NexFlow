from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select

from app.api.deps import SessionDep, CurrentUserDep, require_roles
from app.models.user import AuditLog
from app.schemas.user import AuditLogResponse

router = APIRouter(prefix="/audit-logs", tags=["Compliance & Audit Logs"])


@router.get(
    "",
    response_model=List[AuditLogResponse],
    dependencies=[Depends(require_roles("ADMINISTRATOR", "MANAGEMENT_VIEWER"))],
)
@router.get(
    "/",
    response_model=List[AuditLogResponse],
    dependencies=[Depends(require_roles("ADMINISTRATOR", "MANAGEMENT_VIEWER"))],
)
async def list_audit_logs(
    db: SessionDep,
    module: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
):
    stmt = select(AuditLog)
    if module and module != "ALL":
        stmt = stmt.where(AuditLog.module == module)
    if action and action != "ALL":
        stmt = stmt.where(AuditLog.action == action)
    stmt = stmt.order_by(AuditLog.timestamp.desc()).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

