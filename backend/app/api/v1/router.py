from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    products,
    bom,
    raw_materials,
    suppliers,
    inventory,
    sales_orders,
    production_orders,
    mrp,
    work_centers,
    machines,
    shifts,
    schedules,
    execution,
    quality,
    consumption,
    finished_goods,
    reports,
    audit_logs,
    users,
    roles,
    credentials,
    production_metrics,
)

api_router = APIRouter()

# Include Main Sub-routers
api_router.include_router(auth.router)
api_router.include_router(products.router)
api_router.include_router(bom.router)
api_router.include_router(raw_materials.router)
api_router.include_router(suppliers.router)
api_router.include_router(inventory.router)
api_router.include_router(sales_orders.router)
api_router.include_router(production_orders.router)
api_router.include_router(mrp.router)
api_router.include_router(work_centers.router)
api_router.include_router(machines.router)
api_router.include_router(shifts.router)
api_router.include_router(schedules.router)
api_router.include_router(execution.router)
api_router.include_router(quality.router)
api_router.include_router(consumption.router)
api_router.include_router(finished_goods.router)
api_router.include_router(reports.router)
api_router.include_router(audit_logs.router)
api_router.include_router(users.router)
api_router.include_router(roles.router)
api_router.include_router(credentials.router)
api_router.include_router(production_metrics.router)


@api_router.get("/health", tags=["Health"])
async def api_health():
    return {
        "status": "HEALTHY",
        "database": "CONNECTED",
        "unit_system": "METRIC_SI",
        "api_version": "v1",
    }


