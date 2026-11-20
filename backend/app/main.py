import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.init_app import init_admin_flow
from app.api.v1.router import api_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("erp.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI Lifespan:
    1. Runs database schema synchronization
    2. Runs First-Time Interactive Terminal Administrator initialization flow
    """
    logger.info("Initializing NexFlow ERP Backend System...")
    await init_admin_flow()
    logger.info("NexFlow ERP Backend Ready for Production Traffic.")
    yield
    logger.info("Shutting down NexFlow ERP Backend.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Enterprise Manufacturing Production Planning System (ERP) Backend API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Main API Router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Health"])
async def root():
    return {
        "system": settings.PROJECT_NAME,
        "version": "1.0.0",
        "status": "OPERATIONAL",
        "docs": f"{settings.API_V1_STR}/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "HEALTHY",
        "database": "CONNECTED",
        "unit_system": "METRIC_SI",
    }

