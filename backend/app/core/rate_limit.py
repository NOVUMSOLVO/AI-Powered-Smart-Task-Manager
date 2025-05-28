"""Rate limiting module for API protection"""

import time
from typing import Dict, Tuple, Optional
from fastapi import Request, HTTPException, status
import asyncio
from app.core.logging_config import logger

class RateLimiter:
    """
    Simple in-memory rate limiter.
    In production, use a more robust solution like Redis.
    """
    
    def __init__(self, rate_limit: int = 100, time_window: int = 60):
        """
        Initialize rate limiter
        :param rate_limit: Maximum requests per time window
        :param time_window: Time window in seconds
        """
        self.rate_limit = rate_limit
        self.time_window = time_window
        self.client_requests: Dict[str, Tuple[int, float]] = {}
        self.lock = asyncio.Lock()
    
    async def check_rate_limit(self, client_id: str) -> bool:
        """
        Check if client has exceeded rate limit
        :param client_id: Unique client identifier (IP, API key, etc.)
        :return: True if limit not exceeded, False otherwise
        """
        async with self.lock:
            current_time = time.time()
            
            # Clean up old entries every 100 requests
            if len(self.client_requests) > 100:
                await self._cleanup(current_time)
            
            # Get client's request history
            requests, window_start = self.client_requests.get(client_id, (0, current_time))
            
            # Reset window if time window has passed
            if current_time - window_start > self.time_window:
                requests = 0
                window_start = current_time
            
            # Check if rate limit is exceeded
            if requests >= self.rate_limit:
                return False
            
            # Update client's request count
            self.client_requests[client_id] = (requests + 1, window_start)
            return True
    
    async def _cleanup(self, current_time: float) -> None:
        """Remove entries older than time window"""
        to_delete = []
        
        for client_id, (_, window_start) in self.client_requests.items():
            if current_time - window_start > self.time_window:
                to_delete.append(client_id)
        
        for client_id in to_delete:
            del self.client_requests[client_id]

# Initialize rate limiter with default settings
general_rate_limiter = RateLimiter()

# More strict rate limiter for authentication endpoints
auth_rate_limiter = RateLimiter(rate_limit=5, time_window=60)

async def rate_limit_dependency(
    request: Request, 
    limiter: Optional[RateLimiter] = None,
):
    """
    FastAPI dependency for rate limiting
    :param request: FastAPI request object
    :param limiter: Rate limiter instance, defaults to general_rate_limiter
    """
    if limiter is None:
        limiter = general_rate_limiter
    
    # Get client identifier (IP address in this case)
    client_id = request.client.host
    
    # Check rate limit
    if not await limiter.check_rate_limit(client_id):
        logger.warning(f"Rate limit exceeded for {client_id}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later."
        )
