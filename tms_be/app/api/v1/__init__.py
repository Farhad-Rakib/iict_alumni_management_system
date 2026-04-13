"""API routes module initialization."""
from fastapi import APIRouter
from app.api.v1.routes.auth import router as auth_router
from app.api.v1.routes.alumni import router as alumni_router
from app.api.v1.routes.event import router as event_router
from app.api.v1.routes.job import router as job_router
from app.api.v1.routes.notice import router as notice_router
from app.api.v1.routes.election import router as election_router
from app.api.v1.routes.cms import router as cms_router
from app.api.v1.routes.rbac import router as rbac_router
from app.api.v1.routes.menu import router as menu_router
from app.api.v1.routes.site_settings import router as site_settings_router

# Create main router
api_router = APIRouter()

# Include all routers
api_router.include_router(auth_router)
api_router.include_router(alumni_router)
api_router.include_router(event_router)
api_router.include_router(job_router)
api_router.include_router(notice_router)
api_router.include_router(election_router)
api_router.include_router(cms_router)
api_router.include_router(rbac_router)
api_router.include_router(menu_router)
api_router.include_router(site_settings_router)

__all__ = ["api_router"]
