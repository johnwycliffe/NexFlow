import os
import sys

# Ensure backend root is in sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

import asyncio
import logging
from datetime import date, datetime, timedelta
from sqlalchemy import select, text
from sqlalchemy.orm import selectinload
from app.core.database import async_session_factory, async_engine, Base
from app.core.security import hash_password
from app.models.user import User, RoleEnum, Department, Role, Permission, RolePermission, UserRole
from app.models.master_data import Product, BOM, BOMItem, RawMaterial, Supplier
from app.models.inventory import Warehouse, StockItem, FinishedGood
from app.models.execution import WorkCenter, Machine, Shift
from app.models.planning import SalesOrder, ProductionOrder
from app.services.mrp_service import run_mrp_engine

logger = logging.getLogger("erp.seed")


async def safe_migrate_user_columns(conn):
    """Additive check for existing users table columns."""
    try:
        query = text(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS "
            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'"
        )
        res = await conn.execute(query)
        existing_cols = {row[0].lower() for row in res.fetchall()}

        if "department_id" not in existing_cols:
            print("[SEED MIGRATION] Adding column 'department_id' to users table...")
            await conn.execute(text("ALTER TABLE users ADD COLUMN department_id INT NULL"))
            try:
                await conn.execute(text(
                    "ALTER TABLE users ADD CONSTRAINT fk_users_department "
                    "FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL"
                ))
            except Exception as fk_err:
                print(f"[SEED MIGRATION] Note on fk_users_department: {fk_err}")

        if "job_title" not in existing_cols:
            print("[SEED MIGRATION] Adding column 'job_title' to users table...")
            await conn.execute(text("ALTER TABLE users ADD COLUMN job_title VARCHAR(150) NOT NULL DEFAULT 'Staff Officer'"))

        try:
            await conn.execute(text("ALTER TABLE users MODIFY COLUMN email VARCHAR(255) NULL"))
            await conn.execute(text("ALTER TABLE users MODIFY COLUMN hashed_password VARCHAR(255) NULL"))
        except Exception as e:
            print(f"[SEED MIGRATION] Note on column nullability: {e}")
    except Exception as e:
        print(f"[SEED MIGRATION] Notice: {e}")


