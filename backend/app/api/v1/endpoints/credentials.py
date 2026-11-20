import secrets
import string
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, delete, or_
from sqlalchemy.orm import selectinload

from app.api.deps import SessionDep, CurrentUserDep, require_roles
from app.core.security import hash_password
from app.models.user import User, RoleEnum, Role, Department, UserRole
from app.schemas.user import (
    OfficerCredentialResponse,
    CredentialStatsResponse,
    ProvisionCredentialRequest,
    ProvisionCredentialResponse,
    UpdateEmailRequest,
    ResetPasswordRequest,
    ResetPasswordResponse,
    UpdateRoleRequest,
    ToggleStatusRequest,
)
from app.schemas.common import MessageResponse
from app.services.audit_service import log_audit_trail

router = APIRouter(prefix="/credentials", tags=["Hierarchy Credential Management (IAM)"])

ROLE_NAME_TO_ENUM = {
    "Administrator": RoleEnum.ADMINISTRATOR,
    "Production Planner": RoleEnum.PRODUCTION_PLANNER,
    "Store / Inventory Officer": RoleEnum.INVENTORY_OFFICER,
    "Production Supervisor": RoleEnum.PRODUCTION_SUPERVISOR,
    "Quality Inspector": RoleEnum.QUALITY_INSPECTOR,
    "Management Viewer": RoleEnum.MANAGEMENT_VIEWER,
    "ADMINISTRATOR": RoleEnum.ADMINISTRATOR,
    "PRODUCTION_PLANNER": RoleEnum.PRODUCTION_PLANNER,
    "INVENTORY_OFFICER": RoleEnum.INVENTORY_OFFICER,
    "PRODUCTION_SUPERVISOR": RoleEnum.PRODUCTION_SUPERVISOR,
    "QUALITY_INSPECTOR": RoleEnum.QUALITY_INSPECTOR,
    "MANAGEMENT_VIEWER": RoleEnum.MANAGEMENT_VIEWER,
}


