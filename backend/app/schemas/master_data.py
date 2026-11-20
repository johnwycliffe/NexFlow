from datetime import datetime
from typing import List, Optional, Union
from pydantic import BaseModel, ConfigDict, Field, field_validator


# ---------------- PRODUCT SCHEMAS ----------------
class ProductBase(BaseModel):
    sku: str
    name: str
    category: str
    revision: str = "Rev A.1"
    unit: str = "units"
    unit_cost: float = Field(0.0, ge=0)
    selling_price: float = Field(0.0, ge=0)
    weight_kg: float = Field(0.0, ge=0)
    lead_time_days: int = Field(7, ge=0)
    status: str = "ACTIVE"
    description: Optional[str] = None
    specifications_json: Optional[str] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    revision: Optional[str] = None
    unit_cost: Optional[float] = None
    selling_price: Optional[float] = None
    weight_kg: Optional[float] = None
    lead_time_days: Optional[int] = None
    status: Optional[str] = None
    description: Optional[str] = None
    specifications_json: Optional[str] = None


class ProductResponse(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


# ---------------- BOM SCHEMAS ----------------
class BOMItemBase(BaseModel):
    material_id: int
    quantity_per_unit: float = Field(..., gt=0)
    uom: str = "units"
    unit_cost: float = Field(0.0, ge=0)


class BOMItemCreate(BOMItemBase):
    pass


class BOMItemResponse(BOMItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    bom_id: int
    subtotal: float


class BOMBase(BaseModel):
    product_id: int
    bom_code: str
    version: str = "1.0"
    scrap_allowance_percent: float = Field(3.0, ge=0)
    is_active: bool = True
    effective_date: Optional[str] = None


class BOMCreate(BOMBase):
    items: List[BOMItemCreate] = []


class BOMUpdate(BaseModel):
    bom_code: Optional[str] = None
    version: Optional[str] = None
    scrap_allowance_percent: Optional[float] = None
    is_active: Optional[bool] = None
    effective_date: Optional[str] = None
    items: Optional[List[BOMItemCreate]] = None


class BOMResponse(BOMBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    total_calculated_cost: float
    items: List[BOMItemResponse] = []
    created_at: datetime
    updated_at: datetime


# ---------------- RAW MATERIALS SCHEMAS ----------------
class RawMaterialBase(BaseModel):
    code: str
    name: str
    category: str
    uom: str  # kg, metric_tons, meters, liters, units
    unit_cost: float = Field(0.0, ge=0)
    safety_stock: float = Field(0.0, ge=0)
    reorder_level: float = Field(0.0, ge=0)
    lead_time_days: int = Field(7, ge=0)
    default_supplier_id: Optional[int] = None
    storage_condition: Optional[str] = None
    notes: Optional[str] = None


class RawMaterialCreate(RawMaterialBase):
    pass


class RawMaterialUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    uom: Optional[str] = None
    unit_cost: Optional[float] = None
    safety_stock: Optional[float] = None
    reorder_level: Optional[float] = None
    lead_time_days: Optional[int] = None
    default_supplier_id: Optional[int] = None
    storage_condition: Optional[str] = None
    notes: Optional[str] = None


class RawMaterialResponse(RawMaterialBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


# ---------------- SUPPLIER SCHEMAS ----------------
class SupplierBase(BaseModel):
    code: str
    name: str
    country: str = "Germany"
    city: str = "Munich"
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    rating: float = Field(4.5, ge=1.0, le=5.0)
    lead_time_days: int = Field(10, ge=0)
    quality_pass_rate: float = Field(98.0, ge=0, le=100)
    payment_terms: str = "Net 30"
    linked_categories: Optional[Union[str, List[str]]] = None

    @field_validator("linked_categories", mode="before")
    @classmethod
    def format_categories(cls, v):
        if isinstance(v, list):
            return ", ".join(str(item) for item in v)
        return v


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    rating: Optional[float] = None
    lead_time_days: Optional[int] = None
    quality_pass_rate: Optional[float] = None
    payment_terms: Optional[str] = None
    linked_categories: Optional[Union[str, List[str]]] = None

    @field_validator("linked_categories", mode="before")
    @classmethod
    def format_categories(cls, v):
        if isinstance(v, list):
            return ", ".join(str(item) for item in v)
        return v


class SupplierResponse(SupplierBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime

