"""Test authentication functionality"""

def test_register_user(client):
    """Test user registration flow"""
    response = client.post(
        "/api/users/register",
        json={
            "email": "newuser@example.com",
            "username": "newuser",
            "password": "StrongPassword123!",
        },
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["username"] == "newuser"
    assert "id" in data
    # Ensure password is not returned
    assert "password" not in data
    assert "hashed_password" not in data

def test_login_success(client, db_session):
    """Test successful login flow"""
    # First create a user
    from app.core.security import get_password_hash
    from app.models import User
    
    test_user = User(
        email="login@example.com",
        username="loginuser",
        hashed_password=get_password_hash("Password123!"),
        is_active=True,
    )
    
    db_session.add(test_user)
    db_session.commit()
    
    # Now try to login
    response = client.post(
        "/api/auth/token",
        data={
            "username": "loginuser",
            "password": "Password123!",
        },
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_wrong_password(client, db_session):
    """Test login with incorrect password"""
    # First create a user
    from app.core.security import get_password_hash
    from app.models import User
    
    test_user = User(
        email="wrong@example.com",
        username="wronguser",
        hashed_password=get_password_hash("Password123!"),
        is_active=True,
    )
    
    db_session.add(test_user)
    db_session.commit()
    
    # Now try to login with wrong password
    response = client.post(
        "/api/auth/token",
        data={
            "username": "wronguser",
            "password": "WrongPassword123!",
        },
    )
    
    assert response.status_code == 401
    assert "detail" in response.json()

def test_protected_route(authenticated_client):
    """Test accessing a protected route with valid token"""
    client, user = authenticated_client
    
    response = client.get("/api/users/me")
    
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == user.username
    assert data["email"] == user.email

def test_protected_route_no_auth(client):
    """Test accessing a protected route without authentication"""
    response = client.get("/api/users/me")
    
    assert response.status_code == 401
