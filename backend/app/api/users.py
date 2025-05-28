from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List

from app.core.database import get_db
from app.core.auth import (
    authenticate_user,
    create_access_token,
    get_password_hash,
    get_current_active_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from app.models import User
from app.schemas import User as UserSchema, UserCreate, UserUpdate, Token

router = APIRouter()

# POST /token - Login endpoint
@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token with expiry time
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

# POST /users - Create a new user
@router.post("/users", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user.
    """
    # Check if username already exists
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Check if email already exists
    if user.email:
        db_user = db.query(User).filter(User.email == user.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user with hashed password
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

# GET /users/me - Get current user
@router.get("/users/me", response_model=UserSchema)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """
    Get details of the currently authenticated user.
    """
    return current_user

# PUT /users/me - Update current user
@router.put("/users/me", response_model=UserSchema)
async def update_user(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update the currently authenticated user.
    """
    # Update fields
    update_data = user_update.dict(exclude_unset=True)
    
    # If updating email, check it's not already taken
    if "email" in update_data and update_data["email"]:
        db_user = db.query(User).filter(User.email == update_data["email"]).first()
        if db_user and db_user.id != current_user.id:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    # Apply updates
    for key, value in update_data.items():
        setattr(current_user, key, value)
    
    db.commit()
    db.refresh(current_user)
    
    return current_user
