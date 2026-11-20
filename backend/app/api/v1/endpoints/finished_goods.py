from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.api.deps import SessionDep, CurrentUserDep, require_roles
from app.models.inventory import FinishedGood
from app.schemas.inventory import (
    FinishedGoodResponse,
    FinishedGoodReceiveRequest,
    FinishedGoodDispatchRequest,
)
from app.schemas.common import MessageResponse
from app.services.inventory_service import receive_finished_goods_atomic
from app.services.audit_service import log_audit_trail

router = APIRouter(prefix="/finished-goods", tags=["Finished Goods Hub"])


@router.get("", response_model=List[FinishedGoodResponse])
@router.get("/", response_model=List[FinishedGoodResponse])
async def list_finished_goods(db: SessionDep):
    stmt = select(FinishedGood).order_by(FinishedGood.received_date.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post(
    "/receive",
    response_model=FinishedGoodResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("ADMINISTRATOR", "INVENTORY_OFFICER", "QUALITY_INSPECTOR"))],
)
async def receive_finished_goods_manual(
    payload: FinishedGoodReceiveRequest,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    fg = await receive_finished_goods_atomic(
        db=db,
        production_order_id=payload.production_order_id,
        product_id=payload.product_id,
        quantity=payload.quantity_received,
        warehouse_id=payload.warehouse_id,
        bin_location=payload.bin_location,
        quality_cert_number=payload.quality_cert_number,
        current_user=current_user,
    )
    await db.commit()
    await db.refresh(fg)
    return fg


@router.post(
    "/dispatch",
    response_model=MessageResponse,
    dependencies=[Depends(require_roles("ADMINISTRATOR", "INVENTORY_OFFICER"))],
)
async def dispatch_finished_goods(
    payload: FinishedGoodDispatchRequest,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    fg = await db.get(FinishedGood, payload.finished_good_id)
    if not fg:
        raise HTTPException(status_code=404, detail="Finished goods record not found.")

    if payload.dispatch_quantity > fg.available_balance:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot dispatch {payload.dispatch_quantity}. Only {fg.available_balance} {fg.uom} available in warehouse.",
        )

    fg.dispatched_quantity = round(fg.dispatched_quantity + payload.dispatch_quantity, 4)
    fg.available_balance = max(0.0, round(fg.available_balance - payload.dispatch_quantity, 4))

    await log_audit_trail(
        db=db,
        user=current_user,
        module="Finished Goods",
        action="UPDATE",
        target_id=fg.receipt_number,
        change_notes=f"Dispatched {payload.dispatch_quantity} {fg.uom} of {fg.receipt_number}. Remaining: {fg.available_balance} {fg.uom}.",
    )
    await db.commit()

    return MessageResponse(
        message=f"Dispatched {payload.dispatch_quantity} {fg.uom}. New available balance: {fg.available_balance} {fg.uom}."
    )

