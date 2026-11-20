from datetime import date
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.inventory import StockItem, StockMovement, FinishedGood, Warehouse
from app.models.master_data import RawMaterial, BOM, BOMItem, Product
from app.models.planning import ProductionOrder, SalesOrder
from app.models.quality import MaterialConsumption
from app.services.audit_service import log_audit_trail


async def get_or_create_stock_item(
    db: AsyncSession,
    warehouse_id: int,
    material_id: int,
    unit_cost: float = 0.0,
    bin_location: str = "RACK-A1",
) -> StockItem:
    stmt = select(StockItem).where(
        StockItem.warehouse_id == warehouse_id,
        StockItem.material_id == material_id,
    )
    result = await db.execute(stmt)
    stock_item = result.scalar_one_or_none()
    if not stock_item:
        stock_item = StockItem(
            warehouse_id=warehouse_id,
            material_id=material_id,
            location_bin=bin_location,
            on_hand_qty=0.0,
            reserved_qty=0.0,
            unit_cost=unit_cost,
            last_count_date=date.today(),
            status="IN_STOCK",
        )
        db.add(stock_item)
        await db.flush()
    return stock_item


async def reserve_materials_for_order(
    db: AsyncSession,
    production_order: ProductionOrder,
    warehouse_id: int = 1,
) -> None:
    """
    When Production Order transitions to RELEASED,
    explodes active BOM and atomically reserves required raw materials.
    """
    # Find active BOM for product
    bom_stmt = (
        select(BOM)
        .options(selectinload(BOM.items))
        .where(BOM.product_id == production_order.product_id, BOM.is_active == True)
    )
    bom_res = await db.execute(bom_stmt)
    active_bom = bom_res.scalar_one_or_none()
    if not active_bom or not active_bom.items:
        return

    scrap_factor = 1.0 + (active_bom.scrap_allowance_percent / 100.0)

    for item in active_bom.items:
        required_qty = round(production_order.batch_quantity * item.quantity_per_unit * scrap_factor, 4)
        stock_item = await get_or_create_stock_item(db, warehouse_id=warehouse_id, material_id=item.material_id, unit_cost=item.unit_cost)
        stock_item.reserved_qty = round(stock_item.reserved_qty + required_qty, 4)
        # Update status
        if stock_item.available_qty <= 0:
            stock_item.status = "OUT_OF_STOCK"
        elif stock_item.available_qty <= 50:
            stock_item.status = "LOW_STOCK"
        else:
            stock_item.status = "IN_STOCK"

    await db.flush()


async def release_reserved_materials_for_order(
    db: AsyncSession,
    production_order: ProductionOrder,
    warehouse_id: int = 1,
) -> None:
    """When a production order is cancelled or completed, releases reserved stock."""
    bom_stmt = (
        select(BOM)
        .options(selectinload(BOM.items))
        .where(BOM.product_id == production_order.product_id, BOM.is_active == True)
    )
    bom_res = await db.execute(bom_stmt)
    active_bom = bom_res.scalar_one_or_none()
    if not active_bom or not active_bom.items:
        return

    scrap_factor = 1.0 + (active_bom.scrap_allowance_percent / 100.0)

    for item in active_bom.items:
        reserved_qty = round(production_order.batch_quantity * item.quantity_per_unit * scrap_factor, 4)
        stock_item = await get_or_create_stock_item(db, warehouse_id=warehouse_id, material_id=item.material_id, unit_cost=item.unit_cost)
        stock_item.reserved_qty = max(0.0, round(stock_item.reserved_qty - reserved_qty, 4))
        if stock_item.available_qty <= 0:
            stock_item.status = "OUT_OF_STOCK"
        elif stock_item.available_qty <= 50:
            stock_item.status = "LOW_STOCK"
        else:
            stock_item.status = "IN_STOCK"

    await db.flush()


async def consume_material_atomic(
    db: AsyncSession,
    production_order_id: int,
    material_id: int,
    warehouse_id: int,
    planned_qty: float,
    actual_qty: float,
    consumption_type: str = "BACKFLUSH",
    current_user = None,
) -> MaterialConsumption:
    """
    Atomically posts material consumption.
    Strict Invariant: actual_qty CANNOT exceed available inventory!
    Deducts from both on_hand_qty and reserved_qty.
    """
    stock_item = await get_or_create_stock_item(db, warehouse_id=warehouse_id, material_id=material_id)
    available = stock_item.available_qty

    if actual_qty > available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Deterministic Invariant Violation: Requested consumption ({actual_qty}) "
                f"strictly exceeds currently available inventory ({available}) "
                f"in warehouse ID {warehouse_id}!"
            ),
        )

    # Fetch raw material for UOM & unit cost
    mat = await db.get(RawMaterial, material_id)
    uom = mat.uom if mat else "units"
    unit_cost = mat.unit_cost if mat else stock_item.unit_cost

    # Atomic deductions
    stock_item.on_hand_qty = max(0.0, round(stock_item.on_hand_qty - actual_qty, 4))
    stock_item.reserved_qty = max(0.0, round(stock_item.reserved_qty - actual_qty, 4))

    if stock_item.available_qty <= 0:
        stock_item.status = "OUT_OF_STOCK"
    elif stock_item.available_qty <= (mat.safety_stock if mat else 50):
        stock_item.status = "LOW_STOCK"
    else:
        stock_item.status = "IN_STOCK"

    # Create MaterialConsumption record
    variance = round(actual_qty - planned_qty, 4)
    total_cost = round(actual_qty * unit_cost, 2)

    consumption = MaterialConsumption(
        production_order_id=production_order_id,
        material_id=material_id,
        warehouse_id=warehouse_id,
        planned_quantity=planned_qty,
        actual_quantity=actual_qty,
        variance=variance,
        uom=uom,
        unit_cost=unit_cost,
        total_cost=total_cost,
        consumption_type=consumption_type,
        status="POSTED",
    )
    db.add(consumption)

    # Log movement
    movement = StockMovement(
        material_id=material_id,
        movement_type="ISSUE",
        quantity=actual_qty,
        uom=uom,
        from_warehouse_id=warehouse_id,
        reference_id=f"PO-{production_order_id}",
        notes=f"{consumption_type} issue for Production Order #{production_order_id}",
    )
    db.add(movement)

    await log_audit_trail(
        db=db,
        user=current_user,
        module="Material Consumption",
        action="CREATE",
        target_id=str(production_order_id),
        change_notes=f"Consumed {actual_qty} {uom} of material ID {material_id} for PO #{production_order_id}.",
    )

    await db.flush()
    return consumption


