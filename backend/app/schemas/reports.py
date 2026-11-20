from typing import List, Dict, Any
from pydantic import BaseModel


class OEEResponse(BaseModel):
    availability: float
    performance: float
    quality: float
    oee: float


class ProductionSummaryResponse(BaseModel):
    active_production_orders: int
    completed_orders_this_month: int
    total_finished_goods_units: float
    total_finished_goods_valuation: float
    overall_quality_pass_rate: float
    critical_material_shortages: int
    oee_metrics: OEEResponse
    monthly_output: List[Dict[str, Any]]

