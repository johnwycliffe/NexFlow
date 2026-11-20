from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.api.deps import SessionDep, CurrentUserDep, require_roles
from app.models.execution import WorkCenter
from app.schemas.execution import WorkCenterCreate, WorkCenterResponse
from app.schemas.common import MessageResponse
from app.services.audit_service import log_audit_trail

router = APIRouter(prefix="/work-centers", tags=["Work Centers & Lines"])


@router.get("/", response_model=List[WorkCenterResponse])
async def list_work_centers(db: SessionDep):
    stmt = select(WorkCenter).order_by(WorkCenter.code.asc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post(
    "/",
    response_model=WorkCenterResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("ADMINISTRATOR", "PRODUCTION_SUPERVISOR"))],
)
async def create_work_center(
    payload: WorkCenterCreate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    exists = await db.execute(select(WorkCenter).where(WorkCenter.code == payload.code.strip()))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Work Center with code '{payload.code}' already exists.")

    wc = WorkCenter(**payload.model_dump())
    db.add(wc)
    await db.commit()
    await db.refresh(wc)

    await log_audit_trail(
        db=db,
        user=current_user,
        module="Work Centers",
        action="CREATE",
        target_id=wc.code,
        change_notes=f"Commissioned work center line {wc.name} ({wc.department}) with daily capacity {wc.max_capacity_hours_per_day}h.",
    )
    await db.commit()

    return wc


@router.put(
    "/{wc_id}",
    response_model=WorkCenterResponse,
    dependencies=[Depends(require_roles("ADMINISTRATOR", "PRODUCTION_SUPERVISOR"))],
)
async def update_work_center(
    wc_id: int,
    payload: WorkCenterCreate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    wc = await db.get(WorkCenter, wc_id)
    if not wc:
        raise HTTPException(status_code=404, detail="Work center not found.")

    for field, val in payload.model_dump().items():
        setattr(wc, field, val)

    await log_audit_trail(
        db=db,
        user=current_user,
        module="Work Centers",
        action="UPDATE",
        target_id=wc.code,
        change_notes=f"Updated operating parameters for {wc.code}.",
    )
    await db.commit()
    await db.refresh(wc)
    return wc

