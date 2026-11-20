from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import SessionDep, CurrentUserDep
from app.core.security import verify_password, create_access_token
from app.models.user import User, Role, Department
from app.schemas.user import Token, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication & Session"])


def _extract_user_roles_and_perms(user: User):
    roles_list = [r.role_name for r in (user.roles or [])]
    if not roles_list and user.role:
        roles_list = [user.role.value if hasattr(user.role, "value") else str(user.role)]

    perms_set = set()
    for r in (user.roles or []):
        for p in (r.permissions or []):
            perms_set.add(p.permission_key)

    dept_name = user.department_rel.name if user.department_rel else user.department
    return roles_list, sorted(list(perms_set)), dept_name


@router.post("/login", response_model=Token)
async def login_for_access_token(
    db: SessionDep,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
):
    stmt = (
        select(User)
        .options(
            selectinload(User.roles).selectinload(Role.permissions),
            selectinload(User.department_rel),
        )
        .where(User.email == form_data.username.strip().lower())
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is currently inactive. Please contact your administrator.",
        )

    access_token = create_access_token(subject=user.id, role=user.role.value)
    roles_list, perms_list, dept_name = _extract_user_roles_and_perms(user)

    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        job_title=user.job_title or "Staff Officer",
        department=dept_name,
        roles=roles_list,
        permissions=perms_list,
    )


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: CurrentUserDep):
    """Retrieve profile and active RBAC role for currently authenticated user."""
    roles_list, perms_list, dept_name = _extract_user_roles_and_perms(current_user)

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        department=dept_name,
        job_title=current_user.job_title or "Staff Officer",
        department_id=current_user.department_id,
        is_active=current_user.is_active,
        roles=roles_list,
        permissions=perms_list,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
    )
