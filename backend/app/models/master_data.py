from sqlalchemy import String, Float, Integer, ForeignKey, Boolean, Text, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class Product(Base, TimestampMixin):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    sku: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    revision: Mapped[str] = mapped_column(String(50), default="Rev A.1", nullable=False)
    unit: Mapped[str] = mapped_column(String(20), default="units", nullable=False)
    unit_cost: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    selling_price: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    weight_kg: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    lead_time_days: Mapped[int] = mapped_column(Integer, default=7, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE", nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    specifications_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    boms: Mapped[list["BOM"]] = relationship("BOM", back_populates="product", cascade="all, delete-orphan")


class BOM(Base, TimestampMixin):
    __tablename__ = "boms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    bom_code: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    version: Mapped[str] = mapped_column(String(20), default="1.0", nullable=False)
    scrap_allowance_percent: Mapped[float] = mapped_column(Float, default=3.0, nullable=False)
    total_calculated_cost: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    effective_date: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="boms")
    items: Mapped[list["BOMItem"]] = relationship("BOMItem", back_populates="bom", cascade="all, delete-orphan")


class BOMItem(Base):
    __tablename__ = "bom_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    bom_id: Mapped[int] = mapped_column(Integer, ForeignKey("boms.id", ondelete="CASCADE"), nullable=False)
    material_id: Mapped[int] = mapped_column(Integer, ForeignKey("raw_materials.id"), nullable=False)
    quantity_per_unit: Mapped[float] = mapped_column(Float, nullable=False)
    uom: Mapped[str] = mapped_column(String(20), default="units", nullable=False)
    unit_cost: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    subtotal: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # Relationships
    bom: Mapped["BOM"] = relationship("BOM", back_populates="items")
    material: Mapped["RawMaterial"] = relationship("RawMaterial")


class RawMaterial(Base, TimestampMixin):
    __tablename__ = "raw_materials"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    uom: Mapped[str] = mapped_column(String(20), nullable=False)  # kg, metric_tons, meters, liters, units
    unit_cost: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    safety_stock: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    reorder_level: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    lead_time_days: Mapped[int] = mapped_column(Integer, default=7, nullable=False)
    default_supplier_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True)
    storage_condition: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    default_supplier: Mapped["Supplier | None"] = relationship("Supplier", back_populates="raw_materials")


class Supplier(Base, TimestampMixin):
    __tablename__ = "suppliers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    country: Mapped[str] = mapped_column(String(100), default="Germany", nullable=False)
    city: Mapped[str] = mapped_column(String(100), default="Munich", nullable=False)
    contact_person: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(100), nullable=True)
    rating: Mapped[float] = mapped_column(Float, default=4.5, nullable=False)
    lead_time_days: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    quality_pass_rate: Mapped[float] = mapped_column(Float, default=98.0, nullable=False)
    payment_terms: Mapped[str] = mapped_column(String(50), default="Net 30", nullable=False)
    linked_categories: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Relationships
    raw_materials: Mapped[list["RawMaterial"]] = relationship("RawMaterial", back_populates="default_supplier")

