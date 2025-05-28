from fastapi import APIRouter

from app.api import users, tasks, priorities
from app.core.versioning import get_api_router

# Create API router (legacy non-versioned)
api_router = APIRouter()

# Include routes from other modules in legacy router
api_router.include_router(users.router, prefix="/api", tags=["users"])
api_router.include_router(tasks.router, prefix="/api", tags=["tasks"])
api_router.include_router(priorities.router, prefix="/api", tags=["priorities"])

# Include routes in versioned API router (v1)
v1_router = get_api_router("v1")
v1_router.include_router(users.router, tags=["users"])
v1_router.include_router(tasks.router, tags=["tasks"])
v1_router.include_router(priorities.router, tags=["priorities"])
