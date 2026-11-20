from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict, Field
from app.models.user import RoleEnum


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: RoleEnum
    user_id: int
    full_name: str
    email: str
    job_title: str = "Staff Officer"
    department: str = "Operations"
    roles: list[str] = []
    permissions: list[str] = []


class TokenPayload(BaseModel):
    sub: str | None = None
    role: str | None = None


class LoginRequest(BaseModel):
    username: str  # OAuth2 standard username field (maps to email)
    password: str


class DepartmentBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: str | None = Field(None, max_length=255)
    is_active: bool = True


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentResponse(DepartmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class PermissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    permission_key: str
    module_key: str
    description: str | None = None


class RoleBase(BaseModel):
    role_name: str = Field(..., min_length=2, max_length=100)
    description: str | None = Field(None, max_length=255)
    is_active: bool = True


class RoleCreate(RoleBase):
    permission_ids: list[int] = []


class RoleUpdate(BaseModel):
    role_name: str | None = None
    description: str | None = None
    is_active: bool | None = None
    permission_ids: list[int] | None = None


class RolePermissionUpdate(BaseModel):
    permission_keys: list[str]


class RoleResponse(RoleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_system_role: bool
    permissions: list[PermissionResponse] = []
    created_at: datetime
    updated_at: datetime


class UserBase(BaseModel):
    email: EmailStr | None = None
    full_name: str
    role: RoleEnum = RoleEnum.PRODUCTION_PLANNER
    department: str = "Operations"
    job_title: str = "Staff Officer"
    department_id: int | None = None
    is_active: bool = True


class UserCreate(UserBase):
    email: EmailStr
    password: str = Field(..., min_length=6)
    role_ids: list[int] = []


class UserUpdate(BaseModel):
    full_name: str | None = None
    role: RoleEnum | None = None
    department: str | None = None
    job_title: str | None = None
    department_id: int | None = None
    is_active: bool | None = None
    password: str | None = Field(None, min_length=6)
    role_ids: list[int] | None = None


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    roles: list[str] = []
    permissions: list[str] = []
    created_at: datetime
    updated_at: datetime


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int | None
    user_role: str
    module: str
    action: str
    target_id: str | None
    change_notes: str
    timestamp: datetime


class OfficerCredentialResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    job_title: str
    department_id: int | None = None
    department_name: str
    role_name: str
    role: RoleEnum
    email: str | None = None
    has_credentials: bool
    status: str  # ACTIVE | INACTIVE | NOT_CREATED
    is_active: bool
    is_protected: bool = False
    created_at: datetime
    updated_at: datetime


class CredentialStatsResponse(BaseModel):
    total_officers: int
    accounts_created: int
    accounts_pending: int
    active_accounts: int
    inactive_accounts: int


class ProvisionCredentialRequest(BaseModel):
    user_id: int | None = None
    full_name: str | None = None
    job_title: str | None = "Staff Officer"
    department_id: int | None = None
    role_name: str = "Production Planner"
    email: EmailStr
    password: str | None = None


class ProvisionCredentialResponse(BaseModel):
    officer: OfficerCredentialResponse
    temporary_password: str
    message: str


class UpdateEmailRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    password: str | None = None


class ResetPasswordResponse(BaseModel):
    user_id: int
    email: str
    temporary_password: str
    message: str


class UpdateRoleRequest(BaseModel):
    role_name: str


class ToggleStatusRequest(BaseModel):
    is_active: bool
