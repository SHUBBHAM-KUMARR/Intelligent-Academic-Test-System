from datetime import datetime, timezone, timedelta
import pytest
import jwt

from app import create_app
from app.config import TestingConfig
from app.extensions import db
from app.models.user_model import UserModel
from app.v1.controllers.auth_controller import generate_token


@pytest.fixture
def app():
    """Create and configure a clean Flask application instance for testing."""
    test_app = create_app(TestingConfig)

    with test_app.app_context():
        db.create_all()
        yield test_app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Test client for issuing HTTP requests."""
    return app.test_client()


@pytest.fixture
def registered_student(client):
    """Fixture providing a pre-registered student with valid credentials and JWT token."""
    credentials = {
        "name": "Alex Student",
        "email": "alex.student@example.com",
        "password": "Password123!",
    }
    res = client.post("/api/v1/auth/register", json=credentials)
    assert res.status_code == 201
    data = res.get_json()
    return {
        **credentials,
        "token": data["token"],
        "user": data["user"],
    }


@pytest.fixture
def registered_admin(client):
    """Fixture providing a pre-registered administrator with valid credentials and JWT token."""
    credentials = {
        "name": "Dr. Sarah Admin",
        "email": "sarah.admin@university.edu",
        "password": "AdminSecurePassword99",
        "role": "admin",
    }
    res = client.post("/api/v1/auth/register/admin", json=credentials)
    assert res.status_code == 201
    data = res.get_json()
    return {
        **credentials,
        "token": data["token"],
        "admin": data["admin"],
    }


# ============================================================================
# 1. UserModel Unit Tests
# ============================================================================

def test_user_password_hashing(app):
    """Test that passwords are automatically hashed and verified."""
    user = UserModel(name="Test User", email="hash@example.com", password="SecretPassword123")
    assert user.password != "SecretPassword123"
    assert user.check_password("SecretPassword123") is True
    assert user.check_password("WrongPassword") is False


def test_user_to_dict(app):
    """Test user serialization dictionary structure and absence of raw password."""
    user = UserModel(id=101, name="John Doe", email="john@example.com", role="student")
    d = user.to_dict()
    assert d["id"] == 101
    assert d["name"] == "John Doe"
    assert d["email"] == "john@example.com"
    assert d["role"] == "student"
    assert "password" not in d


def test_user_repr():
    """Test UserModel representation string."""
    user = UserModel(id=42, name="Test", email="test@domain.com")
    assert repr(user) == "<User 42: test@domain.com>"


# ============================================================================
# 2. Student Registration Endpoint Tests (/api/v1/auth/register)
# ============================================================================

def test_register_student_success(client):
    """Test successful student registration returning 201 and JWT token."""
    payload = {
        "name": "Emily Watson",
        "email": "emily@example.com",
        "password": "SecurePassword123",
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201
    data = res.get_json()
    assert data["message"] == "User registered successfully"
    assert "token" in data
    assert data["user"]["email"] == "emily@example.com"
    assert data["user"]["name"] == "Emily Watson"
    assert "password" not in data["user"]


def test_register_missing_body(client):
    """Test registration with empty or non-JSON body returns 400."""
    res = client.post("/api/v1/auth/register", data="not json", content_type="text/plain")
    assert res.status_code == 400
    data = res.get_json()
    assert "error" in data


def test_register_missing_fields(client):
    """Test registration omitting required fields returns 400 with validation errors."""
    res = client.post("/api/v1/auth/register", json={"name": "Incomplete User"})
    assert res.status_code == 400
    errors = res.get_json()["errors"]
    assert "email" in errors
    assert "password" in errors


def test_register_invalid_email(client):
    """Test registration with malformed email format returns 400."""
    res = client.post(
        "/api/v1/auth/register",
        json={"name": "Bad Email", "email": "not-an-email", "password": "validPassword123"}
    )
    assert res.status_code == 400
    assert "email" in res.get_json()["errors"]


def test_register_short_password(client):
    """Test password shorter than 8 characters is rejected."""
    res = client.post(
        "/api/v1/auth/register",
        json={"name": "Short Pass", "email": "short@example.com", "password": "short"}
    )
    assert res.status_code == 400
    assert "password" in res.get_json()["errors"]


def test_register_short_name(client):
    """Test name shorter than 3 characters is rejected."""
    res = client.post(
        "/api/v1/auth/register",
        json={"name": "Ab", "email": "ab@example.com", "password": "validPassword123"}
    )
    assert res.status_code == 400
    assert "name" in res.get_json()["errors"]


def test_register_duplicate_email(client, registered_student):
    """Test that attempting to register an existing email returns 409 Conflict."""
    res = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Duplicate Student",
            "email": registered_student["email"],
            "password": "AnotherPassword456",
        }
    )
    assert res.status_code == 409
    assert "already exists" in res.get_json()["error"]


# ============================================================================
# 3. Admin Registration Endpoint Tests (/api/v1/auth/register/admin)
# ============================================================================

def test_register_admin_success(client):
    """Test successful admin registration with default role."""
    payload = {
        "name": "Prof. Charles Xavier",
        "email": "prof.x@mutant.edu",
        "password": "CerebroPassword2026",
    }
    res = client.post("/api/v1/auth/register/admin", json=payload)
    assert res.status_code == 201
    data = res.get_json()
    assert data["message"] == "Admin registered successfully"
    assert data["admin"]["role"] == "admin"
    assert "token" in data


def test_register_superadmin_success(client):
    """Test admin registration specifying 'superadmin' role."""
    payload = {
        "name": "Super Admin",
        "email": "superadmin@iats.ac.in",
        "password": "SuperSecretKey999",
        "role": "superadmin",
    }
    res = client.post("/api/v1/auth/register/admin", json=payload)
    assert res.status_code == 201
    assert res.get_json()["admin"]["role"] == "superadmin"


def test_register_admin_invalid_role(client):
    """Test that non-admin roles (e.g. 'student' or 'guest') are rejected on admin endpoint."""
    payload = {
        "name": "Fake Admin",
        "email": "fake.admin@domain.com",
        "password": "Password123!",
        "role": "guest",
    }
    res = client.post("/api/v1/auth/register/admin", json=payload)
    assert res.status_code == 400
    assert "role" in res.get_json()["errors"]


def test_register_admin_duplicate_email(client, registered_admin):
    """Test duplicate admin registration returns 409 Conflict."""
    res = client.post(
        "/api/v1/auth/register/admin",
        json={
            "name": "Duplicate Admin",
            "email": registered_admin["email"],
            "password": "AnotherPassword789",
        }
    )
    assert res.status_code == 409


# ============================================================================
# 4. Login Endpoint Tests (/api/v1/auth/login)
# ============================================================================

def test_login_student_success(client, registered_student):
    """Test student login with valid credentials."""
    res = client.post(
        "/api/v1/auth/login",
        json={"email": registered_student["email"], "password": registered_student["password"]}
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data["message"] == "Login successful"
    assert "token" in data
    assert data["user"]["email"] == registered_student["email"]
    assert data["user"]["role"] == "student"


def test_login_case_insensitive_email(client, registered_student):
    """Test login works regardless of email capitalization."""
    res = client.post(
        "/api/v1/auth/login",
        json={
            "email": registered_student["email"].upper(),
            "password": registered_student["password"],
        }
    )
    assert res.status_code == 200
    assert res.get_json()["message"] == "Login successful"


def test_login_wrong_password(client, registered_student):
    """Test login with incorrect password returns 401 Unauthorized."""
    res = client.post(
        "/api/v1/auth/login",
        json={"email": registered_student["email"], "password": "IncorrectPassword"}
    )
    assert res.status_code == 401
    assert "Invalid email or password" in res.get_json()["error"]


def test_login_nonexistent_email(client):
    """Test login with an unregistered email returns 401 Unauthorized."""
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@example.com", "password": "AnyPassword123"}
    )
    assert res.status_code == 401
    assert "Invalid email or password" in res.get_json()["error"]


def test_login_missing_fields(client):
    """Test login without email or password returns 400 Bad Request."""
    res = client.post("/api/v1/auth/login", json={"email": "onlyemail@test.com"})
    assert res.status_code == 400
    assert "required" in res.get_json()["error"]


# ============================================================================
# 5. Profile Endpoint Tests (/api/v1/auth/profile & /api/v1/auth/me)
# ============================================================================

def test_profile_success(client, registered_student):
    """Test profile retrieval with valid JWT Bearer token."""
    res = client.get(
        "/api/v1/auth/profile",
        headers={"Authorization": f"Bearer {registered_student['token']}"}
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data["user"]["email"] == registered_student["email"]
    assert data["user"]["name"] == registered_student["name"]


def test_profile_me_alias(client, registered_student):
    """Test /api/v1/auth/me alias returns identical profile."""
    res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {registered_student['token']}"}
    )
    assert res.status_code == 200
    assert res.get_json()["user"]["email"] == registered_student["email"]


def test_profile_missing_authorization_header(client):
    """Test profile request without Authorization header returns 401."""
    res = client.get("/api/v1/auth/profile")
    assert res.status_code == 401
    assert "token required" in res.get_json()["error"]


def test_profile_invalid_token(client):
    """Test profile request with a garbage JWT token returns 401."""
    res = client.get(
        "/api/v1/auth/profile",
        headers={"Authorization": "Bearer not.a.valid.jwt.token"}
    )
    assert res.status_code == 401
    assert "Invalid token" in res.get_json()["error"]


def test_profile_expired_token(client, app, registered_student):
    """Test profile request with an expired token returns 401."""
    secret_key = app.config.get("SECRET_KEY")
    expired_payload = {
        "sub": str(registered_student["user"]["id"]),
        "email": registered_student["email"],
        "name": registered_student["name"],
        "role": "student",
        "iat": datetime.now(timezone.utc) - timedelta(days=2),
        "exp": datetime.now(timezone.utc) - timedelta(days=1),
    }
    expired_token = jwt.encode(expired_payload, secret_key, algorithm="HS256")

    res = client.get(
        "/api/v1/auth/profile",
        headers={"Authorization": f"Bearer {expired_token}"}
    )
    assert res.status_code == 401
    assert "expired" in res.get_json()["error"]


def test_profile_user_not_found(client, app):
    """Test profile request with a valid signature for a non-existent user ID returns 404."""
    secret_key = app.config.get("SECRET_KEY")
    ghost_payload = {
        "sub": "999999",
        "email": "ghost@domain.com",
        "name": "Ghost User",
        "role": "student",
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=1),
    }
    ghost_token = jwt.encode(ghost_payload, secret_key, algorithm="HS256")

    res = client.get(
        "/api/v1/auth/profile",
        headers={"Authorization": f"Bearer {ghost_token}"}
    )
    assert res.status_code == 404
    assert "User not found" in res.get_json()["error"]


# ============================================================================
# 6. Logout Endpoint Test (/api/v1/auth/logout)
# ============================================================================

def test_logout(client):
    """Test logout endpoint returns 200 acknowledgement."""
    res = client.post("/api/v1/auth/logout")
    assert res.status_code == 200
    assert "Successfully logged out" in res.get_json()["message"]


# ============================================================================
# 7. Token Generation Utility Test
# ============================================================================

def test_generate_token_structure(app):
    """Test that generate_token produces a decodable HS256 JWT with correct claims."""
    user = UserModel(id=55, name="Token Test", email="token@test.com", role="admin")
    secret_key = app.config.get("SECRET_KEY")

    token = generate_token(user, expires_in_days=3)
    decoded = jwt.decode(token, secret_key, algorithms=["HS256"])

    assert decoded["sub"] == "55"
    assert decoded["email"] == "token@test.com"
    assert decoded["name"] == "Token Test"
    assert decoded["role"] == "admin"
    assert "exp" in decoded
    assert "iat" in decoded
