
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from config.security import get_current_user
from models.user import User
from db.database import get_db
from schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UpdateProfileRequest,
    UserResponse,
)
from service.auth_service import register_user, login_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    try:
        user = register_user(data, db)

        return UserResponse(
            id=str(user.id),
            full_name=user.full_name,
            email=user.email,
            location=user.location,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    try:
        return login_user(data, db)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )

@router.get("/me")
def get_me(
    current_user: User = Depends(get_current_user),
):
    return {
        "id": str(current_user.id),
        "full_name": current_user.full_name,
        "email": current_user.email,
        "location": current_user.location,
        "avatar_url": current_user.avatar_url,
        "bio": current_user.bio,
    }

@router.patch("/me")
def update_profile(
    data: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updates = data.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(current_user, field, value)

    try:
        db.commit()
        db.refresh(current_user)
    except Exception:
        db.rollback()
        raise

    return {
        "message": "Profile updated successfully",
        "user": {
            "id": str(current_user.id),
            "full_name": current_user.full_name,
            "email": current_user.email,
            "location": current_user.location,
            "avatar_url": current_user.avatar_url,
            "bio": current_user.bio,
        },
    }
