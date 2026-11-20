from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


# ---------------- SALES ORDER SCHEMAS ----------------
class SalesOrderBase(BaseModel):
    order_number: str
    customer_name: str
    customer_type: str = "Distributor"
    customer_email: Optional[str] = None
    destination: str
    product_id: int
    quantity: float = Field(..., gt=0)
    uom: str = "units"
    order_date: date
    requested_delivery_date: date
    priority: str = "Normal"
    status: str = "PENDING_PLANNING"
    total_value: float = Field(0.0, ge=0)
    notes: Optional[str] = None


class SalesOrderCreate(SalesOrderBase):
    pass


class SalesOrderUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_type: Optional[str] = None
    destination: Optional[str] = None
    quantity: Optional[float] = None
    requested_delivery_date: Optional[date] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class SalesOrderResponse(SalesOrderBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


# ---------------- PRODUCTION ORDER SCHEMAS ----------------
class ProductionOrderBase(BaseModel):
    order_number: str
    sales_order_id: Optional[int] = None
    product_id: int
    batch_quantity: float = Field(..., gt=0)
    uom: str = "units"
    priority: str = "Normal"
    status: str = "Draft"
    progress_percent: int = Field(0, ge=0, le=100)
    work_center_id: Optional[int] = None
    machine_id: Optional[int] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    operator_notes: Optional[str] = None


class ProductionOrderCreate(ProductionOrderBase):
    pass


class ProductionOrderUpdate(BaseModel):
    priority: Optional[str] = None
    batch_quantity: Optional[float] = None
    work_center_id: Optional[int] = None
    machine_id: Optional[int] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    operator_notes: Optional[str] = None


class ProductionOrderStatusPatch(BaseModel):
    status: str  # Draft, Released, In-Progress, Inspection, Completed, Cancelled


class ProductionOrderResponse(ProductionOrderBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    actual_start_date: Optional[date] = None
    completed_date: Optional[date] = None
    scrap_rate_percent: float
    created_at: datetime
    updated_at: datetime


# ---------------- MRP SCHEMAS ----------------
class MRPItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    material_id: int
    gross_requirement: float
    on_hand_stock: float
    reserved_stock: float
    available_stock: float
    net_shortage: float
    safety_stock: float
    action_recommended: str
    status: str


class MRPRunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    run_date: datetime
    created_by: str
    status: str
    total_shortages: int
    estimated_capital_required: float
    items: List[MRPItemResponse] = []

