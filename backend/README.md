# NexFlow ERP — Production Planning System (FastAPI + MySQL Backend)

An asynchronous, enterprise-grade backend REST API for a manufacturing **Production Planning System (ERP)** supporting all 20 operational modules: Master Data, BOM Recipes, Raw Materials (SI units), Suppliers, Multi-Warehouse Inventory, Sales Demand, Production Orders, MRP Engine, Work Centers, Machines, Shifts, Gantt Scheduling, Floor Execution, Quality Inspections, Material Consumption, Finished Goods, Reports, Audit Trail, and RBAC Security.

---

## 🛠️ Technology Stack
- **Web Framework:** FastAPI (Asynchronous `async def` endpoints)
- **Database Engine:** MySQL 8.0+ (via `asyncmy` or `aiomysql`) / SQLite async (`aiosqlite`) fallback for local dev
- **ORM & Migrations:** SQLAlchemy 2.0 (`Mapped`, `mapped_column`, `AsyncSession`) + Alembic
- **Validation & Settings:** Pydantic v2 (`BaseModel`, `field_validator`, `model_validator`) + `pydantic-settings`
- **Security:** OAuth2 Password Bearer with JWT (`pyjwt`, `passlib` with `bcrypt`)
- **Reporting:** Streaming CSV exporter and OEE analytics calculation

---

## 📐 Directory Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── deps.py                  # DB session injection, JWT auth, require_roles RBAC guard
│   │   └── v1/
│   │       ├── router.py            # Master router aggregating all 20 module endpoints
│   │       └── endpoints/           # Individual routers for each module
│   ├── core/
│   │   ├── config.py                # Pydantic BaseSettings, JWT secrets, CORS
│   │   ├── database.py              # async_engine, async_sessionmaker, Base
│   │   ├── init_app.py              # First-time interactive terminal admin prompt
│   │   └── security.py              # bcrypt password hashing & JWT token generation
│   ├── models/                      # SQLAlchemy 2.0 ORM Declarative Models
│   │   ├── base.py                  # TimestampMixin (created_at, updated_at)
│   │   ├── user.py                  # User, RoleEnum, AuditLog
│   │   ├── master_data.py           # Product, BOM, BOMItem, RawMaterial, Supplier
│   │   ├── inventory.py             # Warehouse, StockItem, StockMovement, FinishedGood
│   │   ├── planning.py              # SalesOrder, ProductionOrder, MRPRun, MRPItem
│   │   ├── execution.py             # WorkCenter, Machine, Shift, ProductionSchedule, ExecutionLog
│   │   └── quality.py               # QualityInspection, MaterialConsumption
│   ├── schemas/                     # Pydantic v2 validation models
│   └── services/                    # Encapsulated transactional business logic
│       ├── mrp_service.py           # Gross-to-net BOM explosion engine
│       ├── inventory_service.py     # Atomic reservations, stock movements, consumption
│       ├── schedule_service.py      # Double-booking collision detection (HTTP 409)
│       └── audit_service.py         # Centralized immutable compliance logger
├── scripts/
│   └── seed_data.py                 # Comprehensive seed data script
├── alembic/                         # Database migration environment
├── requirements.txt
├── alembic.ini
├── .env.example
└── README.md
```

---

## 🚀 Setup & Execution Guide

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `DATABASE_URL` in `.env`:
- For MySQL 8.0:
  ```env
  DATABASE_URL="mysql+asyncmy://root:your_password@localhost:3306/nexflow_erp"
  ```
- For async SQLite (immediate local development):
  ```env
  DATABASE_URL="sqlite+aiosqlite:///./nexflow_erp.db"
  ```

### 3. First-Time Interactive Admin Setup
On first startup, the system verifies whether an `ADMINISTRATOR` exists. If not, it interactively prompts in the terminal:
```bash
python -m app.core.init_app
```
Example prompt:
```
=================================================================
  [ERP SETUP] No administrator account detected.
  First-time deployment initialization.
=================================================================
  Admin Email: admin@mfg-nexflow.com
  Admin Full Name: Lead Production Admin
  Admin Password: (masked)
  Confirm Password: (masked)

  [ERP SETUP] Administrator initialized successfully. Proceeding to launch...
=================================================================
```

### 4. Inject Operational Demo Seed Data
Populate default mock accounts for the 5 other roles, catalog products, BOM components, machines, inventory, and demand:
```bash
python -m scripts.seed_data
```

### 5. Launch the FastAPI Application
```bash
uvicorn app.main:app --reload --port 8000
```
- Interactive Swagger UI: **`http://localhost:8000/api/v1/docs`**
- ReDoc Documentation: **`http://localhost:8000/api/v1/redoc`**

---

## 👥 Role-Based Access Control (RBAC) Matrix

| Role | Access Scope |
| :--- | :--- |
| **`ADMINISTRATOR`** | Full R/W CRUD across all 20 modules |
| **`PRODUCTION_PLANNER`** | Product Master, BOM, Raw Materials, Sales Orders, Production Orders, MRP, Scheduling |
| **`INVENTORY_OFFICER`** | Raw Materials, Suppliers, Warehouse Stock, Inventory Movements, Finished Goods |
| **`PRODUCTION_SUPERVISOR`** | Work Centers, Machines, Shifts, Schedules, Execution Run-Cards |
| **`QUALITY_INSPECTOR`** | Quality Inspections, Non-Conformance Reports, Finished Goods Receipts |
| **`MANAGEMENT_VIEWER`** | Read-only access to Executive Dashboards, KPI Reports, and Compliance Audit Trails |

---

## ⚙️ Deterministic Business Logic & Invariants

1. **Inventory Formula:**
   $$\text{Available Stock} = \text{On-Hand Stock} - \text{Reserved Stock}$$
2. **Quality Inspection Check:**
   $$\text{Inspected Quantity} = \text{Accepted Quantity} + \text{Rejected Quantity}$$
3. **Consumption Blocking:** System blocks material consumption if requested quantity exceeds available stock balance.
4. **Machine Collision Rejection:** Double-booking overlapping time slots on the same machine returns **HTTP 409 Conflict**.

