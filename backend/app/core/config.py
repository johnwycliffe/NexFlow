import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Determine backend base directory
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.path.dirname(CURRENT_DIR)
BACKEND_DIR = os.path.dirname(APP_DIR)
ROOT_DIR = os.path.dirname(BACKEND_DIR)

ENV_PATHS = [
    os.path.join(ROOT_DIR, ".env"),
    os.path.join(BACKEND_DIR, ".env"),
    ".env",
]
# Select the first existing .env file or default to backend/.env
ENV_FILE = next((p for p in ENV_PATHS if os.path.exists(p)), os.path.join(BACKEND_DIR, ".env"))
DEFAULT_SQLITE_PATH = os.path.join(BACKEND_DIR, "nexflow_erp.db").replace("\\", "/")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow",
    )

    PROJECT_NAME: str = "NexFlow ERP Backend"
    API_V1_STR: str = "/api/v1"
    
    # JWT Security
    SECRET_KEY: str = "nexflow_erp_production_grade_jwt_secret_key_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8  # 8 hours

    # Database: Default to backend SQLite for zero-setup local dev/testing
    # In production, set DATABASE_URL="mysql+asyncmy://root:password@localhost:3306/nexflow_erp" in .env
    DATABASE_URL: str = f"sqlite+aiosqlite:///{DEFAULT_SQLITE_PATH}"

    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # Optional Headless/Automated Admin Setup via ENV
    INITIAL_ADMIN_EMAIL: str = ""
    INITIAL_ADMIN_FULL_NAME: str = ""
    INITIAL_ADMIN_PASSWORD: str = ""

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_database_url(cls, v: str) -> str:
        if isinstance(v, str) and "sqlite" in v and ("./nexflow_erp.db" in v or v.endswith("nexflow_erp.db")):
            return f"sqlite+aiosqlite:///{DEFAULT_SQLITE_PATH}"
        return v

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return []


settings = Settings()

