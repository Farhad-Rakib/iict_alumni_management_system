"""Main FastAPI application."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.api.v1 import api_router
from app.core.security import hash_password
from app.db.base import AsyncSessionLocal, init_db
from app.models.user import RoleEnum, User
from app.repositories.user import UserRepository
from app.services.menu import MenuService
from app.services.rbac import RBACService

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="Alumni Management System API",
    version=settings.APP_VERSION,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "version": settings.APP_VERSION}


# Include API routers
app.include_router(api_router)


# Startup event
async def bootstrap_security_and_navigation_state(app: FastAPI) -> None:
    """Ensure RBAC, menu, and superadmin are available after container start."""
    async with AsyncSessionLocal() as session:
        rbac_service = RBACService(session)
        await rbac_service.ensure_defaults()
        await rbac_service.sync_permissions_from_routes(app)

        user_repo = UserRepository(session)
        superadmin = await user_repo.get_by_email(settings.SUPERADMIN_EMAIL)
        if superadmin is None:
            superadmin = User(
                email=settings.SUPERADMIN_EMAIL,
                full_name=settings.SUPERADMIN_FULL_NAME,
                password_hash=hash_password(settings.SUPERADMIN_PASSWORD),
                role=RoleEnum.SUPER_ADMIN,
                is_active=True,
                is_verified=True,
            )
            session.add(superadmin)
        else:
            superadmin.role = RoleEnum.SUPER_ADMIN
            superadmin.is_active = True
            superadmin.is_verified = True
            if not superadmin.password_hash:
                superadmin.password_hash = hash_password(settings.SUPERADMIN_PASSWORD)

        await session.commit()

        menu_service = MenuService(session)
        await menu_service.ensure_seeded()


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    print(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    # Initialize database tables
    try:
        await init_db()
        await bootstrap_security_and_navigation_state(app)
        print("Database initialized")
    except Exception as e:
        print(f"Error initializing database: {e}")


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint."""
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )
