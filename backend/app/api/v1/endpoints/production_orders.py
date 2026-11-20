from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select

from app.api.deps import SessionDep, CurrentUserDep, require_roles
from app.models.planning import ProductionOrder, SalesOrder
from app.models.master_data import Product
from app.schemas.planning import (
    ProductionOrderCreate,
    ProductionOrderUpdate,
    ProductionOrderStatusPatch,
    ProductionOrderResponse,
)
from app.schemas.common import MessageResponse
from app.services.inventory_service import (
    reserve_materials_for_order,
    release_reserved_materials_for_order,
)
from app.services.audit_service import log_audit_trail

router = APIRouter(prefix="/production-orders", tags=["Production Orders & Execution"])


@router.get("/", response_model=List[ProductionOrderResponse])
async def list_production_orders(
    db: SessionDep,
    status_filter: Optional[str] = Query(None, alias="status"),
):
    stmt = select(ProductionOrder)
    if status_filter and status_filter != "ALL":
        stmt = stmt.where(ProductionOrder.status == status_filter)
    stmt = stmt.order_by(ProductionOrder.order_number.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{order_id}", response_model=ProductionOrderResponse)
async def get_production_order(order_id: int, db: SessionDep):
    po = await db.get(ProductionOrder, order_id)
    if not po:
        raise HTTPException(status_code=404, detail="Production order not found.")
    return po


@router.post(
    "/",
    response_model=ProductionOrderResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("ADMINISTRATOR", "PRODUCTION_PLANNER"))],
)
async def create_production_order(
    payload: ProductionOrderCreate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    product = await db.get(Product, payload.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    exists = await db.execute(select(ProductionOrder).where(ProductionOrder.order_number == payload.order_number.strip()))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Production order '{payload.order_number}' already exists.")

    po = ProductionOrder(**payload.model_dump())
    db.add(po)
    await db.commit()
    await db.refresh(po)

    # If created directly in Released status, reserve raw materials
    if po.status.lower() == "released":
        await reserve_materials_for_order(db, po)
        await db.commit()

    await log_audit_trail(
        db=db,
        user=current_user,
        module="Production Orders",
        action="CREATE",
        target_id=po.order_number,
        change_notes=f"Launched production work order {po.order_number} for {po.batch_quantity} {po.uom} of {product.name} (Status: {po.status}).",
    )
    await db.commit()

    return po


@router.post(
    "/convert-demand/{sales_order_id}",
    response_model=ProductionOrderResponse,
    dependencies=[Depends(require_roles("ADMINISTRATOR", "PRODUCTION_PLANNER"))],
)
async def convert_demand_to_production_order(
    sales_order_id: int,
    db: SessionDep,
    current_user: CurrentUserDep,
    custom_batch_size: Optional[float] = Query(None),
):
    so = await db.get(SalesOrder, sales_order_id)
    if not so:
        raise HTTPException(status_code=404, detail="Sales order not found.")

    po_count_res = await db.execute(select(ProductionOrder))
    po_count = len(po_count_res.scalars().all())
    po_number = f"PO-{date.today().strftime('%Y')}-{str(101 + po_count)}"

    batch_qty = custom_batch_size if custom_batch_size and custom_batch_size > 0 else so.quantity

    po = ProductionOrder(
        order_number=po_number,
        sales_order_id=so.id,
        product_id=so.product_id,
        batch_quantity=batch_qty,
        uom=so.uom,
        priority=so.priority,
        status="Draft",
        progress_percent=0,
        start_date=date.today(),
        due_date=so.requested_delivery_date,
        operator_notes=f"Generated from Customer Demand {so.order_number} ({so.customer_name})",
    )
    db.add(po)

    # Update sales order status
    so.status = "IN_PRODUCTION"

    await log_audit_trail(
        db=db,
        user=current_user,
        module="Production Orders",
        action="CREATE",
        target_id=po.order_number,
        change_notes=f"Converted Demand {so.order_number} into Production Order {po.order_number} ({batch_qty} {so.uom}).",
    )
    await db.commit()
    await db.refresh(po)
    return po


@router.patch(
    "/{order_id}/status",
    response_model=ProductionOrderResponse,
    dependencies=[Depends(require_roles("ADMINISTRATOR", "PRODUCTION_PLANNER", "PRODUCTION_SUPERVISOR"))],
)
async def patch_production_order_status(
    order_id: int,
    payload: ProductionOrderStatusPatch,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    """
    State Transition Engine:
    Draft ➔ Released ➔ In-Progress ➔ Inspection ➔ Completed
    Atomically handles stock reservations and completions.
    """
    po = await db.get(ProductionOrder, order_id)
    if not po:
        raise HTTPException(status_code=404, detail="Production order not found.")

    old_status = po.status
    new_status = payload.status

    if old_status != new_status:
        # Atomic inventory reservation on Release
        if new_status.lower() == "released":
            if not po.actual_start_date:
                po.actual_start_date = date.today()
            await reserve_materials_for_order(db, po)

        elif new_status.lower() == "in-progress":
            if po.progress_percent == 0:
                po.progress_percent = 20

        elif new_status.lower() == "inspection":
            po.progress_percent = 100

        elif new_status.lower() == "completed":
            po.progress_percent = 100
            po.completed_date = date.today()
            await release_reserved_materials_for_order(db, po)
            if po.sales_order_id:
                so = await db.get(SalesOrder, po.sales_order_id)
                if so:
                    so.status = "COMPLETED"

        elif new_status.lower() == "cancelled":
            await release_reserved_materials_for_order(db, po)

        po.status = new_status

        await log_audit_trail(
            db=db,
            user=current_user,
            module="Production Orders",
            action="STATUS_CHANGE",
            target_id=po.order_number,
            change_notes=f"PO {po.order_number} state changed from '{old_status}' to '{new_status}'.",
        )
        await db.commit()
        await db.refresh(po)

    return po


@router.put(
    "/{order_id}",
    response_model=ProductionOrderResponse,
    dependencies=[Depends(require_roles("ADMINISTRATOR", "PRODUCTION_PLANNER"))],
)
async def update_production_order(
    order_id: int,
    payload: ProductionOrderUpdate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    po = await db.get(ProductionOrder, order_id)
    if not po:
        raise HTTPException(status_code=404, detail="Production order not found.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(po, field, val)

    await log_audit_trail(
        db=db,
        user=current_user,
        module="Production Orders",
        action="UPDATE",
        target_id=po.order_number,
        change_notes=f"Updated production order {po.order_number} parameters: {list(update_data.keys())}.",
    )
    await db.commit()
    await db.refresh(po)
    return po


@router.delete(
    "/{order_id}",
    response_model=MessageResponse,
    dependencies=[Depends(require_roles("ADMINISTRATOR"))],
)
async def delete_production_order(
    order_id: int,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    po = await db.get(ProductionOrder, order_id)
    if not po:
        raise HTTPException(status_code=404, detail="Production order not found.")

    num = po.order_number
    await release_reserved_materials_for_order(db, po)
    await db.delete(po)
    await log_audit_trail(
        db=db,
        user=current_user,
        module="Production Orders",
        action="DELETE",
        target_id=num,
        change_notes=f"Cancelled & purged production order {num}.",
    )
    await db.commit()
    return MessageResponse(message=f"Production order {num} cancelled and deleted.")

