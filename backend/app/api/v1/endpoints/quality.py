from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select

from app.api.deps import SessionDep, CurrentUserDep, require_roles
from app.models.quality import QualityInspection
from app.models.planning import ProductionOrder
from app.schemas.quality import QualityInspectionCreate, QualityInspectionResponse
from app.services.inventory_service import receive_finished_goods_atomic
from app.services.audit_service import log_audit_trail

router = APIRouter(prefix="/quality", tags=["Quality Assurance & Inspection"])


@router.get("", response_model=List[QualityInspectionResponse])
@router.get("/inspections", response_model=List[QualityInspectionResponse])
async def list_quality_inspections(
    db: SessionDep,
    production_order_id: Optional[int] = Query(None),
):
    stmt = select(QualityInspection)
    if production_order_id:
        stmt = stmt.where(QualityInspection.production_order_id == production_order_id)
    stmt = stmt.order_by(QualityInspection.inspection_date.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post(
    "/inspect",
    response_model=QualityInspectionResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("ADMINISTRATOR", "QUALITY_INSPECTOR"))],
)
async def log_quality_inspection_sign_off(
    payload: QualityInspectionCreate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    """
    Quality Inspection Sign-Off:
    Strict Invariant: Inspected Quantity = Accepted Quantity + Rejected Quantity.
    Automatically generates finished goods receipt for accepted units.
    """
    po = await db.get(ProductionOrder, payload.production_order_id)
    if not po:
        raise HTTPException(status_code=404, detail="Production order not found.")

    inspected = payload.inspected_quantity
    accepted = payload.accepted_quantity
    rejected = payload.rejected_quantity

    if abs(inspected - (accepted + rejected)) > 1e-4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Validation Violation: Inspected ({inspected}) != Accepted ({accepted}) + Rejected ({rejected}).",
        )

    pass_rate = round((accepted / inspected) * 100.0, 1) if inspected > 0 else 100.0
    status_str = "PASS" if rejected == 0 else ("PASS" if pass_rate >= 90.0 else "FAIL")

    qi_count_res = await db.execute(select(QualityInspection))
    qi_count = len(qi_count_res.scalars().all())
    inspection_num = f"QI-{date.today().strftime('%Y')}-{str(qi_count + 1).zfill(3)}"

    qi = QualityInspection(
        inspection_number=inspection_num,
        production_order_id=payload.production_order_id,
        inspected_quantity=inspected,
        accepted_quantity=accepted,
        rejected_quantity=rejected,
        pass_rate_percent=pass_rate,
        defect_reason=payload.defect_reason,
        inspection_date=payload.inspection_date,
        inspector_name=payload.inspector_name,
        status=status_str,
        disposition=payload.disposition,
    )
    db.add(qi)

    # Automatically route accepted pieces into Finished Goods Warehouse (WH 3)
    if accepted > 0:
        await receive_finished_goods_atomic(
            db=db,
            production_order_id=po.id,
            product_id=po.product_id,
            quantity=accepted,
            warehouse_id=3,
            bin_location="BAY-FG-01",
            quality_cert_number=f"QC-{inspection_num}",
            current_user=current_user,
        )

    await log_audit_trail(
        db=db,
        user=current_user,
        module="Quality Inspection",
        action="CREATE",
        target_id=inspection_num,
        change_notes=f"QA Certified PO {po.order_number}: {accepted} Accepted, {rejected} Rejected ({pass_rate}% Pass Rate).",
    )
    await db.commit()
    await db.refresh(qi)

    return qi

