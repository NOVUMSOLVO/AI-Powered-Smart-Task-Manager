from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import re
from pydantic import BaseModel, EmailStr, validator
from typing import Optional, Dict, Any
import html
from app.core.logging_config import logger

security = HTTPBearer()

class ValidationError(HTTPException):
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
        )

def sanitize_input(value: str) -> str:
    """Sanitize a string input to prevent XSS attacks"""
    if value is None:
        return None
    # HTML escape the string to prevent script injection
    return html.escape(value)

def validate_email(email: str) -> str:
    """Validate email format"""
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    if not re.match(pattern, email):
        raise ValidationError(f"Invalid email format: {email}")
    return email

def validate_password_strength(password: str) -> str:
    """
    Validate password strength to ensure:
    - At least 8 characters
    - Contains uppercase, lowercase, number and special character
    """
    if len(password) < 8:
        raise ValidationError("Password must be at least 8 characters long")
    
    if not re.search(r"[A-Z]", password):
        raise ValidationError("Password must contain at least one uppercase letter")
    
    if not re.search(r"[a-z]", password):
        raise ValidationError("Password must contain at least one lowercase letter")
    
    if not re.search(r"[0-9]", password):
        raise ValidationError("Password must contain at least one number")
    
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise ValidationError("Password must contain at least one special character")
    
    return password

async def validate_request_body(request: Request) -> Dict[str, Any]:
    """
    Validate and sanitize request body to prevent injection attacks
    """
    try:
        payload = await request.json()
        # If payload is a dict, recursively sanitize all string values
        if isinstance(payload, dict):
            sanitized_payload = {}
            for key, value in payload.items():
                if isinstance(value, str):
                    sanitized_payload[key] = sanitize_input(value)
                else:
                    sanitized_payload[key] = value
            return sanitized_payload
        return payload
    except Exception as e:
        logger.error(f"Invalid request body: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid request body",
        )

class SanitizedBaseModel(BaseModel):
    """
    Base model that automatically sanitizes string inputs
    """
    
    @validator("*", pre=True)
    def sanitize_strings(cls, v, values):
        if isinstance(v, str):
            return sanitize_input(v)
        return v
