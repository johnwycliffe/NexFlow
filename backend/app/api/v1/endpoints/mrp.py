from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import SessionDep, CurrentUserDep, require_roles
from app.models.planning import MRPRun, MRPItem
from app.models.master_data import RawMaterial
from app.models.inventory import StockItem, StockMovement
from app.schemas.planning import MRPRunResponse
from app.schemas.common import MessageResponse
from app.services.mrp_service import run_mrp_engine
from app.services.inventory_service import get_or_create_stock_item
from app.services.audit_service import log_audit_trail

router = APIRouter(prefix="/mrp", tags=["Material Requirements Planning (MRP)"])


@router.post(
    "/run",
    response_model=MRPRunResponse,
    dependencies=[Depends(require_roles("ADMINISTRATOR", "PRODUCTION_PLANNER", "INVENTORY_OFFICER"))],
)
async def trigger_mrp_calculation(
    db: SessionDep,
    current_user: CurrentUserDep,
):
    """Trigger gross-to-net MRP explosion across active demand commitments and shop-floor inventory."""
    mrp_run = await run_mrp_engine(db=db, current_user=current_user)
    # Reload with items
    stmt = (
        select(MRPRun)
        .options(selectinload(MRPRun.items))
        .where(MRPRun.id == mrp_run.id)
    )
    res = await db.execute(stmt)
    return res.scalar_one()


@router.get("/latest", response_model=MRPRunResponse)
async def get_latest_mrp_run(db: SessionDep):
    """Retrieve the most recent computed MRP execution."""
    stmt = (
        select(MRPRun)
        .options(selectinload(MRPRun.items))
        .order_by(MRPRun.id.desc())
        .limit(1)
    )
    res = await db.execute(stmt)
    latest = res.scalar_one_or_none()
    if not latest:
        # Run initial MRP automatically
        latest = await run_mrp_engine(db=db)
        stmt = (
            select(MRPRun)
            .options(selectinload(MRPRun.items))
            .where(MRPRun.id == latest.id)
        )
        res = await db.execute(stmt)
        latest = res.scalar_one()
    return latest


@router.post(
    "/requisition/{material_id}",
    response_model=MessageResponse,
    dependencies=[Depends(require_roles("ADMINISTRATOR", "PRODUCTION_PLANNER", "INVENTORY_OFFICER"))],
)
async def simulate_replenishment_requisition(
    material_id: int,
    db: SessionDep,
    current_user: CurrentUserDep,
    quantity: float = Query(..., gt=0),
):
    """One-click simulated purchase order receipt into Central Raw Store (WH-01)."""
    material = await db.get(RawMaterial, material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material not found.")

    stock_item = await get_or_create_stock_item(db, warehouse_id=1, material_id=material_id, unit_cost=material.unit_cost)
    stock_item.on_hand_qty = round(stock_item.on_hand_qty + quantity, 4)
    stock_item.status = "IN_STOCK"

    movement = StockMovement(
        material_id=material_id,
        movement_type="RECEIPT",
        quantity=quantity,
        uom=material.uom,
        to_warehouse_id=1,
        reference_id=f"REQ-PO-{material.code}",
        notes=f"Expedited supplier PO replenishment for MRP deficit (+{quantity} {material.uom})",
    )
    db.add(movement)

    await log_audit_trail(
        db=db,
        user=current_user,
        module="MRP Engine",
        action="CREATE",
        target_id=material.code,
        change_notes=f"Simulated expedited PO replenishment of {quantity} {material.uom} for {material.name} into WH-01.",
    )
    await db.commit()

    return MessageResponse(
        message=f"Requisition order confirmed: +{quantity} {material.uom} received into warehouse WH-01."
    )