async def transfer_stock_atomic(
    db: AsyncSession,
    material_id: int,
    from_warehouse_id: int,
    to_warehouse_id: int,
    quantity: float,
    notes: str | None = None,
    current_user = None,
) -> StockMovement:
    """Atomically transfers stock between two warehouses."""
    source_stock = await get_or_create_stock_item(db, warehouse_id=from_warehouse_id, material_id=material_id)
    if source_stock.available_qty < quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient available stock ({source_stock.available_qty}) in source warehouse {from_warehouse_id}.",
        )

    dest_stock = await get_or_create_stock_item(db, warehouse_id=to_warehouse_id, material_id=material_id, unit_cost=source_stock.unit_cost)

    # Deduct source
    source_stock.on_hand_qty = round(source_stock.on_hand_qty - quantity, 4)
    if source_stock.available_qty <= 0:
        source_stock.status = "OUT_OF_STOCK"
    elif source_stock.available_qty <= 50:
        source_stock.status = "LOW_STOCK"

    # Add destination
    dest_stock.on_hand_qty = round(dest_stock.on_hand_qty + quantity, 4)
    dest_stock.status = "IN_STOCK"

    mat = await db.get(RawMaterial, material_id)
    uom = mat.uom if mat else "units"

    movement = StockMovement(
        material_id=material_id,
        movement_type="TRANSFER",
        quantity=quantity,
        uom=uom,
        from_warehouse_id=from_warehouse_id,
        to_warehouse_id=to_warehouse_id,
        reference_id=f"TRF-{date.today().strftime('%Y%m%d')}",
        notes=notes or "Internal Staging Transfer",
    )
    db.add(movement)

    await log_audit_trail(
        db=db,
        user=current_user,
        module="Inventory",
        action="UPDATE",
        target_id=str(material_id),
        change_notes=f"Transferred {quantity} {uom} from WH {from_warehouse_id} to WH {to_warehouse_id}.",
    )

    await db.flush()
    return movement


async def receive_finished_goods_atomic(
    db: AsyncSession,
    production_order_id: int,
    product_id: int,
    quantity: float,
    warehouse_id: int,
    bin_location: str,
    quality_cert_number: str,
    current_user = None,
) -> FinishedGood:
    """
    Receives quality-certified units into Finished Goods warehouse.
    Marks Production Order as COMPLETED and completes linked Sales Order if applicable.
    """
    po = await db.get(ProductionOrder, production_order_id)
    if not po:
        raise HTTPException(status_code=404, detail="Production order not found.")

    product = await db.get(Product, product_id)
    unit_cost = product.unit_cost if product else 500.0
    total_val = round(quantity * unit_cost, 2)

    receipt_count_query = select(FinishedGood)
    res = await db.execute(receipt_count_query)
    total_count = len(res.scalars().all())

    receipt_number = f"FGR-{date.today().strftime('%Y')}-{str(total_count + 1).padStart(3, '0') if hasattr(str, 'padStart') else str(total_count + 1).zfill(3)}"

    fg = FinishedGood(
        receipt_number=receipt_number,
        production_order_id=production_order_id,
        product_id=product_id,
        quantity_received=quantity,
        uom=po.uom,
        warehouse_id=warehouse_id,
        bin_location=bin_location,
        unit_cost=unit_cost,
        total_valuation=total_val,
        quality_cert_number=quality_cert_number,
        dispatched_quantity=0.0,
        available_balance=quantity,
        received_date=date.today(),
    )
    db.add(fg)

    # Mark PO Completed
    po.status = "Completed"
    po.progress_percent = 100
    po.completed_date = date.today()

    # Complete linked sales order if full quantity met
    if po.sales_order_id:
        so = await db.get(SalesOrder, po.sales_order_id)
        if so:
            so.status = "COMPLETED"

    await log_audit_trail(
        db=db,
        user=current_user,
        module="Finished Goods",
        action="CREATE",
        target_id=receipt_number,
        change_notes=f"Received {quantity} {po.uom} into WH {warehouse_id} with Cert {quality_cert_number}. Order {po.order_number} marked Completed.",
    )

    await db.flush()
    return fg

