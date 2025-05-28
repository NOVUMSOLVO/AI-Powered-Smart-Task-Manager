from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.auth import get_current_active_user
from app.models import Priority, User
from app.schemas import Priority as PrioritySchema, PriorityCreate

router = APIRouter()

# GET /priorities - Get all priorities
@router.get("/priorities", response_model=List[PrioritySchema])
async def get_priorities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all available task priorities.
    """
    priorities = db.query(Priority).all()
    return priorities

# POST /priorities - Create a new priority (admin only in a real app)
@router.post("/priorities", response_model=PrioritySchema, status_code=status.HTTP_201_CREATED)
async def create_priority(
    priority: PriorityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new priority.
    In a real app, this would be restricted to admin users.
    """
    # Check if priority with same name already exists
    db_priority = db.query(Priority).filter(Priority.name == priority.name).first()
    if db_priority:
        raise HTTPException(status_code=400, detail="Priority with this name already exists")
    
    # Create new priority
    db_priority = Priority(
        name=priority.name,
        weight=priority.weight
    )
    
    db.add(db_priority)
    db.commit()
    db.refresh(db_priority)
    
    return db_priority

# GET /priorities/{priority_id} - Get a specific priority
@router.get("/priorities/{priority_id}", response_model=PrioritySchema)
async def get_priority(
    priority_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get details of a specific priority.
    """
    priority = db.query(Priority).filter(Priority.id == priority_id).first()
    if priority is None:
        raise HTTPException(status_code=404, detail="Priority not found")
    return priority
