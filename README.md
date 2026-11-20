# NexFlow ERP — Manufacturing Production Planning System

**NexFlow ERP** is a complete, production-grade enterprise frontend for a Precision Manufacturing Production Planning System (ERP) designed for discrete manufacturing facilities (such as electric commuter bicycles, light electric vehicles, and precision machinery).

Built with **React 18**, **Vite**, **Tailwind CSS**, **Recharts**, and **Lucide React**.

---

## 1. System Architecture & Structure

```
src/
├── api/             # Axios client + mock API adapter interface
│   └── client.js    # Pre-configured REST client with interceptors
├── components/      # Shared enterprise UI design system
│   ├── Badge.jsx    # Semantic status badges (emerald, amber, rose, blue, purple)
│   ├── Button.jsx   # Button variants with loading spinners and icon slots
│   ├── ConfirmDialog.jsx # Confirmation dialogs for critical actions
│   ├── FormInput.jsx# FormInput, FormSelect, FormTextarea with validation
│   ├── Modal.jsx    # Accessible modal dialog with backdrop & keyboard handling
│   ├── StatCard.jsx # High-density KPI cards with trends
│   ├── Table.jsx    # Reusable multi-column sorting, pagination, and CSV export
│   └── WorkflowWalkthroughModal.jsx # 10-step end-to-end workflow runner
├── context/         # Centralized state engines
│   ├── AuthContext.jsx  # Role-Based Access Control (RBAC) simulator
│   ├── ERPContext.jsx   # State hub synchronized with localStorage & SI formulas
│   └── ToastContext.jsx # Non-blocking toast notifications
├── data/
│   └── initialData.js   # Interconnected manufacturing seed datasets (SI units only)
├── hooks/
│   ├── useMRP.js        # Gross-to-net requirements calculator
│   └── useTableFilter.js# Search, column sorting, pagination, and category filters
├── layouts/
│   ├── AppLayout.jsx    # Master shell with responsive drawer
│   ├── Sidebar.jsx      # Deep Navy sidebar filtered dynamically by active role
│   └── Topbar.jsx       # Breadcrumbs, quick search, role switcher, and alerts
├── modules/         # Dedicated screens for all 20 modules
│   ├── Dashboard.jsx
│   ├── ProductMaster.jsx
│   ├── BillOfMaterials.jsx
│   ├── RawMaterials.jsx
│   ├── Suppliers.jsx
│   ├── Inventory.jsx
│   ├── DemandOrders.jsx
│   ├── ProductionOrders.jsx
│   ├── MRP.jsx
│   ├── WorkCenters.jsx
│   ├── Machines.jsx
│   ├── ShiftsCalendar.jsx
│   ├── ProductionScheduling.jsx
│   ├── ProductionExecution.jsx
│   ├── QualityInspection.jsx
│   ├── MaterialConsumption.jsx
│   ├── FinishedGoods.jsx
│   ├── Reports.jsx
│   ├── AuditLogs.jsx
│   └── UserManagement.jsx
├── routes/
│   └── AppRoutes.jsx    # Route configuration with security guards
├── services/        # Service abstraction layer preparing for FastAPI backend
│   ├── apiAdapter.js
│   └── index.js
├── utils/
│   ├── exportCSV.js     # Client-side CSV generator
│   └── formatters.js    # Metric SI formatting, currency, and date formatters
├── App.jsx
└── main.jsx
```

---

## 2. Dedicated Modules (1 to 20)

