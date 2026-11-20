from datetime import date, datetime
from sqlalchemy import String, Float, Integer, ForeignKey, Date, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin, utc_now


class QualityInspection(Base, TimestampMixin):
    __tablename__ = "quality_inspections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    inspection_number: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    production_order_id: Mapped[int] = mapped_column(Integer, ForeignKey("production_orders.id", ondelete="CASCADE"), nullable=False)
    inspected_quantity: Mapped[float] = mapped_column(Float, nullable=False)
    accepted_quantity: Mapped[float] = mapped_column(Float, nullable=False)
    rejected_quantity: Mapped[float] = mapped_column(Float, nullable=False)
    pass_rate_percent: Mapped[float] = mapped_column(Float, default=100.0, nullable=False)
    defect_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    inspection_date: Mapped[date] = mapped_column(Date, nullable=False)
    inspector_name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="PASS", nullable=False)  # PASS, FAIL, CONDITIONAL
    disposition: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    production_order: Mapped["app.models.planning.ProductionOrder"] = relationship("app.models.planning.ProductionOrder")


class MaterialConsumption(Base):
    __tablename__ = "material_consumptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    production_order_id: Mapped[int] = mapped_column(Integer, ForeignKey("production_orders.id", ondelete="CASCADE"), nullable=False)
    material_id: Mapped[int] = mapped_column(Integer, ForeignKey("raw_materials.id"), nullable=False)
    warehouse_id: Mapped[int] = mapped_column(Integer, ForeignKey("warehouses.id"), nullable=False)
    planned_quantity: Mapped[float] = mapped_column(Float, nullable=False)
    actual_quantity: Mapped[float] = mapped_column(Float, nullable=False)
    variance: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    uom: Mapped[str] = mapped_column(String(20), nullable=False)
    unit_cost: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_cost: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    consumption_type: Mapped[str] = mapped_column(String(50), default="BACKFLUSH", nullable=False)  # BACKFLUSH, MANUAL_ISSUE, SCRAP_REPLACEMENT
    status: Mapped[str] = mapped_column(String(50), default="POSTED", nullable=False)
    logged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    production_order: Mapped["app.models.planning.ProductionOrder"] = relationship("app.models.planning.ProductionOrder")
    material: Mapped["app.models.master_data.RawMaterial"] = relationship("app.models.master_data.RawMaterial")
    warehouse: Mapped["app.models.inventory.Warehouse"] = relationship("app.models.inventory.Warehouse")

