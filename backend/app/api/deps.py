from typing import Annotated, List, Optional
from fastapi import Depends, HTTPException, Header, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User, RoleEnum, Role, Permission, Department
from app.schemas.user import TokenPayload

# auto_error=False allows seamless role-simulation from frontend while retaining full OAuth2 JWT support
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)

SessionDep = Annotated[AsyncSession, Depends(get_db)]
TokenDep = Annotated[Optional[str], Depends(oauth2_scheme)]

FRONTEND_ROLE_MAP = {
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


async def _get_user_with_relations(db: AsyncSession, statement) -> Optional[User]:
    stmt = statement.options(
        selectinload(User.roles).selectinload(Role.permissions),
        selectinload(User.department_rel),
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def get_current_user(
    db: SessionDep,
    token: TokenDep,
    x_erp_role: Optional[str] = Header(None, alias="X-ERP-Role"),
) -> User:
    """
    Unified Authentication Dependency:
    1. If Bearer JWT token provided, validate JWT signature & retrieve user from DB with roles/permissions.
    2. If no token, check X-ERP-Role header (frontend role simulator) and inject active user for that role.
    3. Fallback to active Administrator so dev/frontend requests succeed out-of-the-box.
    """
    if token:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            user_id_str: str = payload.get("sub")
            if user_id_str:
                user = await _get_user_with_relations(db, select(User).where(User.id == int(user_id_str)))
                if user:
                    if not user.is_active:
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Account is currently inactive. Please contact your administrator.",
                            headers={"WWW-Authenticate": "Bearer"},
                        )
                    return user
        except (jwt.PyJWTError, ValueError):
            pass  # Fall through to role header or default

    # Check X-ERP-Role header (from frontend simulator)
    if x_erp_role:
        target_role = FRONTEND_ROLE_MAP.get(x_erp_role)
        if target_role:
            role_user = await _get_user_with_relations(
                db, select(User).where(User.role == target_role, User.is_active == True).limit(1)
            )
            if role_user:
                return role_user

    # Default fallback: fetch primary active administrator
    admin_user = await _get_user_with_relations(
        db, select(User).where(User.role == RoleEnum.ADMINISTRATOR, User.is_active == True).limit(1)
    )
    if admin_user:
        return admin_user

    # Fetch any first active user
    any_user = await _get_user_with_relations(
        db, select(User).where(User.is_active == True).limit(1)
    )
    if any_user:
        return any_user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No active user found. Please initialize administrator.",
        headers={"WWW-Authenticate": "Bearer"},
    )


CurrentUserDep = Annotated[User, Depends(get_current_user)]


def require_roles(*allowed_roles: str):
    """
    Role-Based Access Control (RBAC) Dependency.
    ADMINISTRATOR role is automatically granted superuser bypass access across all endpoints.
    Other roles must match one of the allowed_roles.
    """
    async def role_checker(current_user: CurrentUserDep) -> User:
        user_role_str = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)

        # Superuser bypass: administrator role always allowed
        if user_role_str == RoleEnum.ADMINISTRATOR.value or any(r.role_name in ("Administrator", "ADMINISTRATOR") for r in (current_user.roles or [])):
            return current_user

        # User's role must match one of the allowed_roles
        user_roles_list = [user_role_str] + [r.role_name for r in (current_user.roles or [])]
        if not any(r in allowed_roles for r in user_roles_list):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: Your active role ({user_role_str}) lacks permission for this operation.",
            )
        return current_user

    return role_checker


def require_permissions(*required_permissions: str):
    """
    Granular Permission Dependency.
    ADMINISTRATOR role is automatically granted superuser bypass access across all endpoints.
    Other users must have role(s) that provide the required permission(s).
    """
    async def permission_checker(current_user: CurrentUserDep) -> User:
        user_role_str = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
        if user_role_str == RoleEnum.ADMINISTRATOR.value or any(r.role_name in ("Administrator", "ADMINISTRATOR") for r in current_user.roles):
            return current_user

        user_perms = set()
        for r in current_user.roles:
            for p in r.permissions:
                user_perms.add(p.permission_key)

        missing = [p for p in required_permissions if p not in user_perms]
        if missing:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: Missing required permission(s): {', '.join(missing)}",
            )
        return current_user

    return permission_checker
