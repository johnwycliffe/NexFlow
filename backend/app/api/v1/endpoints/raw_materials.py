from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select

from app.api.deps import SessionDep, CurrentUserDep, require_roles
from app.models.master_data import RawMaterial
from app.models.inventory import StockItem
from app.schemas.master_data import RawMaterialCreate, RawMaterialUpdate, RawMaterialResponse
from app.schemas.common import MessageResponse
from app.services.audit_service import log_audit_trail
from app.services.inventory_service import get_or_create_stock_item

router = APIRouter(prefix="/raw-materials", tags=["Raw Materials & Catalog"])


@router.get("/", response_model=List[RawMaterialResponse])
async def list_raw_materials(
    db: SessionDep,
    category: Optional[str] = Query(None),
):
    stmt = select(RawMaterial)
    if category and category != "ALL":
        stmt = stmt.where(RawMaterial.category == category)
    stmt = stmt.order_by(RawMaterial.code.asc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{material_id}", response_model=RawMaterialResponse)
async def get_raw_material(material_id: int, db: SessionDep):
    mat = await db.get(RawMaterial, material_id)
    if not mat:
        raise HTTPException(status_code=404, detail="Raw material not found.")
    return mat


@router.post(
    "/",
    response_model=RawMaterialResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("ADMINISTRATOR", "PRODUCTION_PLANNER", "INVENTORY_OFFICER"))],
)
async def create_raw_material(
    payload: RawMaterialCreate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    # Enforce SI unit verification
    valid_units = ["kg", "metric_tons", "meters", "liters", "units"]
    if payload.uom.lower() not in valid_units:
        raise HTTPException(
            status_code=400,
            detail=f"Unit '{payload.uom}' is invalid. System strictly requires Metric/SI units: {valid_units}."
        )

    exists = await db.execute(select(RawMaterial).where(RawMaterial.code == payload.code.strip()))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Material with code '{payload.code}' already exists.")

    mat = RawMaterial(**payload.model_dump())
    db.add(mat)
    await db.commit()
    await db.refresh(mat)

    # Auto-initialize inventory record in Warehouse 1 (Central Raw Store)
    await get_or_create_stock_item(db, warehouse_id=1, material_id=mat.id, unit_cost=mat.unit_cost)

    await log_audit_trail(
        db=db,
        user=current_user,
        module="Raw Materials",
        action="CREATE",
        target_id=mat.code,
        change_notes=f"Registered raw material {mat.code} ({mat.name}) with safety stock {mat.safety_stock} {mat.uom}.",
    )
    await db.commit()

    return mat


@router.put(
    "/{material_id}",
    response_model=RawMaterialResponse,
    dependencies=[Depends(require_roles("ADMINISTRATOR", "PRODUCTION_PLANNER", "INVENTORY_OFFICER"))],
)
async def update_raw_material(
    material_id: int,
    payload: RawMaterialUpdate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    mat = await db.get(RawMaterial, material_id)
    if not mat:
        raise HTTPException(status_code=404, detail="Raw material not found.")

    update_data = payload.model_dump(exclude_unset=True)
    if "uom" in update_data:
        valid_units = ["kg", "metric_tons", "meters", "liters", "units"]
        if update_data["uom"].lower() not in valid_units:
            raise HTTPException(status_code=400, detail=f"Invalid unit. Must be one of {valid_units}.")

    for field, val in update_data.items():
        setattr(mat, field, val)

    await log_audit_trail(
        db=db,
        user=current_user,
        module="Raw Materials",
        action="UPDATE",
        target_id=mat.code,
        change_notes=f"Updated parameters for {mat.code}: {list(update_data.keys())}.",
    )
    await db.commit()
    await db.refresh(mat)
    return mat


@router.delete(
    "/{material_id}",
    response_model=MessageResponse,
    dependencies=[Depends(require_roles("ADMINISTRATOR"))],
)
async def delete_raw_material(
    material_id: int,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    mat = await db.get(RawMaterial, material_id)
    if not mat:
        raise HTTPException(status_code=404, detail="Raw material not found.")

    code = mat.code
    await db.delete(mat)
    await log_audit_trail(
        db=db,
        user=current_user,
        module="Raw Materials",
        action="DELETE",
        target_id=code,
        change_notes=f"Deleted raw material {code}.",
    )
    await db.commit()
    return MessageResponse(message=f"Material {code} deleted successfully.")

