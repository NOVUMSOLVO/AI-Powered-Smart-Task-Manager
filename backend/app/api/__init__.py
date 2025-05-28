from fastapi import APIRouter

from app.api import users, tasks, priorities

# Create API router
api_router = APIRouter()

# Include routes from other modules
api_router.include_router(users.router, prefix="/api", tags=["users"])
api_router.include_router(tasks.router, prefix="/api", tags=["tasks"])
api_router.include_router(priorities.router, prefix="/api", tags=["priorities"])
