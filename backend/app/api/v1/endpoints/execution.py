from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select

from app.api.deps import SessionDep, CurrentUserDep, require_roles
from app.models.execution import ExecutionLog, WorkCenter
from app.models.planning import ProductionOrder
from app.schemas.execution import ExecutionLogCreate, ExecutionLogResponse
from app.services.audit_service import log_audit_trail

router = APIRouter(prefix="/execution", tags=["Shop Floor Execution"])


@router.get("", response_model=List[ExecutionLogResponse])
@router.get("/logs", response_model=List[ExecutionLogResponse])
async def list_execution_logs(
    db: SessionDep,
    production_order_id: Optional[int] = Query(None),
):
    stmt = select(ExecutionLog)
    if production_order_id:
        stmt = stmt.where(ExecutionLog.production_order_id == production_order_id)
    stmt = stmt.order_by(ExecutionLog.logged_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post(
    "/logs",
    response_model=ExecutionLogResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("ADMINISTRATOR", "PRODUCTION_SUPERVISOR"))],
)
async def log_floor_execution_progress(
    payload: ExecutionLogCreate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    po = await db.get(ProductionOrder, payload.production_order_id)
    if not po:
        raise HTTPException(status_code=404, detail="Production order not found.")

    progress = min(100, round(((payload.completed_quantity + payload.scrap_quantity) / payload.target_quantity) * 100))
    status_str = "Completed" if progress >= 100 else "In-Progress"

    log_dict = payload.model_dump()
    log_dict["progress_percent"] = progress
    log_dict["status"] = status_str

    exec_log = ExecutionLog(**log_dict)
    db.add(exec_log)

    # Update Production Order Progress & Scrap
    po.progress_percent = progress
    total_processed = payload.completed_quantity + payload.scrap_quantity
    if total_processed > 0:
        po.scrap_rate_percent = round((payload.scrap_quantity / total_processed) * 100.0, 1)

    if progress >= 100 and po.status in ["Draft", "Released", "In-Progress"]:
        po.status = "Inspection"

    await log_audit_trail(
        db=db,
        user=current_user,
        module="Production Execution",
        action="UPDATE",
        target_id=po.order_number,
        change_notes=f"Logged execution on PO {po.order_number}: {payload.completed_quantity} completed, {payload.scrap_quantity} scrap ({progress}% complete).",
    )
    await db.commit()
    await db.refresh(exec_log)

    return exec_log

