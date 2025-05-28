from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import httpx

from app.core.database import get_db
from app.core.auth import get_current_active_user
from app.models import Task, User, Priority, TaskDependency
from app.schemas import (
    Task as TaskSchema,
    TaskCreate, 
    TaskUpdate,
    TaskDependency as TaskDependencySchema,
    TaskDependencyCreate
)
from app.ai.prioritization import TaskData

router = APIRouter()

# AI Prioritization Service URL
AI_SERVICE_URL = "http://localhost:8001/prioritize_task"

# GET /tasks - Get all tasks for the current user
@router.get("/tasks", response_model=List[TaskSchema])
async def get_tasks(
    status: Optional[str] = None, 
    priority_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all tasks for the current user.
    Optionally filter by status or priority.
    """
    query = db.query(Task).filter(Task.owner_id == current_user.id)
    
    if status:
        query = query.filter(Task.status == status)
    
    if priority_id:
        query = query.filter(Task.priority_id == priority_id)
    
    return query.all()

# POST /tasks - Create a new task
@router.post("/tasks", response_model=TaskSchema, status_code=status.HTTP_201_CREATED)
async def create_task(
    task: TaskCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new task and get AI-based priority recommendation.
    """
    # Verify the priority exists
    priority = db.query(Priority).filter(Priority.id == task.priority_id).first()
    if not priority:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Priority with id {task.priority_id} not found"
        )
    
    # Create new task
    db_task = Task(
        title=task.title,
        description=task.description,
        status=task.status,
        priority_id=task.priority_id,
        owner_id=current_user.id,
        due_date=task.due_date
    )
    
    # Try to get AI priority recommendation
    ai_priority_score = None
    try:
        # Prepare task data for AI service
        task_data = TaskData(
            title=task.title,
            description=task.description or "",
            priority_id=task.priority_id,
            due_date=task.due_date.isoformat() if task.due_date else None
        )
        
        # Call AI service
        async with httpx.AsyncClient() as client:
            response = await client.post(AI_SERVICE_URL, json=task_data.dict())
            if response.status_code == 200:
                ai_priority_score = response.json().get("score")
                print(f"AI Priority Score: {ai_priority_score}")
    except Exception as e:
        print(f"Error calling AI prioritization service: {str(e)}")
        # Continue with task creation even if AI service fails
    
    # Save the task
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    return db_task

# GET /tasks/{task_id} - Get a specific task
@router.get("/tasks/{task_id}", response_model=TaskSchema)
async def get_task(
    task_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get details of a specific task.
    """
    task = db.query(Task).filter(Task.id == task_id, Task.owner_id == current_user.id).first()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

# PUT /tasks/{task_id} - Update a task
@router.put("/tasks/{task_id}", response_model=TaskSchema)
async def update_task(
    task_id: int, 
    task_update: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a specific task.
    """
    db_task = db.query(Task).filter(Task.id == task_id, Task.owner_id == current_user.id).first()
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update task fields
    update_data = task_update.dict(exclude_unset=True)
    
    # Verify priority exists if changing
    if "priority_id" in update_data and update_data["priority_id"] is not None:
        priority = db.query(Priority).filter(Priority.id == update_data["priority_id"]).first()
        if not priority:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Priority with id {update_data['priority_id']} not found"
            )
    
    # Update task
    for key, value in update_data.items():
        setattr(db_task, key, value)
    
    # Set updated_at timestamp
    db_task.updated_at = datetime.now()
    
    # Try to get AI priority recommendation
    if "title" in update_data or "description" in update_data or "due_date" in update_data:
        try:
            # Prepare task data for AI service
            task_data = TaskData(
                title=db_task.title,
                description=db_task.description or "",
                priority_id=db_task.priority_id,
                due_date=db_task.due_date.isoformat() if db_task.due_date else None
            )
            
            # Call AI service
            async with httpx.AsyncClient() as client:
                response = await client.post(AI_SERVICE_URL, json=task_data.dict())
                if response.status_code == 200:
                    ai_priority_score = response.json().get("score")
                    print(f"AI Priority Score: {ai_priority_score}")
        except Exception as e:
            print(f"Error calling AI prioritization service: {str(e)}")
    
    # Save the changes
    db.commit()
    db.refresh(db_task)
    
    return db_task

# DELETE /tasks/{task_id} - Delete a task
@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a specific task.
    """
    db_task = db.query(Task).filter(Task.id == task_id, Task.owner_id == current_user.id).first()
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Delete task dependencies
    db.query(TaskDependency).filter(
        (TaskDependency.task_id == task_id) | (TaskDependency.dependent_task_id == task_id)
    ).delete()
    
    # Delete task
    db.delete(db_task)
    db.commit()
    
    return None

# POST /tasks/{task_id}/dependencies - Add a task dependency
@router.post("/tasks/{task_id}/dependencies", response_model=TaskDependencySchema, status_code=status.HTTP_201_CREATED)
async def add_task_dependency(
    task_id: int,
    dependency: TaskDependencyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Add a dependency between tasks.
    """
    # Check that both tasks exist and belong to the current user
    task = db.query(Task).filter(Task.id == task_id, Task.owner_id == current_user.id).first()
    dependent_task = db.query(Task).filter(Task.id == dependency.dependent_task_id, Task.owner_id == current_user.id).first()
    
    if task is None or dependent_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check for circular dependencies
    if task_id == dependency.dependent_task_id:
        raise HTTPException(status_code=400, detail="Cannot create circular dependency with the same task")
    
    # Check if dependency already exists
    existing_dependency = db.query(TaskDependency).filter(
        TaskDependency.task_id == task_id,
        TaskDependency.dependent_task_id == dependency.dependent_task_id
    ).first()
    
    if existing_dependency:
        raise HTTPException(status_code=400, detail="Dependency already exists")
    
    # Create the dependency
    db_dependency = TaskDependency(
        task_id=task_id,
        dependent_task_id=dependency.dependent_task_id
    )
    
    db.add(db_dependency)
    db.commit()
    db.refresh(db_dependency)
    
    return db_dependency

# GET /tasks/{task_id}/dependencies - Get task dependencies
@router.get("/tasks/{task_id}/dependencies", response_model=List[TaskSchema])
async def get_task_dependencies(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all tasks that the specified task depends on.
    """
    # Check task exists and belongs to user
    task = db.query(Task).filter(Task.id == task_id, Task.owner_id == current_user.id).first()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Get dependencies
    dependencies = db.query(Task).join(
        TaskDependency, TaskDependency.task_id == Task.id
    ).filter(
        TaskDependency.dependent_task_id == task_id
    ).all()
    
    return dependencies

# DELETE /tasks/{task_id}/dependencies/{dependency_id} - Remove a task dependency
@router.delete("/tasks/{task_id}/dependencies/{dependency_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_task_dependency(
    task_id: int,
    dependency_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Remove a dependency between tasks.
    """
    # Check task exists and belongs to user
    task = db.query(Task).filter(Task.id == task_id, Task.owner_id == current_user.id).first()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Get the dependency
    dependency = db.query(TaskDependency).filter(
        TaskDependency.task_id == task_id,
        TaskDependency.dependent_task_id == dependency_id
    ).first()
    
    if dependency is None:
        raise HTTPException(status_code=404, detail="Dependency not found")
    
    # Delete the dependency
    db.delete(dependency)
    db.commit()
    
    return None
