from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    username: str
    email: Optional[str] = None

class UserCreate(UserBase):
    password: str

    @validator('username')
    def username_alphanumeric(cls, v):
        if not v.isalnum():
            raise ValueError('Username must be alphanumeric')
        return v

    @validator('password')
    def password_min_length(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v

class UserUpdate(BaseModel):
    email: Optional[str] = None

class User(UserBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

# Priority Schemas
class PriorityBase(BaseModel):
    name: str
    weight: int

class PriorityCreate(PriorityBase):
    pass

class Priority(PriorityBase):
    id: int

    class Config:
        orm_mode = True

# Task Schemas
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "open"
    priority_id: int
    due_date: Optional[datetime] = None

    @validator('title')
    def title_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Title cannot be empty')
        if len(v) > 100:
            raise ValueError('Title must be less than 100 characters')
        return v

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority_id: Optional[int] = None
    due_date: Optional[datetime] = None

    @validator('title')
    def title_not_empty(cls, v):
        if v is not None:
            if not v.strip():
                raise ValueError('Title cannot be empty')
            if len(v) > 100:
                raise ValueError('Title must be less than 100 characters')
        return v

class Task(TaskBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    priority: Priority

    class Config:
        orm_mode = True

# Task Dependency Schemas
class TaskDependencyCreate(BaseModel):
    task_id: int
    dependent_task_id: int

class TaskDependency(TaskDependencyCreate):
    id: int

    class Config:
        orm_mode = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
