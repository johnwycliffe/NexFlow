from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import SessionDep, CurrentUserDep, require_roles
from app.models.master_data import Product
from app.schemas.master_data import ProductCreate, ProductUpdate, ProductResponse
from app.schemas.common import MessageResponse
from app.services.audit_service import log_audit_trail

router = APIRouter(prefix="/products", tags=["Product Master"])


@router.get("/", response_model=List[ProductResponse])
async def list_products(
    db: SessionDep,
    category: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
):
    stmt = select(Product)
    if category and category != "ALL":
        stmt = stmt.where(Product.category == category)
    if status_filter and status_filter != "ALL":
        stmt = stmt.where(Product.status == status_filter)
    stmt = stmt.order_by(Product.sku.asc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: SessionDep):
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    return product


@router.post(
    "/",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("ADMINISTRATOR", "PRODUCTION_PLANNER"))],
)
async def create_product(
    payload: ProductCreate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    # Check duplicate SKU
    exists = await db.execute(select(Product).where(Product.sku == payload.sku.strip()))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Product with SKU '{payload.sku}' already exists.")

    product = Product(**payload.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)

    await log_audit_trail(
        db=db,
        user=current_user,
        module="Product Master",
        action="CREATE",
        target_id=product.sku,
        change_notes=f"Created product {product.sku} ({product.name}) with standard unit cost ${product.unit_cost}.",
    )
    await db.commit()

    return product


@router.put(
    "/{product_id}",
    response_model=ProductResponse,
    dependencies=[Depends(require_roles("ADMINISTRATOR", "PRODUCTION_PLANNER"))],
)
async def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(product, field, val)

    await log_audit_trail(
        db=db,
        user=current_user,
        module="Product Master",
        action="UPDATE",
        target_id=product.sku,
        change_notes=f"Updated product {product.sku} parameters: {list(update_data.keys())}.",
    )
    await db.commit()
    await db.refresh(product)
    return product


@router.delete(
    "/{product_id}",
    response_model=MessageResponse,
    dependencies=[Depends(require_roles("ADMINISTRATOR"))],
)
async def delete_product(
    product_id: int,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    sku = product.sku
    await db.delete(product)
    await log_audit_trail(
        db=db,
        user=current_user,
        module="Product Master",
        action="DELETE",
        target_id=sku,
        change_notes=f"Archived product SKU {sku}.",
    )
    await db.commit()
    return MessageResponse(message=f"Product {sku} deleted successfully.")

