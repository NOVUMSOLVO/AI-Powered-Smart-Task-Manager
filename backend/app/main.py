import os
import json
from fastapi import FastAPI, Depends, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import time
import uuid
from dotenv import load_dotenv

from app.api import api_router
from app.core.database import engine, get_db, Base
from app.core.logging_config import logger
from app.core.versioning import include_api_versions, VersionHeaderMiddleware, get_api_router, api_versions
from app.models import Priority

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="AI-Powered Smart Task Manager",
    description="A task management API with AI prioritization capabilities",
    version="0.1.0",
)

# Configure CORS
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = str(uuid.uuid4())
    start_time = time.time()
    
    # Add request_id to log context
    logger.info(f"Request started: {request.method} {request.url.path}", 
                extra={"request_id": request_id})
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(f"Request completed: {request.method} {request.url.path} - Status: {response.status_code} - Duration: {process_time:.3f}s",
                extra={"request_id": request_id})
    
    # Add request ID to response headers
    response.headers["X-Request-ID"] = request_id
    
    return response

# Add rate limiting middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    from app.core.rate_limit import general_rate_limiter, auth_rate_limiter
    
    # Skip rate limiting for certain paths if needed
    path = request.url.path
    
    # Apply stricter rate limiting for authentication endpoints
    if path.startswith("/api/auth"):
        if not await auth_rate_limiter.check_rate_limit(request.client.host):
            logger.warning(f"Auth rate limit exceeded for {request.client.host}")
            return Response(
                content=json.dumps({"detail": "Authentication rate limit exceeded"}),
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                media_type="application/json"
            )
    # Apply general rate limiting for all other endpoints
    else:
        if not await general_rate_limiter.check_rate_limit(request.client.host):
            logger.warning(f"General rate limit exceeded for {request.client.host}")
            return Response(
                content=json.dumps({"detail": "Rate limit exceeded. Please try again later."}),
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                media_type="application/json"
            )
    
    response = await call_next(request)
    return response

# Add version header middleware
app.add_middleware(VersionHeaderMiddleware)

# Include versioned API routers
include_api_versions(app)

# Include API router for backward compatibility during migration
app.include_router(api_router)

# Create database tables on startup if they don't exist
@app.on_event("startup")
async def startup_event():
    Base.metadata.create_all(bind=engine)
    
    # Seed priorities if they don't exist
    db = next(get_db())
    if db.query(Priority).count() == 0:
        priorities = [
            {"name": "High", "weight": 3},
            {"name": "Medium", "weight": 2},
            {"name": "Low", "weight": 1}
        ]
        for p in priorities:
            db.add(Priority(**p))
        db.commit()

# Health check endpoint
@app.get("/health")
async def health():
    return {"status": "ok"}

# Root endpoint
@app.get("/")
async def root():
    available_versions = list(api_versions.keys())
    return {
        "message": "Welcome to the AI-Powered Smart Task Manager API",
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "api_versions": available_versions,
        "current_default_version": "v1"
    }
