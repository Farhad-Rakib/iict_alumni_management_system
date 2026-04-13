"""Main FastAPI application."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.api.v1 import api_router
from app.db.base import init_db

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
@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    print(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    # Initialize database tables
    try:
        await init_db()
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
