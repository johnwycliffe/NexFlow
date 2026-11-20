from datetime import date, datetime
from sqlalchemy import String, Float, Integer, ForeignKey, Date, DateTime, Text, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin, utc_now


class WorkCenter(Base, TimestampMixin):
    __tablename__ = "work_centers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    department: Mapped[str] = mapped_column(String(100), nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    max_capacity_hours_per_day: Mapped[float] = mapped_column(Float, default=16.0, nullable=False)
    hourly_operating_cost: Mapped[float] = mapped_column(Float, default=75.0, nullable=False)
    efficiency_rating: Mapped[float] = mapped_column(Float, default=95.0, nullable=False)
    headcount_assigned: Mapped[int] = mapped_column(Integer, default=6, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE", nullable=False)

    # Relationships
    machines: Mapped[list["Machine"]] = relationship("Machine", back_populates="work_center")


class Machine(Base, TimestampMixin):
    __tablename__ = "machines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    work_center_id: Mapped[int] = mapped_column(Integer, ForeignKey("work_centers.id"), nullable=False)
    model: Mapped[str] = mapped_column(String(255), default="Standard CNC 2026", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="Running", nullable=False)  # Running, Idle, Maintenance
    runtime_hours: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    last_maintenance_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    next_maintenance_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    efficiency_pct: Mapped[float] = mapped_column(Float, default=96.0, nullable=False)
    daily_power_kwh: Mapped[float] = mapped_column(Float, default=45.0, nullable=False)

    # Relationships
    work_center: Mapped["WorkCenter"] = relationship("WorkCenter", back_populates="machines")


class Shift(Base, TimestampMixin):
    __tablename__ = "shifts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    start_time: Mapped[str] = mapped_column(String(20), nullable=False)  # e.g. "06:00"
    end_time: Mapped[str] = mapped_column(String(20), nullable=False)    # e.g. "14:00"
    duration_hours: Mapped[float] = mapped_column(Float, default=8.0, nullable=False)
    supervisor: Mapped[str] = mapped_column(String(255), nullable=False)
    assigned_team: Mapped[str] = mapped_column(String(100), default="Alpha Crew", nullable=False)
    worker_count: Mapped[int] = mapped_column(Integer, default=15, nullable=False)
    color_hex: Mapped[str] = mapped_column(String(20), default="#3b82f6", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE", nullable=False)


class ProductionSchedule(Base, TimestampMixin):
    __tablename__ = "production_schedules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    production_order_id: Mapped[int] = mapped_column(Integer, ForeignKey("production_orders.id", ondelete="CASCADE"), nullable=False)
    work_center_id: Mapped[int] = mapped_column(Integer, ForeignKey("work_centers.id"), nullable=False)
    machine_id: Mapped[int] = mapped_column(Integer, ForeignKey("machines.id"), nullable=False)
    shift_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("shifts.id", ondelete="SET NULL"), nullable=True)
    schedule_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    start_hour: Mapped[int] = mapped_column(Integer, nullable=False)  # 0 to 23
    end_hour: Mapped[int] = mapped_column(Integer, nullable=False)    # 1 to 24
    allocated_hours: Mapped[float] = mapped_column(Float, default=6.0, nullable=False)
    planned_units: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="SCHEDULED", nullable=False)

    # Relationships
    production_order: Mapped["app.models.planning.ProductionOrder"] = relationship("app.models.planning.ProductionOrder")
    work_center: Mapped["WorkCenter"] = relationship("WorkCenter")
    machine: Mapped["Machine"] = relationship("Machine")
    shift: Mapped["Shift | None"] = relationship("Shift")


class ExecutionLog(Base):
    __tablename__ = "execution_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    production_order_id: Mapped[int] = mapped_column(Integer, ForeignKey("production_orders.id", ondelete="CASCADE"), nullable=False)
    operation_code: Mapped[str] = mapped_column(String(50), nullable=False)
    operation_name: Mapped[str] = mapped_column(String(255), nullable=False)
    work_center_id: Mapped[int] = mapped_column(Integer, ForeignKey("work_centers.id"), nullable=False)
    target_quantity: Mapped[float] = mapped_column(Float, nullable=False)
    completed_quantity: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    scrap_quantity: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    progress_percent: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    assigned_operator: Mapped[str] = mapped_column(String(255), default="Operator", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="In-Progress", nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    logged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    production_order: Mapped["app.models.planning.ProductionOrder"] = relationship("app.models.planning.ProductionOrder")
    work_center: Mapped["WorkCenter"] = relationship("WorkCenter")

