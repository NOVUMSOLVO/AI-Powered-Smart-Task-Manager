"""API versioning module for the Smart Task Manager"""

from typing import Callable, Dict, Type
from fastapi import APIRouter, FastAPI, Request, Response
from fastapi.routing import APIRoute
from app.core.logging_config import logger

class VersionedAPIRouter(APIRouter):
    """Custom router that supports API versioning"""
    
    def __init__(self, version: str = "v1", **kwargs):
        """
        Initialize the versioned router
        :param version: API version (e.g. 'v1', 'v2')
        """
        self.version = version
        prefix = kwargs.get("prefix", "")
        if prefix:
            kwargs["prefix"] = f"/api/{version}{prefix}"
        else:
            kwargs["prefix"] = f"/api/{version}"
        super().__init__(**kwargs)

# Dictionary to store different API versions
api_versions: Dict[str, APIRouter] = {
    "v1": APIRouter(prefix="/api/v1"),
}

def create_api_version(version: str) -> APIRouter:
    """
    Create a new API version router
    :param version: API version (e.g. 'v2', 'v3')
    :return: New APIRouter for version
    """
    if version in api_versions:
        logger.warning(f"API version {version} already exists")
        return api_versions[version]
        
    api_versions[version] = APIRouter(prefix=f"/api/{version}")
    logger.info(f"Created new API version: {version}")
    return api_versions[version]

def get_api_router(version: str = "v1") -> APIRouter:
    """
    Get API router for specific version
    :param version: API version (e.g. 'v1', 'v2')
    :return: APIRouter for version
    """
    if version not in api_versions:
        logger.warning(f"API version {version} not found, defaulting to v1")
        version = "v1"
    
    return api_versions[version]

def include_api_versions(app: FastAPI) -> None:
    """
    Include all API versions in the FastAPI app
    :param app: FastAPI application
    """
    for version, router in api_versions.items():
        app.include_router(router)
        logger.info(f"Registered API version: {version}")

class VersionHeaderMiddleware:
    """Middleware to add API version header to responses"""
    
    def __init__(self, app: FastAPI):
        self.app = app
    
    async def __call__(self, request: Request, call_next):
        response = await call_next(request)
        
        # Add API version header based on path
        path = request.url.path
        if path.startswith("/api/"):
            parts = path.split("/")
            if len(parts) > 2 and parts[2].startswith("v"):
                response.headers["X-API-Version"] = parts[2]
            else:
                response.headers["X-API-Version"] = "v1"
        
        return response
