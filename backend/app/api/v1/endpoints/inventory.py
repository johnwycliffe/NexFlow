from datetime import date
from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import SessionDep, CurrentUserDep, require_roles
from app.models.inventory import StockItem, StockMovement, Warehouse
from app.models.master_data import RawMaterial
from app.schemas.inventory import (
    StockItemCreate,
    StockItemUpdate,
    StockItemResponse,
    StockTransferRequest,
    StockAdjustmentRequest,
    WarehouseResponse,
)
from app.schemas.common import MessageResponse
from app.services.inventory_service import transfer_stock_atomic
from app.services.audit_service import log_audit_trail

router = APIRouter(prefix="/inventory", tags=["Inventory & Multi-Warehouse Tracking"])


@router.get("/", response_model=List[StockItemResponse])
@router.get("/stock", response_model=List[StockItemResponse])
async def list_stock_items(
    db: SessionDep,
    warehouse_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
):
    stmt = (
        select(StockItem)
        .options(
            selectinload(StockItem.warehouse),
            selectinload(StockItem.material),
        )
    )
    if warehouse_id:
        stmt = stmt.where(StockItem.warehouse_id == warehouse_id)
    if status_filter and status_filter != "ALL":
        stmt = stmt.where(StockItem.status == status_filter)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post(
    "/",
    response_model=StockItemResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("ADMINISTRATOR", "INVENTORY_OFFICER"))],
)
async def create_stock_item(
    payload: StockItemCreate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    exists = (
        await db.execute(
            select(StockItem).where(
                StockItem.warehouse_id == payload.warehouse_id,
                StockItem.material_id == payload.material_id,
            )
        )
    ).scalar_one_or_none()
    if exists:
        raise HTTPException(
            status_code=400,
            detail="Stock item for this material and warehouse already exists.",
        )

    item = StockItem(**payload.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.put(
    "/{stock_item_id}",
    response_model=StockItemResponse,
    dependencies=[Depends(require_roles("ADMINISTRATOR", "INVENTORY_OFFICER"))],
)
async def update_stock_item(
    stock_item_id: int,
    payload: StockItemUpdate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    item = await db.get(StockItem, stock_item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Stock item record not found.")

    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(item, k, v)

    await db.commit()
    await db.refresh(item)
    return item


@router.delete(
    "/{stock_item_id}",
    response_model=MessageResponse,
    dependencies=[Depends(require_roles("ADMINISTRATOR"))],
)
async def delete_stock_item(
    stock_item_id: int,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    item = await db.get(StockItem, stock_item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Stock item record not found.")

    await db.delete(item)
    await db.commit()
    return MessageResponse(message=f"Stock item {stock_item_id} deleted successfully.")


@router.post(
    "/transfer",
    response_model=MessageResponse,
    dependencies=[Depends(require_roles("ADMINISTRATOR", "INVENTORY_OFFICER"))],
)
async def transfer_stock(
    payload: StockTransferRequest,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    movement = await transfer_stock_atomic(
        db=db,
        material_id=payload.material_id,
        from_warehouse_id=payload.from_warehouse_id,
        to_warehouse_id=payload.to_warehouse_id,
        quantity=payload.quantity,
        notes=payload.notes,
        current_user=current_user,
    )
    await db.commit()
    return MessageResponse(
        message=f"Successfully transferred {payload.quantity} {movement.uom} to warehouse ID {payload.to_warehouse_id}."
    )


@router.post(
    "/adjust",
    response_model=StockItemResponse,
    dependencies=[Depends(require_roles("ADMINISTRATOR", "INVENTORY_OFFICER"))],
)
async def adjust_stock(
    payload: StockAdjustmentRequest,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    # Lookup by direct primary key or clean ID
    stock_item = await db.get(StockItem, payload.stock_item_id)
    if not stock_item:
        # Fallback: check by material_id
        res = await db.execute(
            select(StockItem).where(StockItem.material_id == payload.stock_item_id)
        )
        stock_item = res.scalars().first()

    if not stock_item:
        raise HTTPException(status_code=404, detail="Stock item record not found.")

    old_qty = stock_item.on_hand_qty
    new_qty = payload.new_on_hand_qty
    stock_item.on_hand_qty = new_qty
    stock_item.last_count_date = date.today()

    mat = await db.get(RawMaterial, stock_item.material_id)
    safety = mat.safety_stock if mat else 50.0

    if stock_item.available_qty <= 0:
        stock_item.status = "OUT_OF_STOCK"
    elif stock_item.available_qty <= safety:
        stock_item.status = "LOW_STOCK"
    else:
        stock_item.status = "IN_STOCK"

    # Log movement
    diff = round(new_qty - old_qty, 4)
    movement = StockMovement(
        material_id=stock_item.material_id,
        movement_type="ADJUSTMENT",
        quantity=abs(diff),
        uom=mat.uom if mat else "units",
        from_warehouse_id=stock_item.warehouse_id if diff < 0 else None,
        to_warehouse_id=stock_item.warehouse_id if diff > 0 else None,
        reference_id=f"ADJ-{date.today().strftime('%Y%m%d')}",
        notes=f"{payload.reason} (Variance: {diff:+})",
    )
    db.add(movement)

    await log_audit_trail(
        db=db,
        user=current_user,
        module="Inventory",
        action="UPDATE",
        target_id=str(stock_item.id),
        change_notes=f"Physical stock audit: adjusted on-hand from {old_qty} to {new_qty}. Reason: {payload.reason}.",
    )
    await db.commit()
    await db.refresh(stock_item)
    return stock_item


@router.get("/warehouses", response_model=List[WarehouseResponse])
async def list_warehouses(db: SessionDep):
    stmt = select(Warehouse).order_by(Warehouse.id.asc())
    result = await db.execute(stmt)
    return result.scalars().all()

