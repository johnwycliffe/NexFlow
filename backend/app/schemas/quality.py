from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator


# ---------------- QUALITY INSPECTION SCHEMAS ----------------
class QualityInspectionCreate(BaseModel):
    production_order_id: int
    inspected_quantity: float = Field(..., gt=0)
    accepted_quantity: float = Field(..., ge=0)
    rejected_quantity: float = Field(..., ge=0)
    defect_reason: Optional[str] = None
    inspection_date: date
    inspector_name: str
    disposition: Optional[str] = None

    @model_validator(mode="after")
    def validate_inspection_sum(self):
        inspected = self.inspected_quantity
        accepted = self.accepted_quantity
        rejected = self.rejected_quantity
        if abs(inspected - (accepted + rejected)) > 1e-4:
            raise ValueError(
                f"Deterministic Math Invariant Violated: Inspected Quantity ({inspected}) "
                f"must strictly equal Accepted Quantity ({accepted}) + Rejected Quantity ({rejected})."
            )
        return self


class QualityInspectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    inspection_number: str
    production_order_id: int
    inspected_quantity: float
    accepted_quantity: float
    rejected_quantity: float
    pass_rate_percent: float
    defect_reason: Optional[str] = None
    inspection_date: date
    inspector_name: str
    status: str
    disposition: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ---------------- MATERIAL CONSUMPTION SCHEMAS ----------------
class MaterialConsumptionCreate(BaseModel):
    production_order_id: int
    material_id: int
    warehouse_id: int
    planned_quantity: float = Field(..., gt=0)
    actual_quantity: float = Field(..., gt=0)
    consumption_type: str = "BACKFLUSH"


class MaterialConsumptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    production_order_id: int
    material_id: int
    warehouse_id: int
    planned_quantity: float
    actual_quantity: float
    variance: float
    uom: str
    unit_cost: float
    total_cost: float
    consumption_type: str
    status: str
    logged_at: datetime

