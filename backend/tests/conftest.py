"""Test configuration module for the Smart Task Manager backend"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app

# Create in-memory SQLite database for testing
TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def test_db():
    """Create tables for testing and drop after test is complete"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    
@pytest.fixture(scope="function")
def db_session(test_db):
    """Provide a clean test database session"""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client for API testing"""
    # Override the get_db dependency
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    # Clean up
    app.dependency_overrides.clear()
    
@pytest.fixture(scope="function")
def authenticated_client(client, db_session):
    """Create an authenticated test client"""
    # Create a test user
    from app.core.security import get_password_hash
    from app.models import User
    
    test_user = User(
        email="test@example.com",
        username="testuser",
        hashed_password=get_password_hash("Password123!"),
        is_active=True,
    )
    
    db_session.add(test_user)
    db_session.commit()
    db_session.refresh(test_user)
    
    # Authenticate
    response = client.post(
        "/api/auth/token",
        data={
            "username": "testuser",
            "password": "Password123!",
        },
    )
    
    token = response.json()["access_token"]
    client.headers.update({"Authorization": f"Bearer {token}"})
    
    yield client, test_user
