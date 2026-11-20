from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select

from app.api.deps import SessionDep, CurrentUserDep, require_roles
from app.models.planning import SalesOrder, ProductionOrder
from app.models.master_data import Product
from app.schemas.planning import SalesOrderCreate, SalesOrderUpdate, SalesOrderResponse
from app.schemas.common import MessageResponse
from app.services.audit_service import log_audit_trail

router = APIRouter(prefix="/sales-orders", tags=["Demand & Sales Orders"])


@router.get("/", response_model=List[SalesOrderResponse])
async def list_sales_orders(
    db: SessionDep,
    status_filter: Optional[str] = Query(None, alias="status"),
):
    stmt = select(SalesOrder)
    if status_filter and status_filter != "ALL":
        stmt = stmt.where(SalesOrder.status == status_filter)
    stmt = stmt.order_by(SalesOrder.order_number.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{order_id}", response_model=SalesOrderResponse)
async def get_sales_order(order_id: int, db: SessionDep):
    so = await db.get(SalesOrder, order_id)
    if not so:
        raise HTTPException(status_code=404, detail="Sales order not found.")
    return so


@router.post(
    "/",
    response_model=SalesOrderResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("ADMINISTRATOR", "PRODUCTION_PLANNER"))],
)
async def create_sales_order(
    payload: SalesOrderCreate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    product = await db.get(Product, payload.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Target product not found.")

    exists = await db.execute(select(SalesOrder).where(SalesOrder.order_number == payload.order_number.strip()))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Order number '{payload.order_number}' already exists.")

    total_value = payload.total_value
    if total_value == 0.0:
        total_value = round(payload.quantity * product.selling_price, 2)

    order_dict = payload.model_dump()
    order_dict["total_value"] = total_value

    so = SalesOrder(**order_dict)
    db.add(so)
    await db.commit()
    await db.refresh(so)

    await log_audit_trail(
        db=db,
        user=current_user,
        module="Demand / Sales Orders",
        action="CREATE",
        target_id=so.order_number,
        change_notes=f"Created sales order {so.order_number} for {so.customer_name} ({so.quantity} {so.uom}, ${so.total_value:,.2f}).",
    )
    await db.commit()

    return so


@router.put(
    "/{order_id}",
    response_model=SalesOrderResponse,
    dependencies=[Depends(require_roles("ADMINISTRATOR", "PRODUCTION_PLANNER"))],
)
async def update_sales_order(
    order_id: int,
    payload: SalesOrderUpdate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    so = await db.get(SalesOrder, order_id)
    if not so:
        raise HTTPException(status_code=404, detail="Sales order not found.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(so, field, val)

    await log_audit_trail(
        db=db,
        user=current_user,
        module="Demand / Sales Orders",
        action="UPDATE",
        target_id=so.order_number,
        change_notes=f"Updated order terms for {so.order_number}: {list(update_data.keys())}.",
    )
    await db.commit()
    await db.refresh(so)
    return so


@router.delete(
    "/{order_id}",
    response_model=MessageResponse,
    dependencies=[Depends(require_roles("ADMINISTRATOR"))],
)
async def delete_sales_order(
    order_id: int,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    so = await db.get(SalesOrder, order_id)
    if not so:
        raise HTTPException(status_code=404, detail="Sales order not found.")

    num = so.order_number
    await db.delete(so)
    await log_audit_trail(
        db=db,
        user=current_user,
        module="Demand / Sales Orders",
        action="DELETE",
        target_id=num,
        change_notes=f"Cancelled sales order {num}.",
    )
    await db.commit()
    return MessageResponse(message=f"Sales order {num} cancelled successfully.")

