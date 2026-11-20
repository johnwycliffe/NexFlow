from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from app.api.deps import SessionDep, CurrentUserDep, require_roles
from app.models.user import Role, Permission, Department, RolePermission
from app.schemas.user import (
    RoleResponse,
    RoleCreate,
    RoleUpdate,
    RolePermissionUpdate,
    PermissionResponse,
    DepartmentResponse,
    DepartmentCreate,
)
from app.schemas.common import MessageResponse
from app.services.audit_service import log_audit_trail

router = APIRouter(tags=["Roles & Organizational Hierarchy"])


# ============================================================================
# DEPARTMENTS ENDPOINTS
# ============================================================================

@router.get("/departments", response_model=List[DepartmentResponse])
async def list_departments(db: SessionDep):
    stmt = select(Department).order_by(Department.id.asc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post(
    "/departments",
    response_model=DepartmentResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("ADMINISTRATOR"))],
)
async def create_department(
    payload: DepartmentCreate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    existing = await db.execute(select(Department).where(Department.name == payload.name.strip()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Department '{payload.name}' already exists.")

    dept = Department(
        name=payload.name.strip(),
        description=payload.description,
        is_active=payload.is_active,
    )
    db.add(dept)
    await db.commit()
    await db.refresh(dept)

    await log_audit_trail(
        db=db,
        user=current_user,
        module="Organization",
        action="CREATE",
        target_id=str(dept.id),
        change_notes=f"Created department: {dept.name}",
    )
    await db.commit()
    return dept


# ============================================================================
# PERMISSIONS ENDPOINTS
# ============================================================================

@router.get("/permissions", response_model=List[PermissionResponse])
async def list_permissions(db: SessionDep):
    stmt = select(Permission).order_by(Permission.module_key.asc(), Permission.permission_key.asc())
    result = await db.execute(stmt)
    return result.scalars().all()


# ============================================================================
# ROLES ENDPOINTS
# ============================================================================

@router.get("/roles", response_model=List[RoleResponse])
async def list_roles(db: SessionDep):
    stmt = select(Role).options(selectinload(Role.permissions)).order_by(Role.id.asc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post(
    "/roles",
    response_model=RoleResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("ADMINISTRATOR"))],
)
async def create_role(
    payload: RoleCreate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    existing = await db.execute(select(Role).where(Role.role_name == payload.role_name.strip()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Role '{payload.role_name}' already exists.")

    role = Role(
        role_name=payload.role_name.strip(),
        description=payload.description,
        is_system_role=False,
        is_active=payload.is_active,
    )
    db.add(role)
    await db.flush()

    if payload.permission_ids:
        for pid in payload.permission_ids:
            db.add(RolePermission(role_id=role.id, permission_id=pid))

    await db.commit()
    
    # Reload with permissions
    stmt = select(Role).options(selectinload(Role.permissions)).where(Role.id == role.id)
    reloaded = (await db.execute(stmt)).scalar_one()

    await log_audit_trail(
        db=db,
        user=current_user,
        module="Roles & RBAC",
        action="CREATE",
        target_id=str(role.id),
        change_notes=f"Created role '{role.role_name}' with {len(reloaded.permissions)} permissions.",
    )
    await db.commit()
    return reloaded


@router.put(
    "/roles/{role_id}/permissions",
    response_model=RoleResponse,
    dependencies=[Depends(require_roles("ADMINISTRATOR"))],
)
async def update_role_permissions(
    role_id: int,
    payload: RolePermissionUpdate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    stmt = select(Role).where(Role.id == role_id)
    result = await db.execute(stmt)
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found.")

    # Protect system administrator role from having all permissions removed
    if role.is_system_role and role.role_name in ("Administrator", "ADMINISTRATOR"):
        if not payload.permission_keys:
            raise HTTPException(status_code=400, detail="Cannot revoke all permissions from the Administrator role.")

    # Fetch matching permissions
    perms_stmt = select(Permission).where(Permission.permission_key.in_(payload.permission_keys))
    perms_res = await db.execute(perms_stmt)
    matching_perms = list(perms_res.scalars().all())

    # Replace role permissions safely
    await db.execute(delete(RolePermission).where(RolePermission.role_id == role.id))
    for p in matching_perms:
        db.add(RolePermission(role_id=role.id, permission_id=p.id))

    await log_audit_trail(
        db=db,
        user=current_user,
        module="Roles & RBAC",
        action="UPDATE",
        target_id=str(role.id),
        change_notes=f"Updated permissions for role '{role.role_name}': assigned {len(matching_perms)} permissions.",
    )
    await db.commit()

    reloaded_stmt = select(Role).options(selectinload(Role.permissions)).where(Role.id == role.id)
    reloaded_role = (await db.execute(reloaded_stmt)).scalar_one()
    return reloaded_role
