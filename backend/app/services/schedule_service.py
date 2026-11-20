from datetime import date
from fastapi import HTTPException, status
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.execution import ProductionSchedule, Machine
from app.models.planning import ProductionOrder


async def validate_no_machine_conflict(
    db: AsyncSession,
    machine_id: int,
    schedule_date: date,
    start_hour: int,
    end_hour: int,
    exclude_schedule_id: int | None = None,
) -> None:
    """
    Deterministic Collision Invariant:
    Existing Start < New End AND Existing End > New Start
    Rejects overlapping machine time slots with HTTP 409 Conflict.
    """
    if start_hour >= end_hour:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start hour must be strictly less than end hour.",
        )

    conditions = [
        ProductionSchedule.machine_id == machine_id,
        ProductionSchedule.schedule_date == schedule_date,
        ProductionSchedule.start_hour < end_hour,
        ProductionSchedule.end_hour > start_hour,
        ProductionSchedule.status != "CANCELLED",
    ]

    if exclude_schedule_id:
        conditions.append(ProductionSchedule.id != exclude_schedule_id)

    stmt = (
        select(ProductionSchedule)
        .options(selectinload(ProductionSchedule.production_order), selectinload(ProductionSchedule.machine))
        .where(and_(*conditions))
    )
    result = await db.execute(stmt)
    conflict = result.scalar_one_or_none()

    if conflict:
        order_num = conflict.production_order.order_number if conflict.production_order else f"#{conflict.production_order_id}"
        machine_name = conflict.machine.name if conflict.machine else f"#{machine_id}"
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Scheduling Collision Detected: {machine_name} is already booked on {schedule_date} "
                f"by Order {order_num} between {conflict.start_hour}:00 and {conflict.end_hour}:00!"
            ),
        )

