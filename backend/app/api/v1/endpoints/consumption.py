from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy import select

from app.api.deps import SessionDep, CurrentUserDep, require_roles
from app.models.quality import MaterialConsumption
from app.schemas.quality import MaterialConsumptionCreate, MaterialConsumptionResponse
from app.services.inventory_service import consume_material_atomic

router = APIRouter(prefix="/material-consumption", tags=["Material Consumption & Backflushing"])


@router.get("", response_model=List[MaterialConsumptionResponse])
@router.get("/", response_model=List[MaterialConsumptionResponse])
async def list_material_consumptions(
    db: SessionDep,
    production_order_id: Optional[int] = Query(None),
):
    stmt = select(MaterialConsumption)
    if production_order_id:
        stmt = stmt.where(MaterialConsumption.production_order_id == production_order_id)
    stmt = stmt.order_by(MaterialConsumption.logged_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post(
    "/",
    response_model=MaterialConsumptionResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("ADMINISTRATOR", "INVENTORY_OFFICER", "PRODUCTION_SUPERVISOR"))],
)
async def post_material_consumption(
    payload: MaterialConsumptionCreate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    """
    Post material issue/backflush to shop floor.
    Strict Invariant: System strictly blocks consumption exceeding available inventory.
    """
    consumption = await consume_material_atomic(
        db=db,
        production_order_id=payload.production_order_id,
        material_id=payload.material_id,
        warehouse_id=payload.warehouse_id,
        planned_qty=payload.planned_quantity,
        actual_qty=payload.actual_quantity,
        consumption_type=payload.consumption_type,
        current_user=current_user,
    )
    await db.commit()
    await db.refresh(consumption)
    return consumption

