from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select

from app.api.deps import SessionDep, CurrentUserDep, require_roles
from app.models.execution import Machine, WorkCenter
from app.schemas.execution import MachineCreate, MachineUpdate, MachineResponse
from app.schemas.common import MessageResponse
from app.services.audit_service import log_audit_trail

router = APIRouter(prefix="/machines", tags=["Machines & Tooling"])


@router.get("/", response_model=List[MachineResponse])
async def list_machines(
    db: SessionDep,
    work_center_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
):
    stmt = select(Machine)
    if work_center_id:
        stmt = stmt.where(Machine.work_center_id == work_center_id)
    if status_filter and status_filter != "ALL":
        stmt = stmt.where(Machine.status == status_filter)
    stmt = stmt.order_by(Machine.code.asc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post(
    "/",
    response_model=MachineResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("ADMINISTRATOR", "PRODUCTION_SUPERVISOR"))],
)
async def create_machine(
    payload: MachineCreate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    wc = await db.get(WorkCenter, payload.work_center_id)
    if not wc:
        raise HTTPException(status_code=404, detail="Assigned work center not found.")

    exists = await db.execute(select(Machine).where(Machine.code == payload.code.strip()))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Machine code '{payload.code}' already exists.")

    mc = Machine(**payload.model_dump())
    db.add(mc)
    await db.commit()
    await db.refresh(mc)

    await log_audit_trail(
        db=db,
        user=current_user,
        module="Machines",
        action="CREATE",
        target_id=mc.code,
        change_notes=f"Registered machine {mc.name} under work center {wc.name} (Status: {mc.status}).",
    )
    await db.commit()

    return mc


@router.put(
    "/{machine_id}",
    response_model=MachineResponse,
    dependencies=[Depends(require_roles("ADMINISTRATOR", "PRODUCTION_SUPERVISOR"))],
)
async def update_machine(
    machine_id: int,
    payload: MachineUpdate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    mc = await db.get(Machine, machine_id)
    if not mc:
        raise HTTPException(status_code=404, detail="Machine equipment not found.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(mc, field, val)

    await log_audit_trail(
        db=db,
        user=current_user,
        module="Machines",
        action="UPDATE",
        target_id=mc.code,
        change_notes=f"Updated status/telemetry for machine {mc.code}: {list(update_data.keys())}.",
    )
    await db.commit()
    await db.refresh(mc)
    return mc

