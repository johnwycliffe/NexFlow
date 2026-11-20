from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


# ---------------- WORK CENTER SCHEMAS ----------------
class WorkCenterBase(BaseModel):
    code: str
    name: str
    department: str
    location: str
    max_capacity_hours_per_day: float = Field(16.0, gt=0)
    hourly_operating_cost: float = Field(75.0, ge=0)
    efficiency_rating: float = Field(95.0, ge=0, le=100)
    headcount_assigned: int = Field(6, ge=0)
    status: str = "ACTIVE"


class WorkCenterCreate(WorkCenterBase):
    pass


class WorkCenterResponse(WorkCenterBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


# ---------------- MACHINE SCHEMAS ----------------
class MachineBase(BaseModel):
    code: str
    name: str
    work_center_id: int
    model: str = "Standard CNC 2026"
    status: str = "Running"
    runtime_hours: float = Field(0.0, ge=0)
    last_maintenance_date: Optional[date] = None
    next_maintenance_date: Optional[date] = None
    efficiency_pct: float = Field(96.0, ge=0, le=100)
    daily_power_kwh: float = Field(45.0, ge=0)


class MachineCreate(MachineBase):
    pass


class MachineUpdate(BaseModel):
    name: Optional[str] = None
    work_center_id: Optional[int] = None
    status: Optional[str] = None
    runtime_hours: Optional[float] = None
    last_maintenance_date: Optional[date] = None
    next_maintenance_date: Optional[date] = None
    efficiency_pct: Optional[float] = None
    daily_power_kwh: Optional[float] = None


class MachineResponse(MachineBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


# ---------------- SHIFT SCHEMAS ----------------
class ShiftBase(BaseModel):
    code: str
    name: str
    start_time: str
    end_time: str
    duration_hours: float = Field(8.0, gt=0)
    supervisor: str
    assigned_team: str = "Alpha Crew"
    worker_count: int = Field(15, ge=0)
    color_hex: str = "#3b82f6"
    status: str = "ACTIVE"


class ShiftCreate(ShiftBase):
    pass


class ShiftResponse(ShiftBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


# ---------------- SCHEDULE SCHEMAS ----------------
class ScheduleBase(BaseModel):
    production_order_id: int
    work_center_id: int
    machine_id: int
    shift_id: Optional[int] = None
    schedule_date: date
    start_hour: int = Field(..., ge=0, le=23)
    end_hour: int = Field(..., ge=1, le=24)
    allocated_hours: float = Field(6.0, gt=0)
    planned_units: float = Field(0.0, ge=0)
    status: str = "SCHEDULED"


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleResponse(ScheduleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


# ---------------- EXECUTION LOG SCHEMAS ----------------
class ExecutionLogBase(BaseModel):
    production_order_id: int
    operation_code: str
    operation_name: str
    work_center_id: int
    target_quantity: float = Field(..., gt=0)
    completed_quantity: float = Field(0.0, ge=0)
    scrap_quantity: float = Field(0.0, ge=0)
    progress_percent: int = Field(0, ge=0, le=100)
    assigned_operator: str = "Operator"
    status: str = "In-Progress"
    notes: Optional[str] = None


class ExecutionLogCreate(ExecutionLogBase):
    pass


class ExecutionLogResponse(ExecutionLogBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    logged_at: datetime

