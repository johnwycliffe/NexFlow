from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import SessionDep, CurrentUserDep
from app.models.user import User, RoleEnum
from app.models.production_metrics import WeeklyProductionMetric
from app.schemas.production_metrics import (
    ProductionMetricCreate,
    ProductionMetricUpdate,
    ProductionMetricBatchUpdate,
    ProductionMetricResponse,
)
from app.services.audit_service import log_audit_trail
from app.models.base import utc_now

router = APIRouter(prefix="/production-metrics", tags=["Production Metrics"])

BASELINE_WEEK_SCHEDULE = [
    ("Mon", 1, 25, 24, 1),
    ("Tue", 2, 25, 26, 0),
    ("Wed", 3, 30, 29, 1),
    ("Thu", 4, 30, 31, 2),
    ("Fri", 5, 25, 23, 0),
    ("Sat", 6, 15, 16, 1),
    ("Sun", 7, 0, 0, 0),
]


def _check_can_edit_metrics(user: User):
    """Enforces that only Administrator or officers with production write privileges can modify metrics."""
    role_str = str(user.role.value if hasattr(user.role, "value") else user.role).upper()
    if role_str == "ADMINISTRATOR" or getattr(user, "is_superuser", False):
        return True

    user_perms = set()
    for r in (user.roles or []):
        for p in (r.permissions or []):
            user_perms.add(p.permission_key)

    if (
        "production_orders.write" in user_perms
        or "execution.write" in user_perms
        or "production.write" in user_perms
    ):
        return True

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied. Only Administrator or authorized production planners may modify weekly output metrics.",
    )


@router.get("", response_model=List[ProductionMetricResponse])
@router.get("/", response_model=List[ProductionMetricResponse])
async def get_weekly_metrics(
    db: SessionDep,
    current_user: CurrentUserDep,
    week_label: str = Query("Week 46 - 2026", description="Label of production week"),
):
    """
    Retrieve 7-day Weekly Production Output metrics for the given week.
    Auto-initializes the week from manufacturing baseline schedule if not yet seeded in MySQL.
    """
    stmt = (
        select(WeeklyProductionMetric)
        .where(WeeklyProductionMetric.week_label == week_label)
        .order_by(WeeklyProductionMetric.day_order.asc())
    )
    result = await db.execute(stmt)
    metrics = result.scalars().all()

    if not metrics:
        # Auto-seed the 7 days in MySQL
        for day_name, order, target, actual, scrap in BASELINE_WEEK_SCHEDULE:
            metric = WeeklyProductionMetric(
                week_label=week_label,
                day_of_week=day_name,
                day_order=order,
                target_units=target,
                actual_units=actual,
                scrap_units=scrap,
                updated_by="System Initializer",
                updated_at=utc_now(),
            )
            db.add(metric)
        await db.commit()

        # Re-query newly created rows
        res2 = await db.execute(stmt)
        metrics = res2.scalars().all()

    return metrics


