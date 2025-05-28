from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.api import api_router
from app.core.database import engine, get_db, Base
from app.models import Priority

app = FastAPI(
    title="AI-Powered Smart Task Manager",
    description="A task management API with AI prioritization capabilities",
    version="0.1.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, change this to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
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
    return {
        "message": "Welcome to the AI-Powered Smart Task Manager API",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }
