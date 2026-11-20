from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.api.deps import SessionDep, CurrentUserDep, require_roles
from app.models.execution import Shift
from app.schemas.execution import ShiftCreate, ShiftResponse
from app.services.audit_service import log_audit_trail

router = APIRouter(prefix="/shifts", tags=["Shifts & Working Calendar"])


@router.get("", response_model=List[ShiftResponse])
@router.get("/", response_model=List[ShiftResponse])
async def list_shifts(db: SessionDep):
    stmt = select(Shift).order_by(Shift.start_time.asc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post(
    "/",
    response_model=ShiftResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("ADMINISTRATOR", "PRODUCTION_SUPERVISOR"))],
)
async def create_shift(
    payload: ShiftCreate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    exists = await db.execute(select(Shift).where(Shift.code == payload.code.strip()))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Shift code '{payload.code}' already exists.")

    shift = Shift(**payload.model_dump())
    db.add(shift)
    await db.commit()
    await db.refresh(shift)

    await log_audit_trail(
        db=db,
        user=current_user,
        module="Shifts & Calendar",
        action="CREATE",
        target_id=shift.code,
        change_notes=f"Configured factory shift pattern {shift.name} ({shift.start_time} - {shift.end_time}, Supervisor: {shift.supervisor}).",
    )
    await db.commit()

    return shift

