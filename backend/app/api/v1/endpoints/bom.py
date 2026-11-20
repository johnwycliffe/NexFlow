from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import SessionDep, CurrentUserDep, require_roles
from app.models.master_data import BOM, BOMItem, Product, RawMaterial
from app.schemas.master_data import BOMCreate, BOMUpdate, BOMResponse
from app.schemas.common import MessageResponse
from app.services.audit_service import log_audit_trail

router = APIRouter(prefix="/boms", tags=["Bill of Materials (BOM)"])


@router.get("/", response_model=List[BOMResponse])
async def list_boms(db: SessionDep):
    stmt = (
        select(BOM)
        .options(selectinload(BOM.items))
        .order_by(BOM.bom_code.asc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{bom_id}", response_model=BOMResponse)
async def get_bom(bom_id: int, db: SessionDep):
    stmt = (
        select(BOM)
        .options(selectinload(BOM.items))
        .where(BOM.id == bom_id)
    )
    result = await db.execute(stmt)
    bom = result.scalar_one_or_none()
    if not bom:
        raise HTTPException(status_code=404, detail="BOM not found.")
    return bom


@router.post(
    "/",
    response_model=BOMResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("ADMINISTRATOR", "PRODUCTION_PLANNER"))],
)
async def create_bom(
    payload: BOMCreate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    product = await db.get(Product, payload.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Associated finished product not found.")

    # Calculate line items subtotal and total dynamic cost with scrap allowance
    total_subtotal = 0.0
    items_to_create = []

    for item_data in payload.items:
        material = await db.get(RawMaterial, item_data.material_id)
        if not material:
            raise HTTPException(status_code=400, detail=f"Material ID {item_data.material_id} not found.")
        unit_cost = material.unit_cost if item_data.unit_cost == 0.0 else item_data.unit_cost
        subtotal = round(item_data.quantity_per_unit * unit_cost, 2)
        total_subtotal += subtotal

        bom_item = BOMItem(
            material_id=item_data.material_id,
            quantity_per_unit=item_data.quantity_per_unit,
            uom=item_data.uom or material.uom,
            unit_cost=unit_cost,
            subtotal=subtotal,
        )
        items_to_create.append(bom_item)

    scrap_pct = payload.scrap_allowance_percent
    total_calculated_cost = round(total_subtotal * (1.0 + scrap_pct / 100.0), 2)

    bom = BOM(
        product_id=payload.product_id,
        bom_code=payload.bom_code,
        version=payload.version,
        scrap_allowance_percent=scrap_pct,
        total_calculated_cost=total_calculated_cost,
        is_active=payload.is_active,
        effective_date=payload.effective_date,
        items=items_to_create,
    )
    db.add(bom)
    await db.commit()
    await db.refresh(bom)

    # Reload with items
    stmt = select(BOM).options(selectinload(BOM.items)).where(BOM.id == bom.id)
    res = await db.execute(stmt)
    full_bom = res.scalar_one()

    await log_audit_trail(
        db=db,
        user=current_user,
        module="Bill of Materials",
        action="CREATE",
        target_id=bom.bom_code,
        change_notes=f"Created BOM {bom.bom_code} for product {product.sku} ({len(items_to_create)} components, ${total_calculated_cost}/unit).",
    )
    await db.commit()

    return full_bom


@router.delete(
    "/{bom_id}",
    response_model=MessageResponse,
    dependencies=[Depends(require_roles("ADMINISTRATOR", "PRODUCTION_PLANNER"))],
)
async def delete_bom(
    bom_id: int,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    bom = await db.get(BOM, bom_id)
    if not bom:
        raise HTTPException(status_code=404, detail="BOM not found.")

    code = bom.bom_code
    await db.delete(bom)
    await log_audit_trail(
        db=db,
        user=current_user,
        module="Bill of Materials",
        action="DELETE",
        target_id=code,
        change_notes=f"Deleted BOM recipe {code}.",
    )
    await db.commit()
    return MessageResponse(message=f"BOM {code} deleted successfully.")

