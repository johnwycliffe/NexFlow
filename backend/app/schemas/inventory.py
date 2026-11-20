from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


# ---------------- WAREHOUSE SCHEMAS ----------------
class WarehouseBase(BaseModel):
    code: str
    name: str
    location: str
    warehouse_type: str = "RAW_MATERIALS"


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseResponse(WarehouseBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


# ---------------- STOCK ITEM SCHEMAS ----------------
class StockItemBase(BaseModel):
    warehouse_id: int
    material_id: int
    location_bin: str = "RACK-A1"
    on_hand_qty: float = Field(0.0, ge=0)
    reserved_qty: float = Field(0.0, ge=0)
    unit_cost: float = Field(0.0, ge=0)
    last_count_date: Optional[date] = None
    status: str = "IN_STOCK"


class StockItemCreate(StockItemBase):
    pass


class StockItemUpdate(BaseModel):
    warehouse_id: Optional[int] = None
    material_id: Optional[int] = None
    location_bin: Optional[str] = None
    on_hand_qty: Optional[float] = None
    reserved_qty: Optional[float] = None
    unit_cost: Optional[float] = None
    status: Optional[str] = None


class StockItemResponse(StockItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    available_qty: float
    total_valuation: float
    material_code: Optional[str] = None
    material_name: Optional[str] = None
    warehouse_name: Optional[str] = None
    uom: Optional[str] = "units"
    on_hand: Optional[float] = None
    reserved: Optional[float] = None
    available: Optional[float] = None
    created_at: datetime
    updated_at: datetime


class StockTransferRequest(BaseModel):
    material_id: int
    from_warehouse_id: int
    to_warehouse_id: int
    quantity: float = Field(..., gt=0)
    notes: Optional[str] = "Shop Floor WIP Transfer"


class StockAdjustmentRequest(BaseModel):
    stock_item_id: int
    new_on_hand_qty: float = Field(..., ge=0)
    reason: str = "Physical Cycle Count Audit"


# ---------------- FINISHED GOODS SCHEMAS ----------------
class FinishedGoodBase(BaseModel):
    receipt_number: str
    production_order_id: Optional[int] = None
    product_id: int
    quantity_received: float = Field(..., gt=0)
    uom: str = "units"
    warehouse_id: int
    bin_location: str = "BAY-FG-01"
    unit_cost: float = Field(0.0, ge=0)
    total_valuation: float = Field(0.0, ge=0)
    quality_cert_number: str
    dispatched_quantity: float = Field(0.0, ge=0)
    available_balance: float = Field(0.0, ge=0)
    received_date: Optional[date] = None


class FinishedGoodReceiveRequest(BaseModel):
    production_order_id: int
    product_id: int
    quantity_received: float = Field(..., gt=0)
    warehouse_id: int
    bin_location: str = "BAY-FG-01"
    quality_cert_number: str


class FinishedGoodDispatchRequest(BaseModel):
    finished_good_id: int
    dispatch_quantity: float = Field(..., gt=0)
    notes: Optional[str] = "Customer Dispatch Order"


class FinishedGoodResponse(FinishedGoodBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime

