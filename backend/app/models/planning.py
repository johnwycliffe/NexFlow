from datetime import date, datetime
from sqlalchemy import String, Float, Integer, ForeignKey, Date, DateTime, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin, utc_now


class SalesOrder(Base, TimestampMixin):
    __tablename__ = "sales_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_number: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    customer_type: Mapped[str] = mapped_column(String(100), default="Distributor", nullable=False)
    customer_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    destination: Mapped[str] = mapped_column(String(255), nullable=False)
    product_id: Mapped[int] = mapped_column(Integer, ForeignKey("products.id"), nullable=False)
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    uom: Mapped[str] = mapped_column(String(20), default="units", nullable=False)
    order_date: Mapped[date] = mapped_column(Date, nullable=False)
    requested_delivery_date: Mapped[date] = mapped_column(Date, nullable=False)
    priority: Mapped[str] = mapped_column(String(50), default="Normal", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="PENDING_PLANNING", nullable=False)  # PENDING_PLANNING, IN_PRODUCTION, COMPLETED, CANCELLED
    total_value: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    product: Mapped["app.models.master_data.Product"] = relationship("app.models.master_data.Product")
    production_orders: Mapped[list["ProductionOrder"]] = relationship("ProductionOrder", back_populates="sales_order")


class ProductionOrder(Base, TimestampMixin):
    __tablename__ = "production_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_number: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    sales_order_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("sales_orders.id", ondelete="SET NULL"), nullable=True)
    product_id: Mapped[int] = mapped_column(Integer, ForeignKey("products.id"), nullable=False)
    batch_quantity: Mapped[float] = mapped_column(Float, nullable=False)
    uom: Mapped[str] = mapped_column(String(20), default="units", nullable=False)
    priority: Mapped[str] = mapped_column(String(50), default="Normal", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="Draft", nullable=False)  # Draft, Released, In-Progress, Inspection, Completed, Cancelled
    progress_percent: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    work_center_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("work_centers.id", ondelete="SET NULL"), nullable=True)
    machine_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("machines.id", ondelete="SET NULL"), nullable=True)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    actual_start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    completed_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    scrap_rate_percent: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    operator_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    sales_order: Mapped["SalesOrder | None"] = relationship("SalesOrder", back_populates="production_orders")
    product: Mapped["app.models.master_data.Product"] = relationship("app.models.master_data.Product")
    work_center: Mapped["app.models.execution.WorkCenter | None"] = relationship("app.models.execution.WorkCenter")
    machine: Mapped["app.models.execution.Machine | None"] = relationship("app.models.execution.Machine")


class MRPRun(Base):
    __tablename__ = "mrp_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    run_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    created_by: Mapped[str] = mapped_column(String(100), default="SYSTEM", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="SUCCESS", nullable=False)
    total_shortages: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    estimated_capital_required: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # Relationships
    items: Mapped[list["MRPItem"]] = relationship("MRPItem", back_populates="mrp_run", cascade="all, delete-orphan")


class MRPItem(Base):
    __tablename__ = "mrp_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    mrp_run_id: Mapped[int] = mapped_column(Integer, ForeignKey("mrp_runs.id", ondelete="CASCADE"), nullable=False)
    material_id: Mapped[int] = mapped_column(Integer, ForeignKey("raw_materials.id"), nullable=False)
    gross_requirement: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    on_hand_stock: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    reserved_stock: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    available_stock: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    net_shortage: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    safety_stock: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    action_recommended: Mapped[str] = mapped_column(String(100), default="BALANCED", nullable=False)  # BALANCED, CRITICAL_SHORTAGE, REORDER_RECOMMENDED
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE", nullable=False)

    # Relationships
    mrp_run: Mapped["MRPRun"] = relationship("MRPRun", back_populates="items")
    material: Mapped["app.models.master_data.RawMaterial"] = relationship("app.models.master_data.RawMaterial")

