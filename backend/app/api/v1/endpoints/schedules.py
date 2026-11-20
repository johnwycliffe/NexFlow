from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select

from app.api.deps import SessionDep, CurrentUserDep, require_roles
from app.models.execution import ProductionSchedule, Machine, WorkCenter
from app.models.planning import ProductionOrder
from app.schemas.execution import ScheduleCreate, ScheduleResponse
from app.schemas.common import MessageResponse
from app.services.schedule_service import validate_no_machine_conflict
from app.services.audit_service import log_audit_trail

router = APIRouter(prefix="/schedules", tags=["Production Scheduling"])


@router.get("/", response_model=List[ScheduleResponse])
async def list_schedules(
    db: SessionDep,
    schedule_date: Optional[date] = Query(None),
    machine_id: Optional[int] = Query(None),
):
    stmt = select(ProductionSchedule)
    if schedule_date:
        stmt = stmt.where(ProductionSchedule.schedule_date == schedule_date)
    if machine_id:
        stmt = stmt.where(ProductionSchedule.machine_id == machine_id)
    stmt = stmt.order_by(ProductionSchedule.schedule_date.asc(), ProductionSchedule.start_hour.asc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post(
    "/",
    response_model=ScheduleResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("ADMINISTRATOR", "PRODUCTION_PLANNER", "PRODUCTION_SUPERVISOR"))],
)
async def create_schedule_slot(
    payload: ScheduleCreate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    # 1. Enforce strict machine collision check (HTTP 409 if double-booked)
    await validate_no_machine_conflict(
        db=db,
        machine_id=payload.machine_id,
        schedule_date=payload.schedule_date,
        start_hour=payload.start_hour,
        end_hour=payload.end_hour,
    )

    po = await db.get(ProductionOrder, payload.production_order_id)
    if not po:
        raise HTTPException(status_code=404, detail="Production order not found.")

    mc = await db.get(Machine, payload.machine_id)
    if not mc:
        raise HTTPException(status_code=404, detail="Machine not found.")

    allocated_hours = payload.end_hour - payload.start_hour
    schedule_dict = payload.model_dump()
    schedule_dict["allocated_hours"] = float(allocated_hours)

    schedule = ProductionSchedule(**schedule_dict)
    db.add(schedule)
    await db.commit()
    await db.refresh(schedule)

    await log_audit_trail(
        db=db,
        user=current_user,
        module="Production Scheduling",
        action="CREATE",
        target_id=str(schedule.id),
        change_notes=f"Scheduled slot for Order {po.order_number} on {mc.name} ({payload.schedule_date} {payload.start_hour}:00-{payload.end_hour}:00, {payload.planned_units} units).",
    )
    await db.commit()

    return schedule


@router.delete(
    "/{schedule_id}",
    response_model=MessageResponse,
    dependencies=[Depends(require_roles("ADMINISTRATOR", "PRODUCTION_PLANNER", "PRODUCTION_SUPERVISOR"))],
)
async def delete_schedule_slot(
    schedule_id: int,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    sch = await db.get(ProductionSchedule, schedule_id)
    if not sch:
        raise HTTPException(status_code=404, detail="Schedule record not found.")

    await db.delete(sch)
    await log_audit_trail(
        db=db,
        user=current_user,
        module="Production Scheduling",
        action="DELETE",
        target_id=str(schedule_id),
        change_notes=f"Cancelled schedule block #{schedule_id}.",
    )
    await db.commit()
    return MessageResponse(message=f"Schedule #{schedule_id} cancelled successfully.")

