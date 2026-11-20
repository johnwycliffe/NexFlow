from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.api.deps import SessionDep, CurrentUserDep, require_roles
from app.models.master_data import Supplier
from app.schemas.master_data import SupplierCreate, SupplierUpdate, SupplierResponse
from app.schemas.common import MessageResponse
from app.services.audit_service import log_audit_trail

router = APIRouter(prefix="/suppliers", tags=["Suppliers & Vendors"])


@router.get("/", response_model=List[SupplierResponse])
async def list_suppliers(db: SessionDep):
    stmt = select(Supplier).order_by(Supplier.rating.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


async def _find_supplier(identifier: str, db: SessionDep) -> Supplier:
    if str(identifier).isdigit():
        sup = await db.get(Supplier, int(identifier))
        if sup:
            return sup
    stmt = select(Supplier).where(Supplier.code == str(identifier).strip())
    result = await db.execute(stmt)
    sup = result.scalar_one_or_none()
    if not sup:
        raise HTTPException(status_code=404, detail=f"Supplier '{identifier}' not found.")
    return sup


@router.get("/{supplier_id}", response_model=SupplierResponse)
async def get_supplier(supplier_id: str, db: SessionDep):
    return await _find_supplier(supplier_id, db)


@router.post(
    "/",
    response_model=SupplierResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("ADMINISTRATOR", "INVENTORY_OFFICER"))],
)
async def create_supplier(
    payload: SupplierCreate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    exists = await db.execute(select(Supplier).where(Supplier.code == payload.code.strip()))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Supplier code '{payload.code}' already registered.")

    sup = Supplier(**payload.model_dump())
    db.add(sup)
    await db.commit()
    await db.refresh(sup)

    await log_audit_trail(
        db=db,
        user=current_user,
        module="Suppliers",
        action="CREATE",
        target_id=sup.code,
        change_notes=f"Onboarded supplier {sup.name} ({sup.country}) with lead time {sup.lead_time_days} days.",
    )
    await db.commit()

    return sup


@router.put(
    "/{supplier_id}",
    response_model=SupplierResponse,
    dependencies=[Depends(require_roles("ADMINISTRATOR", "INVENTORY_OFFICER"))],
)
async def update_supplier(
    supplier_id: str,
    payload: SupplierUpdate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    sup = await _find_supplier(supplier_id, db)

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(sup, field, val)

    await log_audit_trail(
        db=db,
        user=current_user,
        module="Suppliers",
        action="UPDATE",
        target_id=sup.code,
        change_notes=f"Updated supplier record {sup.code}: {list(update_data.keys())}.",
    )
    await db.commit()
    await db.refresh(sup)
    return sup


@router.delete(
    "/{supplier_id}",
    response_model=MessageResponse,
    dependencies=[Depends(require_roles("ADMINISTRATOR"))],
)
async def delete_supplier(
    supplier_id: str,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    sup = await _find_supplier(supplier_id, db)

    name = sup.name
    await db.delete(sup)
    await log_audit_trail(
        db=db,
        user=current_user,
        module="Suppliers",
        action="DELETE",
        target_id=sup.code,
        change_notes=f"Removed vendor {name}.",
    )
    await db.commit()
    return MessageResponse(message=f"Supplier {name} removed.")

