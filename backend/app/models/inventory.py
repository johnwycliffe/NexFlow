from datetime import datetime, date
from sqlalchemy import String, Float, Integer, ForeignKey, Date, DateTime, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin, utc_now


class Warehouse(Base, TimestampMixin):
    __tablename__ = "warehouses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    warehouse_type: Mapped[str] = mapped_column(String(50), default="RAW_MATERIALS", nullable=False)  # RAW_MATERIALS, WIP_BUFFER, FINISHED_GOODS

    # Relationships
    stock_items: Mapped[list["StockItem"]] = relationship("StockItem", back_populates="warehouse")


class StockItem(Base, TimestampMixin):
    __tablename__ = "stock_items"
    __table_args__ = (
        UniqueConstraint("warehouse_id", "material_id", name="uq_warehouse_material"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    warehouse_id: Mapped[int] = mapped_column(Integer, ForeignKey("warehouses.id"), nullable=False)
    material_id: Mapped[int] = mapped_column(Integer, ForeignKey("raw_materials.id"), nullable=False)
    location_bin: Mapped[str] = mapped_column(String(100), default="RACK-A1", nullable=False)
    on_hand_qty: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    reserved_qty: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    unit_cost: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    last_count_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="IN_STOCK", nullable=False)

    @property
    def available_qty(self) -> float:
        return max(0.0, round(self.on_hand_qty - self.reserved_qty, 4))

    @property
    def total_valuation(self) -> float:
        return round(self.on_hand_qty * self.unit_cost, 2)

    @property
    def material_code(self) -> str:
        return self.material.code if self.material else ""

    @property
    def material_name(self) -> str:
        return self.material.name if self.material else ""

    @property
    def warehouse_name(self) -> str:
        return self.warehouse.name if self.warehouse else ""

    @property
    def uom(self) -> str:
        return self.material.uom if self.material else "units"

    @property
    def on_hand(self) -> float:
        return self.on_hand_qty

    @property
    def reserved(self) -> float:
        return self.reserved_qty

    @property
    def available(self) -> float:
        return self.available_qty

    # Relationships
    warehouse: Mapped["Warehouse"] = relationship("Warehouse", back_populates="stock_items")
    material: Mapped["app.models.master_data.RawMaterial"] = relationship("app.models.master_data.RawMaterial")


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    material_id: Mapped[int] = mapped_column(Integer, ForeignKey("raw_materials.id"), nullable=False)
    movement_type: Mapped[str] = mapped_column(String(50), nullable=False)  # RECEIPT, ISSUE, TRANSFER, ADJUSTMENT
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    uom: Mapped[str] = mapped_column(String(20), nullable=False)
    from_warehouse_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("warehouses.id"), nullable=True)
    to_warehouse_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("warehouses.id"), nullable=True)
    reference_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    material: Mapped["RawMaterial"] = relationship("app.models.master_data.RawMaterial")


class FinishedGood(Base, TimestampMixin):
    __tablename__ = "finished_goods"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    receipt_number: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    production_order_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("production_orders.id", ondelete="SET NULL"), nullable=True)
    product_id: Mapped[int] = mapped_column(Integer, ForeignKey("products.id"), nullable=False)
    quantity_received: Mapped[float] = mapped_column(Float, nullable=False)
    uom: Mapped[str] = mapped_column(String(20), default="units", nullable=False)
    warehouse_id: Mapped[int] = mapped_column(Integer, ForeignKey("warehouses.id"), nullable=False)
    bin_location: Mapped[str] = mapped_column(String(100), default="BAY-FG-01", nullable=False)
    unit_cost: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_valuation: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    quality_cert_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    dispatched_quantity: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    available_balance: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    received_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    product: Mapped["app.models.master_data.Product"] = relationship("app.models.master_data.Product")
    warehouse: Mapped["Warehouse"] = relationship("Warehouse")

