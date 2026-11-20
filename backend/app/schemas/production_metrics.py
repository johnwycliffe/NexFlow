from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class ProductionMetricBase(BaseModel):
    week_label: str = Field(..., max_length=50)
    day_of_week: str = Field(..., max_length=10)
    day_order: int = Field(..., ge=1, le=7)
    target_units: int = Field(0, ge=0)
    actual_units: int = Field(0, ge=0)
    scrap_units: int = Field(0, ge=0)


class ProductionMetricCreate(ProductionMetricBase):
    pass


class ProductionMetricUpdate(BaseModel):
    target_units: Optional[int] = Field(None, ge=0)
    actual_units: Optional[int] = Field(None, ge=0)
    scrap_units: Optional[int] = Field(None, ge=0)


class ProductionMetricItemUpdate(BaseModel):
    id: Optional[int] = None
    day_of_week: str
    day_order: Optional[int] = None
    target_units: int = Field(..., ge=0)
    actual_units: int = Field(..., ge=0)
    scrap_units: int = Field(..., ge=0)


class ProductionMetricBatchUpdate(BaseModel):
    metrics: List[ProductionMetricItemUpdate]


class ProductionMetricResponse(BaseModel):
    id: int
    week_label: str
    day_of_week: str
    day_order: int
    target_units: int
    actual_units: int
    scrap_units: int
    updated_by: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True

