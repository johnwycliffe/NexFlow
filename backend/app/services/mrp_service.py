from datetime import datetime
from collections import defaultdict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.planning import ProductionOrder, SalesOrder, MRPRun, MRPItem
from app.models.master_data import Product, BOM, BOMItem, RawMaterial
from app.models.inventory import StockItem
from app.services.audit_service import log_audit_trail


async def run_mrp_engine(db: AsyncSession, current_user = None) -> MRPRun:
    """
    Executes gross-to-net MRP explosion across active demand commitments and active production orders.
    Calculates shortages taking scrap factor into account.
    """
    # 1. Fetch all raw materials
    materials_res = await db.execute(select(RawMaterial))
    raw_materials = materials_res.scalars().all()
    materials_dict = {m.id: m for m in raw_materials}

    # 2. Fetch inventory for warehouse 1
    stock_res = await db.execute(select(StockItem).where(StockItem.warehouse_id == 1))
    stock_items = stock_res.scalars().all()
    stock_dict = {s.material_id: s for s in stock_items}

    # 3. Fetch active BOMs
    boms_res = await db.execute(
        select(BOM)
        .options(selectinload(BOM.items))
        .where(BOM.is_active == True)
    )
    boms = boms_res.scalars().all()
    bom_by_product = {b.product_id: b for b in boms}

    # 4. Gross demand accumulator
    gross_demand = defaultdict(float)

    # 4a. Active Sales Orders (PENDING_PLANNING or IN_PRODUCTION)
    sales_orders_res = await db.execute(
        select(SalesOrder).where(SalesOrder.status.in_(["PENDING_PLANNING", "IN_PRODUCTION"]))
    )
    sales_orders = sales_orders_res.scalars().all()
    for so in sales_orders:
        bom = bom_by_product.get(so.product_id)
        if not bom or not bom.items:
            continue
        scrap_factor = 1.0 + (bom.scrap_allowance_percent / 100.0)
        for item in bom.items:
            req = round(so.quantity * item.quantity_per_unit * scrap_factor, 4)
            gross_demand[item.material_id] += req

    # 4b. Active Production Orders not yet completed (Released, In-Progress, Inspection) without double-counting
    po_res = await db.execute(
        select(ProductionOrder).where(ProductionOrder.status.in_(["Released", "In-Progress", "Inspection"]))
    )
    production_orders = po_res.scalars().all()
    for po in production_orders:
        if po.sales_order_id:
            # Already accounted for in sales order demand
            continue
        bom = bom_by_product.get(po.product_id)
        if not bom or not bom.items:
            continue
        scrap_factor = 1.0 + (bom.scrap_allowance_percent / 100.0)
        for item in bom.items:
            req = round(po.batch_quantity * item.quantity_per_unit * scrap_factor, 4)
            gross_demand[item.material_id] += req

    # 5. Build MRP Run record
    mrp_run = MRPRun(
        run_date=datetime.now(),
        created_by=current_user.full_name if current_user else "SYSTEM",
        status="SUCCESS",
        total_shortages=0,
        estimated_capital_required=0.0,
    )
    db.add(mrp_run)
    await db.flush()

    total_shortages = 0
    estimated_capital = 0.0

    # 6. Evaluate Net Shortage for each material
    for mat_id, mat in materials_dict.items():
        gross = round(gross_demand[mat_id], 4)
        stock = stock_dict.get(mat_id)
        on_hand = round(stock.on_hand_qty, 4) if stock else 0.0
        reserved = round(stock.reserved_qty, 4) if stock else 0.0
        available = max(0.0, round(on_hand - reserved, 4))

        # Net shortage considering gross and safety stock
        required_buffer = gross + mat.safety_stock
        net = max(0.0, round(required_buffer - on_hand, 4))
        immediate_shortage = max(0.0, round(gross - available, 4))

        action = "BALANCED"
        if immediate_shortage > 0:
            action = "CRITICAL_SHORTAGE"
            total_shortages += 1
            estimated_capital += round(immediate_shortage * mat.unit_cost, 2)
        elif net > 0 or available <= mat.safety_stock:
            action = "REORDER_RECOMMENDED"
            estimated_capital += round(net * mat.unit_cost, 2)

        mrp_item = MRPItem(
            mrp_run_id=mrp_run.id,
            material_id=mat_id,
            gross_requirement=gross,
            on_hand_stock=on_hand,
            reserved_stock=reserved,
            available_stock=available,
            net_shortage=immediate_shortage if immediate_shortage > 0 else net,
            safety_stock=mat.safety_stock,
            action_recommended=action,
            status="ACTIVE",
        )
        db.add(mrp_item)

    mrp_run.total_shortages = total_shortages
    mrp_run.estimated_capital_required = round(estimated_capital, 2)

    await log_audit_trail(
        db=db,
        user=current_user,
        module="MRP Engine",
        action="CREATE",
        target_id=str(mrp_run.id),
        change_notes=f"Executed MRP Run #{mrp_run.id}: {total_shortages} critical shortage(s) flagged. Capital needed: ${estimated_capital:,.2f}.",
    )

    await db.commit()
    await db.refresh(mrp_run)
    return mrp_run

