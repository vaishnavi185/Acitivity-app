
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from models.user import User
from schemas.auth import RegisterRequest, LoginRequest, UpdateProfileRequest
from config.security import (
    hash_password,
    verify_password,
    create_access_token,
)


def register_user(data: RegisterRequest, db: Session):
    # Check if email already exists
    existing_user = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )

    if existing_user:
        raise ValueError("Email already registered")

    # Create new user
    user = User(
        full_name=data.full_name,
        email=str(data.email).lower(),
        hashed_password=hash_password(data.password),
        location=data.location,
    )

    db.add(user)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise ValueError("Email already registered") from error
    except Exception:
        db.rollback()
        raise
    db.refresh(user)

    return user


def login_user(data: LoginRequest, db: Session):
    # Find user by email
    user = (
        db.query(User)
        .filter(User.email == str(data.email).lower())
        .first()
    )

    # Verify credentials
    if not user or not verify_password(
        data.password,
        user.hashed_password,
    ):
        raise ValueError("Invalid email or password")

    if not user.is_active:
        raise ValueError("Account is inactive")

    # Generate JWT token
    token = create_access_token(
        {"sub": str(user.id)}
    )

    return {
        "access_token": token,
        "token_type": "bearer",
    }
