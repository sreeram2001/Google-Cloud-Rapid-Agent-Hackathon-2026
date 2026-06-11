"""Authentication routes — signup and login with password hashing."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database import get_db
from datetime import datetime, timezone
import hashlib
import secrets

router = APIRouter()


def hash_password(password: str) -> str:
    """Hash password using SHA-256 with a salt."""
    salt = secrets.token_hex(16)
    hashed = hashlib.sha256((salt + password).encode()).hexdigest()
    return f"{salt}:{hashed}"


def verify_password(password: str, stored: str) -> bool:
    """Verify password against stored hash."""
    salt, hashed = stored.split(":")
    return hashlib.sha256((salt + password).encode()).hexdigest() == hashed


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    name: str
    email: str
    message: str


@router.post("/signup", response_model=AuthResponse)
async def signup(request: SignupRequest):
    """Register a new user."""
    db = get_db()

    # Check if email already exists
    existing = await db.users.find_one({"email": request.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password
    hashed = hash_password(request.password)

    user = {
        "name": request.name,
        "email": request.email.lower(),
        "password": hashed,
        "created_at": datetime.now(timezone.utc),
        "sessions": [],
    }

    await db.users.insert_one(user)
    await db.users.create_index("email", unique=True)

    return AuthResponse(name=request.name, email=request.email.lower(), message="Account created successfully")


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """Login with email and password."""
    db = get_db()

    user = await db.users.find_one({"email": request.email.lower()})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Verify password
    if not verify_password(request.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return AuthResponse(name=user["name"], email=user["email"], message="Login successful")