1. **Dashboard:** Executive KPI tiles (OEE %, Active Production Orders, Shortages, Quality Pass Rate), Recharts output vs target, line utilization, and live activity feed.
2. **Product Master:** Finished SKU catalog, active revisions, unit costs, weight in kg, and technical specifications.
3. **Bill of Materials (BOM):** Multi-level component selector, scrap allowance %, component quantities per unit, and dynamic material cost computation.
4. **Raw Materials:** Standard metric registry (kg, units, meters, liters), safety stocks, lead times, and automated reorder threshold flags.
5. **Suppliers:** Supplier database, lead times, contact details, performance ratings, and linked raw material scopes.
6. **Inventory:** Multi-warehouse stock tracking, real-time formula evaluation (`Available Stock = On-Hand Stock - Reserved Stock`), reorder alerts, and stock transfers.
7. **Demand / Sales Orders:** Sales order entry, customer metadata, requested fulfillment date, priority, and one-click conversion to production orders.
8. **Production Orders:** Lifecycle state progression (`Draft` ➔ `Released` ➔ `In-Progress` ➔ `Inspection` ➔ `Completed`), batch quantity sizing, and priority overrides.
9. **Material Requirements Planning (MRP):** Automated gross-to-net calculation engine evaluating demand against on-hand stock with critical shortage tags and one-click requisition simulations.
10. **Work Centers:** Shop floor lines, daily hourly capacity, hourly operating cost, and efficiency ratings.
11. **Machines:** Machine inventory, work center assignments, operating status (`Running`, `Idle`, `Maintenance`), runtime meters, and maintenance intervals.
12. **Shifts & Calendar:** Factory working calendar, shift patterns (Morning, Afternoon, Night), active hours, and assigned workforce teams.
13. **Production Scheduling:** Visual scheduling Gantt timeline, work center and machine allocation, and active detection of machine double-booking conflicts.
14. **Production Execution:** Live floor execution run-cards, operator piece-count logging, scrap recording, operation progress bars, and start/pause/complete actions.
15. **Quality Inspection:** Strict validation enforcement: `Inspected Quantity = Accepted Quantity + Rejected Quantity`. Reason codes for rejections and auto-routing to Finished Goods.
16. **Material Consumption:** Backflushing and manual issue logs, comparing planned vs. actual consumption. System strictly blocks consumption exceeding available stock.
17. **Finished Goods:** Warehouse receipt register recording only quality-accepted finished units into finished inventory balances with QC certificates and dispatch controls.
18. **Reports:** Tabular and graphical reports with date-range filters, category breakdowns, and client-side CSV data export.
19. **Audit Logs:** Immutable audit log view capturing user role, timestamp, target module, action type, and change notes.
20. **User Management:** Mock user directory, role assignment, active/inactive toggles, and permissions preview.

---

## 3. Role-Based Access Control (RBAC) Simulator

Switch between 6 specialized manufacturing personas via the top-bar dropdown:
- **Administrator:** Full visibility and read/write privileges across all 20 modules.
- **Production Planner:** Focuses on BOM, Raw Materials, Demand Orders, Production Orders, MRP, and Scheduling.
- **Store / Inventory Officer:** Focuses on Raw Materials, Suppliers, Inventory Tracking, Receipts, and Material Consumption.
- **Production Supervisor:** Focuses on Work Centers, Machines, Shifts, Production Execution, and Line Progress.
- **Quality Inspector:** Focuses on Quality Inspections, Non-Conformance Reports, and Finished Goods.
- **Management Viewer:** Read-only access to Dashboards, KPI Reports, and Audit Trails.

---

## 4. End-to-End Operational Workflow

Click the **E2E Workflow Tour** button in the top navigation or sidebar to run or step through the cohesive 10-step lifecycle:
1. **Demand Order:** Create a sales order for 100 units of finished commuter bikes.
2. **BOM Resolution:** Resolve component materials and scrap buffer.
3. **MRP Calculation:** Evaluate on-hand vs. reserved stock to identify shortages and simulate auto-requisition.
4. **Production Order:** Convert demand into a production order.
5. **Scheduling:** Assign an available work center and machine, verifying zero schedule collisions.
6. **Execution:** Launch floor run-card and log progress to 100%.
7. **Quality Inspection:** Verify strict formula (`Inspected = Accepted + Rejected`).
8. **Consumption:** Post material consumption against inventory.
9. **Finished Goods Receipt:** Receive quality-accepted units into WH-03.
10. **Completion:** Mark order completed and verify the immutable audit log entry.

---

## 5. Development & Build

```bash
# Start development server
npm run dev

# Run production build
npm run build

# Preview production build
npm run preview
```