@router.post("", response_model=ProductionMetricResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ProductionMetricResponse, status_code=status.HTTP_201_CREATED)
async def create_or_upsert_metric(
    payload: ProductionMetricCreate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    """Create or upsert a daily production output metric."""
    _check_can_edit_metrics(current_user)

    stmt = select(WeeklyProductionMetric).where(
        WeeklyProductionMetric.week_label == payload.week_label,
        WeeklyProductionMetric.day_of_week == payload.day_of_week,
    )
    existing = (await db.execute(stmt)).scalar_one_or_none()

    updater_name = current_user.full_name or current_user.email or "Administrator"

    if existing:
        existing.day_order = payload.day_order
        existing.target_units = payload.target_units
        existing.actual_units = payload.actual_units
        existing.scrap_units = payload.scrap_units
        existing.updated_by = updater_name
        existing.updated_at = utc_now()
        await db.commit()
        await db.refresh(existing)
        target_obj = existing
    else:
        new_metric = WeeklyProductionMetric(
            week_label=payload.week_label,
            day_of_week=payload.day_of_week,
            day_order=payload.day_order,
            target_units=payload.target_units,
            actual_units=payload.actual_units,
            scrap_units=payload.scrap_units,
            updated_by=updater_name,
            updated_at=utc_now(),
        )
        db.add(new_metric)
        await db.commit()
        await db.refresh(new_metric)
        target_obj = new_metric

    await log_audit_trail(
        db=db,
        user=current_user,
        module="Production Metrics",
        action="UPSERT",
        change_notes=f"Saved daily metrics for {target_obj.day_of_week} ({target_obj.week_label}): Target={target_obj.target_units}, Actual={target_obj.actual_units}, Scrap={target_obj.scrap_units}",
        target_id=str(target_obj.id),
    )
    await db.commit()

    return target_obj


@router.put("/batch/{week_label}", response_model=List[ProductionMetricResponse])
async def batch_update_weekly_metrics(
    week_label: str,
    payload: ProductionMetricBatchUpdate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    """
    Bulk update/save all daily metrics for a production week in a single MySQL transaction.
    """
    _check_can_edit_metrics(current_user)

    updater_name = current_user.full_name or current_user.email or "Administrator"
    day_order_map = {"Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6, "Sun": 7}

    for item in payload.metrics:
        order = item.day_order or day_order_map.get(item.day_of_week, 1)

        stmt = select(WeeklyProductionMetric).where(
            WeeklyProductionMetric.week_label == week_label,
            WeeklyProductionMetric.day_of_week == item.day_of_week,
        )
        record = (await db.execute(stmt)).scalar_one_or_none()

        if record:
            record.target_units = item.target_units
            record.actual_units = item.actual_units
            record.scrap_units = item.scrap_units
            record.updated_by = updater_name
            record.updated_at = utc_now()
        else:
            new_metric = WeeklyProductionMetric(
                week_label=week_label,
                day_of_week=item.day_of_week,
                day_order=order,
                target_units=item.target_units,
                actual_units=item.actual_units,
                scrap_units=item.scrap_units,
                updated_by=updater_name,
                updated_at=utc_now(),
            )
            db.add(new_metric)

    await db.commit()

    await log_audit_trail(
        db=db,
        user=current_user,
        module="Production Metrics",
        action="BATCH_UPDATE",
        change_notes=f"Executive updated 7-day output schedule for {week_label}",
        target_id=week_label,
    )
    await db.commit()

    # Return updated list
    stmt_all = (
        select(WeeklyProductionMetric)
        .where(WeeklyProductionMetric.week_label == week_label)
        .order_by(WeeklyProductionMetric.day_order.asc())
    )
    result = await db.execute(stmt_all)
    return result.scalars().all()


@router.put("/{metric_id}", response_model=ProductionMetricResponse)
async def update_metric_by_id(
    metric_id: int,
    payload: ProductionMetricUpdate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    """Edit individual day's targets and actuals."""
    _check_can_edit_metrics(current_user)

    metric = await db.get(WeeklyProductionMetric, metric_id)
    if not metric:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Production metric not found")

    if payload.target_units is not None:
        metric.target_units = payload.target_units
    if payload.actual_units is not None:
        metric.actual_units = payload.actual_units
    if payload.scrap_units is not None:
        metric.scrap_units = payload.scrap_units

    metric.updated_by = current_user.full_name or current_user.email or "Administrator"
    metric.updated_at = utc_now()

    await db.commit()
    await db.refresh(metric)

    await log_audit_trail(
        db=db,
        user=current_user,
        module="Production Metrics",
        action="UPDATE",
        change_notes=f"Updated {metric.day_of_week} ({metric.week_label}): Target={metric.target_units}, Actual={metric.actual_units}, Scrap={metric.scrap_units}",
        target_id=str(metric.id),
    )
    await db.commit()

    return metric


@router.delete("/{metric_id}", response_model=ProductionMetricResponse)
async def reset_metric_by_id(
    metric_id: int,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    """Reset individual day's metrics back to zero."""
    _check_can_edit_metrics(current_user)

    metric = await db.get(WeeklyProductionMetric, metric_id)
    if not metric:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Production metric not found")

    metric.target_units = 0
    metric.actual_units = 0
    metric.scrap_units = 0
    metric.updated_by = current_user.full_name or current_user.email or "Administrator"
    metric.updated_at = utc_now()

    await db.commit()
    await db.refresh(metric)

    await log_audit_trail(
        db=db,
        user=current_user,
        module="Production Metrics",
        action="RESET",
        change_notes=f"Reset daily metrics to zero for {metric.day_of_week} ({metric.week_label})",
        target_id=str(metric.id),
    )
    await db.commit()

    return metric

