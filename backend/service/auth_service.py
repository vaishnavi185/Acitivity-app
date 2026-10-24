
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from models.user import User
from schemas.auth import RegisterRequest, LoginRequest, UpdateProfileRequest
from utils.phone import normalize_phone
from config.security import (
    hash_password,
    verify_password,
    create_access_token,
)


def check_signup_duplicates(
    db: Session,
    email: str,
    phone_raw: str,
) -> tuple[str, str]:
    normalized_email = email.strip().lower()
    phone = normalize_phone(phone_raw)

    existing_email = (
        db.query(User)
        .filter(User.email == normalized_email)
        .first()
    )
    if existing_email:
        raise HTTPException(
            status_code=409,
            detail="Email already registered",
        )

    verified_phone = (
        db.query(User)
        .filter(
            User.phone_number == phone,
            User.email_verified_at.is_not(None),
        )
        .first()
    )
    if verified_phone:
        raise HTTPException(
            status_code=409,
            detail="Mobile number already registered",
        )

    unverified_phone_users = (
        db.query(User)
        .filter(
            User.phone_number == phone,
            User.email_verified_at.is_(None),
        )
        .all()
    )
    if unverified_phone_users:
        for user in unverified_phone_users:
            user.phone_number = None
        db.flush()

    return normalized_email, phone


def register_user(data: RegisterRequest, db: Session):
    email, phone = check_signup_duplicates(
        db,
        str(data.email),
        data.phone_number,
    )

    # Create new user
    user = User(
        full_name=data.full_name,
        email=email,
        phone_number=phone,
        hashed_password=hash_password(data.password),
        location=data.location,
    )

    db.add(user)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Email or mobile number already registered",
        ) from error
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