async def seed_all_demo_data():
    print("[SEED DATA] Starting comprehensive manufacturing seed data injection...")

    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await safe_migrate_user_columns(conn)

    async with async_session_factory() as db:
        # ====================================================================
        # 1. Seed Organizational Hierarchy: Departments
        # ====================================================================
        departments_data = [
            ("Plant Operations & IT", "Core plant infrastructure, systems administration, and IT operations."),
            ("Supply Chain & Planning", "Demand management, master production scheduling, and MRP calculation."),
            ("Warehouse & Logistics", "Raw material receipt, inventory ledger tracking, and logistics."),
            ("Shop Floor Operations", "Work center management, machining, and production execution."),
            ("Quality Assurance", "Inspection plans, defect logging, and quality compliance."),
            ("Executive Board", "Strategic governance, audit trails, and financial analytics."),
        ]
        dept_map = {}
        for dept_name, dept_desc in departments_data:
            dept = (await db.execute(select(Department).where(Department.name == dept_name))).scalar_one_or_none()
            if not dept:
                dept = Department(name=dept_name, description=dept_desc, is_active=True)
                db.add(dept)
                await db.flush()
            dept_map[dept_name] = dept

        # ====================================================================
        # 2. Seed Granular Permissions (All 20 Modules)
        # ====================================================================
        permissions_data = [
            ("users.read", "users", "View user accounts and profiles"),
            ("users.create", "users", "Create new system users"),
            ("users.update", "users", "Modify user profiles and details"),
            ("users.delete", "users", "Remove or deactivate user accounts"),
            ("roles.manage", "roles", "Configure roles and permission matrices"),
            ("departments.manage", "departments", "Configure organizational departments"),
            ("credentials.manage", "credentials", "Manage hierarchy officer credentials and authentication sessions"),
            ("products.read", "products", "View finished product catalog and specifications"),
            ("products.write", "products", "Create and edit product master records"),
            ("bom.read", "bom", "View engineering Bills of Materials (BOM)"),
            ("bom.write", "bom", "Create and modify multi-level engineering BOMs"),
            ("raw_materials.read", "raw_materials", "View raw material catalogs and stock parameters"),
            ("raw_materials.write", "raw_materials", "Create and update raw material master records"),
            ("suppliers.read", "suppliers", "View certified suppliers and ratings"),
            ("suppliers.write", "suppliers", "Onboard and update vendor agreements and SLAs"),
            ("inventory.read", "inventory", "View inventory ledgers, on-hand, and reservations"),
            ("inventory.write", "inventory", "Adjust stock levels, transfers, and warehouse bins"),
            ("demand_orders.read", "demand_orders", "View incoming sales and customer demand orders"),
            ("demand_orders.write", "demand_orders", "Register and update demand orders"),
            ("production_orders.read", "production_orders", "View production orders and batch progress"),
            ("production_orders.write", "production_orders", "Create, release, and reschedule production orders"),
            ("mrp.execute", "mrp", "Execute MRP net-requirement calculation engine"),
            ("work_centers.read", "work_centers", "View factory work center capacities"),
            ("work_centers.write", "work_centers", "Manage work centers and routing parameters"),
            ("machines.read", "machines", "Monitor plant machinery and operational statuses"),
            ("machines.write", "machines", "Configure machines and maintenance states"),
            ("shifts.read", "shifts", "View operational calendars and work shifts"),
            ("shifts.write", "shifts", "Manage shift timetables and active schedules"),
            ("scheduling.read", "scheduling", "View shop floor Gantt and forward dispatch schedules"),
            ("scheduling.write", "scheduling", "Run finite-capacity scheduling and dispatch jobs"),
            ("execution.write", "execution", "Log operator job run steps and station progress"),
            ("consumption.write", "consumption", "Record raw material consumption and scrap against orders"),
            ("quality.read", "quality", "View quality inspection plans and pass/fail logs"),
            ("quality.write", "quality", "Perform inspections and log defect dispositions"),
            ("finished_goods.read", "finished_goods", "View serial numbers and finished goods stock"),
            ("finished_goods.write", "finished_goods", "Receipt completed goods into logistics centers"),
            ("reports.read", "reports", "View executive KPI reports, financial yields, and analytics"),
            ("audit_logs.read", "audit_logs", "Inspect immutable regulatory system audit trails"),
        ]
        perm_map = {}
        for p_key, m_key, p_desc in permissions_data:
            perm = (await db.execute(select(Permission).where(Permission.permission_key == p_key))).scalar_one_or_none()
            if not perm:
                perm = Permission(permission_key=p_key, module_key=m_key, description=p_desc)
                db.add(perm)
                await db.flush()
            perm_map[p_key] = perm

        # ====================================================================
        # 3. Seed 6 Canonical Roles & Permissions Mapping
        # ====================================================================
        all_perm_keys = list(perm_map.keys())
        roles_data = [
            (
                "Administrator",
                "Full unrestricted system access across all 20 modules.",
                True,
                all_perm_keys,
            ),
            (
                "Production Planner",
                "Manage demand, production orders, BOMs, and execute MRP engine.",
                True,
                [
                    "products.read", "bom.read", "bom.write", "raw_materials.read",
                    "inventory.read", "demand_orders.read", "demand_orders.write",
                    "production_orders.read", "production_orders.write", "mrp.execute",
                    "scheduling.read", "reports.read", "audit_logs.read",
                ],
            ),
            (
                "Store / Inventory Officer",
                "Manage warehouse inventory, receipts, suppliers, and finished goods.",
                True,
                [
                    "products.read", "raw_materials.read", "raw_materials.write",
                    "suppliers.read", "suppliers.write", "inventory.read", "inventory.write",
                    "demand_orders.read", "production_orders.read", "consumption.write",
                    "finished_goods.read", "finished_goods.write", "reports.read",
                ],
            ),
            (
                "Production Supervisor",
                "Oversee shop floor execution, machines, shifts, and scheduling.",
                True,
                [
                    "products.read", "bom.read", "raw_materials.read", "work_centers.read",
                    "work_centers.write", "machines.read", "machines.write", "shifts.read",
                    "shifts.write", "scheduling.read", "scheduling.write", "execution.write",
                    "consumption.write", "production_orders.read", "production_orders.write",
                    "quality.read", "reports.read",
                ],
            ),
            (
                "Quality Inspector",
                "Execute quality inspection protocols and log defect dispositions.",
                True,
                [
                    "products.read", "production_orders.read", "execution.write",
                    "quality.read", "quality.write", "finished_goods.read",
                    "reports.read", "audit_logs.read",
                ],
            ),
            (
                "Management Viewer",
                "Read-only operational visibility across dashboards, KPIs, and reports.",
                True,
                [
                    "users.read", "products.read", "bom.read", "raw_materials.read",
                    "suppliers.read", "inventory.read", "demand_orders.read",
                    "production_orders.read", "work_centers.read", "machines.read",
                    "shifts.read", "scheduling.read", "quality.read", "finished_goods.read",
                    "reports.read", "audit_logs.read",
                ],
            ),
        ]
        role_map = {}
        for r_name, r_desc, is_sys, p_keys in roles_data:
            role = (await db.execute(select(Role).where(Role.role_name == r_name))).scalar_one_or_none()
            if not role:
                role = Role(role_name=r_name, description=r_desc, is_system_role=is_sys, is_active=True)
                db.add(role)
                await db.flush()

            for k in p_keys:
                if k in perm_map:
                    perm = perm_map[k]
                    rp_exists = (await db.execute(
                        select(RolePermission).where(
                            RolePermission.role_id == role.id,
                            RolePermission.permission_id == perm.id
                        )
                    )).scalar_one_or_none()
                    if not rp_exists:
                        db.add(RolePermission(role_id=role.id, permission_id=perm.id))

            role_map[r_name] = role

        await db.flush()

        # ====================================================================
        # 4. Seed Canonical Officers (Role-Idempotent: Never overwrite existing custom officers)
        # ====================================================================
        officers_data = [
            {
                "name": "Alexander Vance",
                "email": "admin@nexflow.mfg",
                "job_title": "Plant Operations Administrator",
                "dept": "Plant Operations & IT",
                "role_name": "Administrator",
                "role_enum": RoleEnum.ADMINISTRATOR,
            },
            {
                "name": "Diana",
                "email": "e.rostova@mfg-nexflow.com",
                "job_title": "Production Planner",
                "dept": "Supply Chain & Planning",
                "role_name": "Production Planner",
                "role_enum": RoleEnum.PRODUCTION_PLANNER,
            },
            {
                "name": "Santhosh",
                "email": "d.oconnor@mfg-nexflow.com",
                "job_title": "Store / Inventory Officer",
                "dept": "Warehouse & Logistics",
                "role_name": "Store / Inventory Officer",
                "role_enum": RoleEnum.INVENTORY_OFFICER,
            },
            {
                "name": "Barry Allen",
                "email": "h.weber@mfg-nexflow.com",
                "job_title": "Production Supervisor",
                "dept": "Shop Floor Operations",
                "role_name": "Production Supervisor",
                "role_enum": RoleEnum.PRODUCTION_SUPERVISOR,
            },
            {
                "name": "Clark kent",
                "email": "c.lindqvist@mfg-nexflow.com",
                "job_title": "Quality Inspector",
                "dept": "Quality Assurance",
                "role_name": "Quality Inspector",
                "role_enum": RoleEnum.QUALITY_INSPECTOR,
            },
            {
                "name": "Bruce Wayne",
                "email": "m.sterling@mfg-nexflow.com",
                "job_title": "Executive Manager",
                "dept": "Executive Board",
                "role_name": "Management Viewer",
                "role_enum": RoleEnum.MANAGEMENT_VIEWER,
            },
        ]

        for off in officers_data:
            assigned_dept = dept_map.get(off["dept"])
            assigned_role = role_map.get(off["role_name"])

            # Check if an active officer already holds this role
            existing_for_role = (await db.execute(
                select(User).where(User.role == off["role_enum"], User.is_active == True)
            )).scalars().first()

            if existing_for_role:
                # Active officer already exists for this role - preserve custom names & details
                if assigned_role:
                    ur_exists = (await db.execute(
                        select(UserRole).where(
                            UserRole.user_id == existing_for_role.id,
                            UserRole.role_id == assigned_role.id
                        )
                    )).scalar_one_or_none()
                    if not ur_exists:
                        db.add(UserRole(user_id=existing_for_role.id, role_id=assigned_role.id))
                continue

            # Fallback: create initial officer for this role if none exists
            email = off["email"]
            user = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
            if not user:
                user = User(
                    email=email,
                    full_name=off["name"],
                    hashed_password=hash_password("Demo@123456"),
                    role=off["role_enum"],
                    department=off["dept"],
                    department_id=assigned_dept.id if assigned_dept else None,
                    job_title=off["job_title"],
                    is_active=True,
                )
                db.add(user)
                await db.flush()

            if assigned_role:
                ur_exists = (await db.execute(
                    select(UserRole).where(
                        UserRole.user_id == user.id,
                        UserRole.role_id == assigned_role.id
                    )
                )).scalar_one_or_none()
                if not ur_exists:
                    db.add(UserRole(user_id=user.id, role_id=assigned_role.id))

        await db.commit()

        # 2. Seed Warehouses
        warehouses_data = [
            ("WH-01", "Central Raw Material Depot", "Building A, North Wing", "RAW_MATERIALS"),
            ("WH-02", "Shop Floor Staging & WIP Buffer", "Building B, Ground Floor", "WIP_BUFFER"),
            ("WH-03", "Finished Goods Logistics Center", "Building C, Bay 1-4", "FINISHED_GOODS"),
        ]
        warehouse_map = {}
        for code, name, loc, w_type in warehouses_data:
            wh = (await db.execute(select(Warehouse).where(Warehouse.code == code))).scalar_one_or_none()
            if not wh:
                wh = Warehouse(code=code, name=name, location=loc, warehouse_type=w_type)
                db.add(wh)
                await db.flush()
            warehouse_map[code] = wh

        # 3. Seed Suppliers
        suppliers_data = [
            ("SUP-001", "AluMax Precision Extrusions GmbH", "Germany", "Stuttgart", "Klaus Lindner", "k.lindner@alumax-extrusions.de", 4.9, 12, 99.4, "Net 30", "Metals & Frames"),
            ("SUP-002", "VoltCell Power Dynamics BV", "Netherlands", "Eindhoven", "Sophie Van Der Meer", "sophie@voltcell-power.nl", 4.8, 18, 98.7, "Net 45", "Electrical & Power"),
            ("SUP-003", "TorqueTech Electric Motors Spa", "Italy", "Bologna", "Marco Rossi", "m.rossi@torquetech-motors.it", 4.7, 16, 97.9, "Net 30", "Powertrain"),
            ("SUP-004", "VeloDrive Component Systems SA", "France", "Lyon", "Antoine Dupont", "adupont@velodrive-sys.fr", 4.6, 10, 98.2, "Net 30", "Braking Systems, Transmission"),
            ("SUP-005", "AeroTire Rubber & Polymers Ltd", "United Kingdom", "Birmingham", "David Miller", "dmiller@aerotire.co.uk", 4.5, 8, 99.1, "Net 15", "Wheels & Rubber"),
        ]
        supplier_map = {}
        for code, name, country, city, contact, email, rating, lead, pass_rate, terms, cats in suppliers_data:
            sup = (await db.execute(select(Supplier).where(Supplier.code == code))).scalar_one_or_none()
            if not sup:
                sup = Supplier(
                    code=code, name=name, country=country, city=city, contact_person=contact,
                    email=email, rating=rating, lead_time_days=lead, quality_pass_rate=pass_rate,
                    payment_terms=terms, linked_categories=cats
                )
                db.add(sup)
                await db.flush()
            supplier_map[code] = sup

        # 4. Seed Raw Materials (SI units only: kg, units, meters, liters)
        materials_data = [
            ("RM-ALU-6061", "Aluminum 6061-T6 Extruded Tubing", "Metals & Frames", "kg", 6.80, 350.0, 500.0, 12, supplier_map["SUP-001"].id, "Dry Racks"),
            ("RM-BAT-21700", "Lithium Li-Ion 21700 Cell Module (48V 14Ah)", "Electrical & Power", "units", 185.00, 80.0, 120.0, 20, supplier_map["SUP-002"].id, "Climate Controlled 18-22C"),
            ("RM-MOT-HUB250", "Brushless Geared Hub Motor (250W 36V)", "Powertrain", "units", 92.00, 60.0, 90.0, 15, supplier_map["SUP-003"].id, "Moisture Sealed"),
            ("RM-MOT-MID500", "Mid-Drive Torque Motor (500W 48V)", "Powertrain", "units", 175.00, 40.0, 60.0, 18, supplier_map["SUP-003"].id, "Moisture Sealed"),
            ("RM-BRK-HYD", "Hydraulic Disc Brake Assembly", "Braking Systems", "units", 48.50, 100.0, 150.0, 10, supplier_map["SUP-004"].id, "Standard Racks"),
            ("RM-GRS-7SPD", "7-Speed Shimano Transmission Drivetrain", "Transmission", "units", 38.00, 75.0, 110.0, 10, supplier_map["SUP-004"].id, "Standard Racks"),
            ("RM-TIR-275", "Puncture-Resistant Kenda Tire 27.5x2.1", "Wheels & Rubber", "units", 14.50, 150.0, 220.0, 8, supplier_map["SUP-005"].id, "UV Protected"),
            ("RM-TUB-275", "Reinforced Butyl Inner Tube 27.5", "Wheels & Rubber", "units", 3.20, 200.0, 300.0, 6, supplier_map["SUP-005"].id, "Dry Store"),
            ("RM-DSP-LCD", "Smart Color TFT LCD Display & Remote", "Electrical & Power", "units", 34.00, 90.0, 130.0, 14, supplier_map["SUP-002"].id, "ESD Storage"),
            ("RM-CTR-48V", "Sine-Wave Intelligent Motor Controller", "Electrical & Power", "units", 42.00, 70.0, 100.0, 14, supplier_map["SUP-002"].id, "ESD Storage"),
            ("RM-WRG-HARN", "Molded Waterproof Wiring Harness", "Electrical & Power", "meters", 4.80, 300.0, 450.0, 9, supplier_map["SUP-002"].id, "Dry Racks"),
            ("RM-PNT-BLK", "Electrostatic Polyester Powder Coat", "Coatings & Chemicals", "kg", 11.20, 120.0, 180.0, 7, supplier_map["SUP-001"].id, "Sealed Drum"),
            ("RM-FST-KIT", "Precision Stainless Steel Fastener Kit", "Hardware", "units", 7.50, 250.0, 350.0, 5, supplier_map["SUP-004"].id, "Standard Bins"),
            ("RM-CHN-E7", "Rust-Proof E-Bike Drive Chain", "Transmission", "meters", 6.20, 150.0, 220.0, 8, supplier_map["SUP-004"].id, "Oiled Pack"),
        ]
        material_map = {}
        for code, name, cat, uom, cost, safety, reorder, lead, sup_id, cond in materials_data:
            mat = (await db.execute(select(RawMaterial).where(RawMaterial.code == code))).scalar_one_or_none()
            if not mat:
                mat = RawMaterial(
                    code=code, name=name, category=cat, uom=uom, unit_cost=cost,
                    safety_stock=safety, reorder_level=reorder, lead_time_days=lead,
                    default_supplier_id=sup_id, storage_condition=cond
                )
                db.add(mat)
                await db.flush()
            material_map[code] = mat

        # 5. Seed Stock Items (Showing healthy stock & intentional shortage in RM-MOT-MID500 for MRP showcase)
        initial_stock = {
            "RM-ALU-6061": (850.0, 120.0),
            "RM-BAT-21700": (140.0, 50.0),
            "RM-MOT-HUB250": (110.0, 40.0),
            "RM-MOT-MID500": (35.0, 20.0),  # Available = 15 < Safety (40) -> SHORTAGE ALERT
            "RM-BRK-HYD": (180.0, 50.0),
            "RM-GRS-7SPD": (95.0, 30.0),
            "RM-TIR-275": (320.0, 100.0),
            "RM-TUB-275": (420.0, 100.0),
            "RM-DSP-LCD": (130.0, 40.0),
            "RM-CTR-48V": (85.0, 30.0),
            "RM-WRG-HARN": (620.0, 180.0),
            "RM-PNT-BLK": (240.0, 70.0),
            "RM-FST-KIT": (480.0, 90.0),
            "RM-CHN-E7": (280.0, 80.0),
        }
        for code, (on_hand, reserved) in initial_stock.items():
            mat = material_map[code]
            stock = (await db.execute(select(StockItem).where(StockItem.warehouse_id == warehouse_map["WH-01"].id, StockItem.material_id == mat.id))).scalar_one_or_none()
            if not stock:
                available = on_hand - reserved
                status_str = "IN_STOCK" if available > mat.safety_stock else ("LOW_STOCK" if available > 0 else "OUT_OF_STOCK")
                stock = StockItem(
                    warehouse_id=warehouse_map["WH-01"].id,
                    material_id=mat.id,
                    location_bin=f"BIN-{code.replace('RM-', '')}",
                    on_hand_qty=on_hand,
                    reserved_qty=reserved,
                    unit_cost=mat.unit_cost,
                    last_count_date=date.today(),
                    status=status_str,
                )
                db.add(stock)

        # 6. Seed Finished Products
        products_data = [
            ("EBIKE-URB-250", "EcoRide Urban Commuter 250W", "Commuter E-Bikes", "Rev C.2", 642.50, 1299.00, 19.8, 7),
            ("EBIKE-TRL-500", "VoltSport Cross-Trail 500W", "All-Terrain E-Bikes", "Rev B.1", 885.00, 1799.00, 22.4, 10),
            ("EBIKE-CRG-750", "CargoHaul Heavy-Duty 750W", "Commercial Cargo", "Rev A.4", 1140.00, 2450.00, 29.5, 14),
        ]
        product_map = {}
        for sku, name, cat, rev, cost, price, wt, lead in products_data:
            prod = (await db.execute(select(Product).where(Product.sku == sku))).scalar_one_or_none()
            if not prod:
                prod = Product(
                    sku=sku, name=name, category=cat, revision=rev, unit="units",
                    unit_cost=cost, selling_price=price, weight_kg=wt, lead_time_days=lead,
                    status="ACTIVE", description=f"Precision engineered {name}."
                )
                db.add(prod)
                await db.flush()
            product_map[sku] = prod

        # 7. Seed BOM for EcoRide Urban Commuter 250W
        urb_prod = product_map["EBIKE-URB-250"]
        existing_bom = (await db.execute(select(BOM).where(BOM.product_id == urb_prod.id))).scalar_one_or_none()
        if not existing_bom:
            bom = BOM(
                product_id=urb_prod.id,
                bom_code="BOM-EBIKE-URB-REV2",
                version="2.0",
                scrap_allowance_percent=3.5,
                total_calculated_cost=642.50,
                is_active=True,
                effective_date="2026-01-01",
            )
            db.add(bom)
            await db.flush()

            bom_components = [
                ("RM-ALU-6061", 6.2),
                ("RM-BAT-21700", 1.0),
                ("RM-MOT-HUB250", 1.0),
                ("RM-BRK-HYD", 1.0),
                ("RM-GRS-7SPD", 1.0),
                ("RM-TIR-275", 2.0),
                ("RM-TUB-275", 2.0),
                ("RM-DSP-LCD", 1.0),
                ("RM-CTR-48V", 1.0),
                ("RM-WRG-HARN", 3.5),
                ("RM-PNT-BLK", 1.4),
                ("RM-FST-KIT", 1.0),
                ("RM-CHN-E7", 1.5),
            ]
            for m_code, qty in bom_components:
                mat = material_map[m_code]
                item = BOMItem(
                    bom_id=bom.id,
                    material_id=mat.id,
                    quantity_per_unit=qty,
                    uom=mat.uom,
                    unit_cost=mat.unit_cost,
                    subtotal=round(qty * mat.unit_cost, 2),
                )
                db.add(item)

        # 8. Seed Work Centers & Machines
        wc_data = [
            ("WC-FAB", "Frame Fabrication & TIG Welding", "Metal Fabrication", "Sector A", 16.0, 85.00, 94.5),
            ("WC-COAT", "Automated Powder Coating & Curing", "Finishing", "Sector B", 16.0, 65.00, 96.0),
            ("WC-ELEC", "Battery & Electronics Subassembly", "Electrical Engineering", "Cleanroom C", 16.0, 95.00, 98.2),
            ("WC-ASSY", "Final Mechanical Assembly Line", "Final Integration", "Main Line D", 20.0, 110.00, 92.8),
            ("WC-QA-PACK", "QA Dyno Testing & Packaging", "Quality & Dispatch", "Sector E", 16.0, 75.00, 97.5),
        ]
        wc_map = {}
        for code, name, dept, loc, cap, rate, eff in wc_data:
            wc = (await db.execute(select(WorkCenter).where(WorkCenter.code == code))).scalar_one_or_none()
            if not wc:
                wc = WorkCenter(
                    code=code, name=name, department=dept, location=loc,
                    max_capacity_hours_per_day=cap, hourly_operating_cost=rate, efficiency_rating=eff
                )
                db.add(wc)
                await db.flush()
            wc_map[code] = wc

        machines_data = [
            ("CNC-BEND-01", "CNC 5-Axis Tube Bender TB-01", wc_map["WC-FAB"].id, "Running", 3410.5),
            ("ROB-WELD-02", "Robotic TIG Welder RW-02", wc_map["WC-FAB"].id, "Running", 4120.0),
            ("POWD-BOOTH-01", "Electrostatic Powder Booth PB-01", wc_map["WC-COAT"].id, "Running", 2980.0),
            ("BAT-TEST-01", "Battery Cell Spot Welder BS-01", wc_map["WC-ELEC"].id, "Idle", 1870.0),
            ("ASSY-RIG-A", "Assembly Line Rig A", wc_map["WC-ASSY"].id, "Running", 5210.0),
            ("DYNO-QA-01", "Dyno Bike Tester Station DT-01", wc_map["WC-QA-PACK"].id, "Idle", 2140.0),
        ]
        mc_map = {}
        for code, name, wc_id, status_str, runtime in machines_data:
            mc = (await db.execute(select(Machine).where(Machine.code == code))).scalar_one_or_none()
            if not mc:
                mc = Machine(
                    code=code, name=name, work_center_id=wc_id, status=status_str, runtime_hours=runtime
                )
                db.add(mc)
                await db.flush()
            mc_map[code] = mc

        # 9. Seed Shifts
        shifts_data = [
            ("SHIFT-MORN", "Morning Shift", "06:00", "14:00", 8.0, "Heinrich Weber", "Alpha Crew", 22, "#3b82f6"),
            ("SHIFT-AFTN", "Afternoon Shift", "14:00", "22:00", 8.0, "Elena Rostova", "Bravo Crew", 18, "#10b981"),
            ("SHIFT-NGHT", "Night Shift", "22:00", "06:00", 8.0, "Viktor Dahl", "Charlie Crew", 8, "#8b5cf6"),
        ]
        for code, name, st, et, dur, sup, team, count, col in shifts_data:
            sh = (await db.execute(select(Shift).where(Shift.code == code))).scalar_one_or_none()
            if not sh:
                sh = Shift(
                    code=code, name=name, start_time=st, end_time=et, duration_hours=dur,
                    supervisor=sup, assigned_team=team, worker_count=count, color_hex=col
                )
                db.add(sh)

        # 10. Seed Sales Demand & Production Orders
        so_data = [
            ("SO-2026-001", "Nordic Velocity Mobility AS", "Distributor", "procurement@nordicvelocity.no", "Oslo Hub, Norway", urb_prod.id, 100.0, date.today(), date.today() + timedelta(days=20), "Urgent", "PENDING_PLANNING", 129900.0),
            ("SO-2026-002", "Berlin Metro Fleet Services", "Municipal Fleet", "fleet@berlin-mobility.de", "Berlin Depot West, Germany", urb_prod.id, 60.0, date.today() - timedelta(days=4), date.today() + timedelta(days=15), "Normal", "IN_PRODUCTION", 77940.0),
        ]
        for num, cust, c_type, email, dest, p_id, qty, o_date, d_date, pri, st, val in so_data:
            so = (await db.execute(select(SalesOrder).where(SalesOrder.order_number == num))).scalar_one_or_none()
            if not so:
                so = SalesOrder(
                    order_number=num, customer_name=cust, customer_type=c_type, customer_email=email,
                    destination=dest, product_id=p_id, quantity=qty, uom="units", order_date=o_date,
                    requested_delivery_date=d_date, priority=pri, status=st, total_value=val
                )
                db.add(so)

        po_data = [
            ("PO-2026-101", urb_prod.id, 60.0, "Normal", "In-Progress", 65, wc_map["WC-ASSY"].id, mc_map["ASSY-RIG-A"].id, date.today() - timedelta(days=3), date.today() + timedelta(days=8)),
            ("PO-2026-102", product_map["EBIKE-TRL-500"].id, 40.0, "Normal", "Released", 20, wc_map["WC-FAB"].id, mc_map["ROB-WELD-02"].id, date.today(), date.today() + timedelta(days=12)),
            ("PO-2026-104", urb_prod.id, 30.0, "Low", "Completed", 100, wc_map["WC-QA-PACK"].id, mc_map["DYNO-QA-01"].id, date.today() - timedelta(days=10), date.today() - timedelta(days=2)),
        ]
        for num, p_id, qty, pri, st, prog, wc_id, mc_id, s_date, d_date in po_data:
            po = (await db.execute(select(ProductionOrder).where(ProductionOrder.order_number == num))).scalar_one_or_none()
            if not po:
                po = ProductionOrder(
                    order_number=num, product_id=p_id, batch_quantity=qty, uom="units",
                    priority=pri, status=st, progress_percent=prog, work_center_id=wc_id,
                    machine_id=mc_id, start_date=s_date, due_date=d_date, actual_start_date=s_date
                )
                db.add(po)

        await db.commit()
        print("[SEED DATA] Core models seeded. Running initial MRP calculation...")

        # Run initial MRP
        await run_mrp_engine(db)

    print("[SEED DATA] Comprehensive demo seed dataset injected successfully!")


if __name__ == "__main__":
    asyncio.run(seed_all_demo_data())
