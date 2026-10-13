from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config.security import get_current_user
from db.database import get_db
from models.activity_like import ActivityLike
from models.user import User
from routes.activities import serialize_activities
from schemas.user import UserProfileResponse, UserProfileUpdate
from service.activity_social_service import get_user_bookmarked_activities

router = APIRouter(prefix="/users", tags=["Users"])


def serialize_user(user: User) -> dict:
    return {
        "id": str(user.id),
        "full_name": user.full_name,
        "email": user.email,
        "location": user.location,
        "avatar_url": user.avatar_url,
        "bio": user.bio,
    }


@router.get("/me", response_model=UserProfileResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    return serialize_user(current_user)


@router.put("/me", response_model=UserProfileResponse)
def update_current_user_profile(
    data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updates = data.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No profile fields provided")
    try:
        for field, value in updates.items():
            setattr(current_user, field, value)
        db.commit()
        db.refresh(current_user)
    except Exception:
        db.rollback()
        raise
    return serialize_user(current_user)


@router.get("/me/bookmarks")
def list_current_user_bookmarks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    activities = get_user_bookmarked_activities(current_user, db)
    activity_rows = serialize_activities(activities, db)
    liked_ids = {
        activity_id
        for (activity_id,) in db.query(ActivityLike.activity_id)
        .filter(
            ActivityLike.user_id == current_user.id,
            ActivityLike.activity_id.in_(
                [activity.id for activity in activities]
            ),
        )
        .all()
    } if activities else set()
    for row, activity in zip(activity_rows, activities):
        row["is_liked"] = activity.id in liked_ids
        row["is_bookmarked"] = True
    return activity_rows