def _generate_secure_password(length: int = 12) -> str:
    """Generate a high-entropy compliant temporary password."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    while True:
        pwd = "".join(secrets.choice(alphabet) for _ in range(length))
        if (any(c.islower() for c in pwd)
                and any(c.isupper() for c in pwd)
                and any(c.isdigit() for c in pwd)
                and any(c in "!@#$%^&*" for c in pwd)):
            return f"NexFlow@{pwd[:8]}"


async def _format_credential_response(user: User, current_user_id: int, db: SessionDep) -> OfficerCredentialResponse:
    has_creds = bool(user.hashed_password and user.email)
    if not has_creds:
        c_status = "NOT_CREATED"
    elif not user.is_active:
        c_status = "INACTIVE"
    else:
        c_status = "ACTIVE"

    # Check active admin count to protect last active admin
    admin_count_stmt = select(func.count()).select_from(User).where(User.role == RoleEnum.ADMINISTRATOR, User.is_active == True)
    admin_count = (await db.execute(admin_count_stmt)).scalar_one_or_none() or 0
    is_protected = (user.id == current_user_id) or (user.role == RoleEnum.ADMINISTRATOR and admin_count <= 1)

    primary_role_name = user.role.value if hasattr(user.role, "value") else str(user.role)
    if user.roles and len(user.roles) > 0:
        primary_role_name = user.roles[0].role_name

    dept_name = user.department_rel.name if user.department_rel else (user.department or "General Operations")

    return OfficerCredentialResponse(
        id=user.id,
        full_name=user.full_name,
        job_title=user.job_title or "Staff Officer",
        department_id=user.department_id,
        department_name=dept_name,
        role_name=primary_role_name,
        role=user.role,
        email=user.email,
        has_credentials=has_creds,
        status=c_status,
        is_active=user.is_active,
        is_protected=is_protected,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


# ============================================================================
# KPI STATS ENDPOINT
# ============================================================================

@router.get(
    "/stats",
    response_model=CredentialStatsResponse,
    dependencies=[Depends(require_roles("ADMINISTRATOR"))],
)
async def get_credential_stats(db: SessionDep):
    users_stmt = select(User)
    all_users = (await db.execute(users_stmt)).scalars().all()

    total_officers = len(all_users)
    accounts_created = sum(1 for u in all_users if u.hashed_password and u.email)
    accounts_pending = total_officers - accounts_created
    active_accounts = sum(1 for u in all_users if u.is_active and u.hashed_password and u.email)
    inactive_accounts = sum(1 for u in all_users if (not u.is_active) and u.hashed_password and u.email)

    return CredentialStatsResponse(
        total_officers=total_officers,
        accounts_created=accounts_created,
        accounts_pending=accounts_pending,
        active_accounts=active_accounts,
        inactive_accounts=inactive_accounts,
    )


# ============================================================================
# OFFICER DIRECTORY FOR CREDENTIALS
# ============================================================================

@router.get(
    "/officers",
    response_model=List[OfficerCredentialResponse],
    dependencies=[Depends(require_roles("ADMINISTRATOR"))],
)
async def list_officers_credentials(
    db: SessionDep,
    current_user: CurrentUserDep,
):
    stmt = (
        select(User)
        .options(
            selectinload(User.roles),
            selectinload(User.department_rel),
        )
        .order_by(User.id.asc())
    )
    result = await db.execute(stmt)
    users = result.scalars().all()

    formatted = []
    for u in users:
        formatted.append(await _format_credential_response(u, current_user.id, db))
    return formatted


# ============================================================================
# 1. CREATE / PROVISION OFFICER CREDENTIALS
# ============================================================================

@router.post(
    "/provision",
    response_model=ProvisionCredentialResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("ADMINISTRATOR"))],
)
async def provision_credentials(
    payload: ProvisionCredentialRequest,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    target_email = payload.email.strip().lower()

    # Generate or adopt password
    plain_password = payload.password.strip() if (payload.password and len(payload.password.strip()) >= 6) else _generate_secure_password()
    hashed = hash_password(plain_password)

    target_enum = ROLE_NAME_TO_ENUM.get(payload.role_name, RoleEnum.PRODUCTION_PLANNER)

    # Fetch role entity
    role_stmt = select(Role).where(Role.role_name == payload.role_name)
    role_entity = (await db.execute(role_stmt)).scalar_one_or_none()

    if payload.user_id:
        # Case A: Assign credentials to an existing officer record
        user_stmt = select(User).options(selectinload(User.roles), selectinload(User.department_rel)).where(User.id == payload.user_id)
        user = (await db.execute(user_stmt)).scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="Officer record not found.")

        # Check if email is claimed by someone else
        existing_email = await db.execute(select(User).where(User.email == target_email, User.id != user.id))
        if existing_email.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=f"Email '{target_email}' is already registered to another user.")

        user.email = target_email
        user.hashed_password = hashed
        user.is_active = True
        user.role = target_enum
        if payload.job_title:
            user.job_title = payload.job_title
        if payload.department_id:
            dept = await db.get(Department, payload.department_id)
            if dept:
                user.department_id = dept.id
                user.department = dept.name

        if role_entity:
            await db.execute(delete(UserRole).where(UserRole.user_id == user.id))
            db.add(UserRole(user_id=user.id, role_id=role_entity.id))

        await log_audit_trail(
            db=db,
            user=current_user,
            module="Credential Management",
            action="CREATE",
            target_id=str(user.id),
            change_notes=f"Issued login credentials for officer {user.full_name} ({target_email}) with role '{payload.role_name}'.",
        )
        await db.commit()
        await db.refresh(user)

    else:
        # Case B: Provision brand new officer with login credentials
        existing_email = await db.execute(select(User).where(User.email == target_email))
        if existing_email.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=f"Email '{target_email}' already exists in system.")

        if not payload.full_name or len(payload.full_name.strip()) < 2:
            raise HTTPException(status_code=400, detail="Officer full name is required.")

        dept_name = "Plant Operations & IT"
        actual_dept_id = None
        if payload.department_id:
            dept = await db.get(Department, payload.department_id)
            if dept:
                actual_dept_id = dept.id
                dept_name = dept.name
            else:
                first_dept = (await db.execute(select(Department).limit(1))).scalar_one_or_none()
                if first_dept:
                    actual_dept_id = first_dept.id
                    dept_name = first_dept.name

        user = User(
            full_name=payload.full_name.strip(),
            job_title=payload.job_title or "Staff Officer",
            department_id=actual_dept_id,
            department=dept_name,
            role=target_enum,
            email=target_email,
            hashed_password=hashed,
            is_active=True,
        )
        db.add(user)
        await db.flush()

        if role_entity:
            db.add(UserRole(user_id=user.id, role_id=role_entity.id))

        await log_audit_trail(
            db=db,
            user=current_user,
            module="Credential Management",
            action="CREATE",
            target_id=str(user.id),
            change_notes=f"Provisioned new hierarchy officer {user.full_name} ({target_email}) with role '{payload.role_name}'.",
        )
        await db.commit()

        # Reload with relations
        user_stmt = select(User).options(selectinload(User.roles), selectinload(User.department_rel)).where(User.id == user.id)
        user = (await db.execute(user_stmt)).scalar_one()

    formatted_officer = await _format_credential_response(user, current_user.id, db)
    return ProvisionCredentialResponse(
        officer=formatted_officer,
        temporary_password=plain_password,
        message=f"Credentials for {user.full_name} successfully provisioned.",
    )


# ============================================================================
# 2. UPDATE LOGIN EMAIL
# ============================================================================

@router.put(
    "/{user_id}/email",
    response_model=OfficerCredentialResponse,
    dependencies=[Depends(require_roles("ADMINISTRATOR"))],
)
async def update_officer_email(
    user_id: int,
    payload: UpdateEmailRequest,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    user_stmt = select(User).options(selectinload(User.roles), selectinload(User.department_rel)).where(User.id == user_id)
    user = (await db.execute(user_stmt)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Officer record not found.")

    new_email = payload.email.strip().lower()

    if user.email == new_email:
        return await _format_credential_response(user, current_user.id, db)

    # Check uniqueness
    existing = await db.execute(select(User).where(User.email == new_email, User.id != user_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Email address '{new_email}' is already registered to another user.")

    old_email = user.email
    user.email = new_email

    await log_audit_trail(
        db=db,
        user=current_user,
        module="Credential Management",
        action="UPDATE",
        target_id=str(user.id),
        change_notes=f"Updated login email for {user.full_name} from '{old_email}' to '{new_email}'.",
    )
    await db.commit()
    await db.refresh(user)

    return await _format_credential_response(user, current_user.id, db)


# ============================================================================
# 3. RESET PASSWORD
# ============================================================================

@router.post(
    "/{user_id}/reset-password",
    response_model=ResetPasswordResponse,
    dependencies=[Depends(require_roles("ADMINISTRATOR"))],
)
async def reset_officer_password(
    user_id: int,
    payload: ResetPasswordRequest,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Officer record not found.")

    plain_password = payload.password.strip() if (payload.password and len(payload.password.strip()) >= 6) else _generate_secure_password()
    user.hashed_password = hash_password(plain_password)

    await log_audit_trail(
        db=db,
        user=current_user,
        module="Credential Management",
        action="UPDATE",
        target_id=str(user.id),
        change_notes=f"Reset login password for officer {user.full_name} ({user.email}).",
    )
    await db.commit()

    return ResetPasswordResponse(
        user_id=user.id,
        email=user.email or "N/A",
        temporary_password=plain_password,
        message=f"Password for {user.full_name} successfully reset.",
    )


# ============================================================================
# 4. ACTIVATE / DEACTIVATE ACCOUNT
# ============================================================================

@router.patch(
    "/{user_id}/status",
    response_model=OfficerCredentialResponse,
    dependencies=[Depends(require_roles("ADMINISTRATOR"))],
)
async def toggle_officer_status(
    user_id: int,
    payload: ToggleStatusRequest,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    user_stmt = select(User).options(selectinload(User.roles), selectinload(User.department_rel)).where(User.id == user_id)
    user = (await db.execute(user_stmt)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Officer record not found.")

    # Guard 1: Cannot deactivate own administrator account
    if user.id == current_user.id and not payload.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Operation prohibited: You cannot deactivate your own active Administrator session.",
        )

    # Guard 2: Cannot deactivate last active administrator
    if user.role == RoleEnum.ADMINISTRATOR and not payload.is_active:
        admin_count_stmt = select(func.count()).select_from(User).where(User.role == RoleEnum.ADMINISTRATOR, User.is_active == True)
        admin_count = (await db.execute(admin_count_stmt)).scalar_one_or_none() or 0
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Operation prohibited: Cannot deactivate the last active Administrator in the system.",
            )

    user.is_active = payload.is_active

    await log_audit_trail(
        db=db,
        user=current_user,
        module="Credential Management",
        action="STATUS_CHANGE",
        target_id=str(user.id),
        change_notes=f"Changed account active status of {user.full_name} ({user.email}) to {user.is_active}.",
    )
    await db.commit()
    await db.refresh(user)

    return await _format_credential_response(user, current_user.id, db)


# ============================================================================
# 5. ASSIGN OR CHANGE HIERARCHY ROLE
# ============================================================================

@router.put(
    "/{user_id}/role",
    response_model=OfficerCredentialResponse,
    dependencies=[Depends(require_roles("ADMINISTRATOR"))],
)
async def update_officer_role(
    user_id: int,
    payload: UpdateRoleRequest,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    user_stmt = select(User).options(selectinload(User.roles), selectinload(User.department_rel)).where(User.id == user_id)
    user = (await db.execute(user_stmt)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Officer record not found.")

    target_role_name = payload.role_name.strip()
    target_enum = ROLE_NAME_TO_ENUM.get(target_role_name)
    if not target_enum:
        raise HTTPException(status_code=400, detail=f"Invalid hierarchy role '{target_role_name}'.")

    # Guard 1: Cannot demote own active administrator account
    if user.id == current_user.id and target_enum != RoleEnum.ADMINISTRATOR:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Operation prohibited: You cannot demote your own active Administrator role.",
        )

    # Guard 2: Cannot demote last active administrator
    if user.role == RoleEnum.ADMINISTRATOR and target_enum != RoleEnum.ADMINISTRATOR:
        admin_count_stmt = select(func.count()).select_from(User).where(User.role == RoleEnum.ADMINISTRATOR, User.is_active == True)
        admin_count = (await db.execute(admin_count_stmt)).scalar_one_or_none() or 0
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Operation prohibited: Cannot demote the last active Administrator in the system.",
            )

    # Fetch role entity
    role_stmt = select(Role).where(Role.role_name == target_role_name)
    role_entity = (await db.execute(role_stmt)).scalar_one_or_none()

    old_role_name = user.role.value if hasattr(user.role, "value") else str(user.role)
    user.role = target_enum

    if role_entity:
        await db.execute(delete(UserRole).where(UserRole.user_id == user.id))
        db.add(UserRole(user_id=user.id, role_id=role_entity.id))

    await log_audit_trail(
        db=db,
        user=current_user,
        module="Credential Management",
        action="UPDATE",
        target_id=str(user.id),
        change_notes=f"Reassigned hierarchy role for {user.full_name} from '{old_role_name}' to '{target_role_name}'.",
    )
    await db.commit()

    # Reload with relations
    user = (await db.execute(user_stmt)).scalar_one()
    return await _format_credential_response(user, current_user.id, db)
