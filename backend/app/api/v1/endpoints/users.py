from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, delete
from sqlalchemy.orm import selectinload

from app.api.deps import SessionDep, CurrentUserDep, require_roles
from app.models.user import User, RoleEnum, Role, Department, UserRole
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.schemas.common import MessageResponse
from app.core.security import hash_password
from app.services.audit_service import log_audit_trail

router = APIRouter(prefix="/users", tags=["User Management & RBAC"])


def _format_user(user: User) -> UserResponse:
    roles_list = [r.role_name for r in (user.roles or [])]
    if not roles_list and user.role:
        roles_list = [user.role.value if hasattr(user.role, "value") else str(user.role)]

    perms_set = set()
    for r in (user.roles or []):
        for p in (r.permissions or []):
            perms_set.add(p.permission_key)

    dept_name = user.department_rel.name if user.department_rel else user.department

    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        department=dept_name,
        job_title=user.job_title or "Staff Officer",
        department_id=user.department_id,
        is_active=user.is_active,
        roles=roles_list,
        permissions=sorted(list(perms_set)),
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


@router.get(
    "",
    response_model=List[UserResponse],
)
@router.get(
    "/",
    response_model=List[UserResponse],
)
async def list_users(db: SessionDep, current_user: CurrentUserDep):
    stmt = (
        select(User)
        .options(
            selectinload(User.roles).selectinload(Role.permissions),
            selectinload(User.department_rel),
        )
        .order_by(User.id.asc())
    )
    result = await db.execute(stmt)
    users = result.scalars().all()
    return [_format_user(u) for u in users]


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("ADMINISTRATOR"))],
)
@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("ADMINISTRATOR"))],
)
async def create_user(
    payload: UserCreate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    exists = await db.execute(select(User).where(User.email == payload.email.strip().lower()))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"User with email '{payload.email}' already exists.")

    dept_name = payload.department
    if payload.department_id:
        dept = await db.get(Department, payload.department_id)
        if dept:
            dept_name = dept.name

    user = User(
        email=payload.email.strip().lower(),
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        department=dept_name,
        department_id=payload.department_id,
        job_title=payload.job_title or "Staff Officer",
        is_active=payload.is_active,
    )

    db.add(user)
    await db.flush()

    if payload.role_ids:
        for rid in payload.role_ids:
            db.add(UserRole(user_id=user.id, role_id=rid))

    await db.commit()

    # Re-fetch with relationships
    stmt = (
        select(User)
        .options(
            selectinload(User.roles).selectinload(Role.permissions),
            selectinload(User.department_rel),
        )
        .where(User.id == user.id)
    )
    user = (await db.execute(stmt)).scalar_one()

    await log_audit_trail(
        db=db,
        user=current_user,
        module="User Management",
        action="CREATE",
        target_id=str(user.id),
        change_notes=f"Provisioned new user account for {user.full_name} ({user.email}) as {user.job_title} in {user.department}.",
    )
    await db.commit()

    return _format_user(user)


@router.put(
    "/{user_id}",
    response_model=UserResponse,
    dependencies=[Depends(require_roles("ADMINISTRATOR"))],
)
async def update_user(
    user_id: int,
    payload: UserUpdate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    stmt = (
        select(User)
        .options(
            selectinload(User.roles).selectinload(Role.permissions),
            selectinload(User.department_rel),
        )
        .where(User.id == user_id)
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    update_data = payload.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        user.hashed_password = hash_password(update_data.pop("password"))

    if "role_ids" in update_data:
        role_ids = update_data.pop("role_ids")
        if role_ids is not None:
            await db.execute(delete(UserRole).where(UserRole.user_id == user.id))
            for rid in role_ids:
                db.add(UserRole(user_id=user.id, role_id=rid))

    if "department_id" in update_data and update_data["department_id"] is not None:
        dept = await db.get(Department, update_data["department_id"])
        if dept:
            user.department = dept.name
            user.department_id = dept.id

    for field, val in update_data.items():
        setattr(user, field, val)

    await log_audit_trail(
        db=db,
        user=current_user,
        module="User Management",
        action="UPDATE",
        target_id=str(user.id),
        change_notes=f"Updated profile/permissions for user {user.email}: {list(update_data.keys())}.",
    )
    await db.commit()
    await db.refresh(user)

    # Re-fetch with relations
    refetched = (await db.execute(stmt)).scalar_one()
    return _format_user(refetched)


@router.delete(
    "/{user_id}",
    response_model=MessageResponse,
    dependencies=[Depends(require_roles("ADMINISTRATOR"))],
)
async def delete_user(
    user_id: int,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    # 1. Prevent self-deletion
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own active administrator account.",
        )

    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    # 2. Prevent removing the last active administrator
    if user.role == RoleEnum.ADMINISTRATOR:
        admin_count_stmt = (
            select(func.count())
            .select_from(User)
            .where(User.role == RoleEnum.ADMINISTRATOR, User.is_active == True)
        )
        admin_count = (await db.execute(admin_count_stmt)).scalar_one_or_none() or 0
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Operation prohibited: Cannot delete the last active Administrator in the system.",
            )

    user_name = user.full_name
    user_email = user.email

    await log_audit_trail(
        db=db,
        user=current_user,
        module="User Management",
        action="DELETE",
        target_id=str(user_id),
        change_notes=f"Removed user account {user_name} ({user_email}).",
    )

    await db.delete(user)
    await db.commit()

    return MessageResponse(message=f"User account '{user_name}' ({user_email}) has been permanently deleted.")


@router.patch(
    "/{user_id}/status",
    response_model=UserResponse,
    dependencies=[Depends(require_roles("ADMINISTRATOR"))],
)
async def toggle_user_active_status(
    user_id: int,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    stmt = (
        select(User)
        .options(
            selectinload(User.roles).selectinload(Role.permissions),
            selectinload(User.department_rel),
        )
        .where(User.id == user_id)
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot toggle active status on your own logged-in account.")

    # Guard against deactivating the last active administrator
    if user.role == RoleEnum.ADMINISTRATOR and user.is_active:
        admin_count_stmt = (
            select(func.count())
            .select_from(User)
            .where(User.role == RoleEnum.ADMINISTRATOR, User.is_active == True)
        )
        admin_count = (await db.execute(admin_count_stmt)).scalar_one_or_none() or 0
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot deactivate the last active Administrator in the system.",
            )

    user.is_active = not user.is_active
    await log_audit_trail(
        db=db,
        user=current_user,
        module="User Management",
        action="STATUS_CHANGE",
        target_id=str(user.id),
        change_notes=f"Toggled active status of user {user.email} to {user.is_active}.",
    )
    await db.commit()
    await db.refresh(user)

    refetched = (await db.execute(stmt)).scalar_one()
    return _format_user(refetched)
