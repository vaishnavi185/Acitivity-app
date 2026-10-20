import uuid
from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from config.security import get_current_user
from db.database import get_db
from models.user import User
from routes.activities import serialize_activities
from schemas.profile import ProfileActivitiesOut, PublicProfileOut
from service.profile_service import get_public_profile, list_profile_activities

router = APIRouter(prefix="/profiles", tags=["Profiles"])


@router.get("/{user_id}", response_model=PublicProfileOut)
def public_profile(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
) -> PublicProfileOut:
    """Return a user's public profile for the authenticated viewer."""
    return get_public_profile(db, me.id, user_id)


@router.get("/{user_id}/activities", response_model=ProfileActivitiesOut)
def profile_activities(
    user_id: uuid.UUID,
    tab: Literal["hosted", "common"] = Query(default="hosted"),
    limit: int = Query(default=10, ge=1, le=30),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
) -> ProfileActivitiesOut:
    """Return a paginated activity tab using the standard feed serialization."""
    total, activities = list_profile_activities(
        db,
        me.id,
        user_id,
        tab,
        limit,
        offset,
    )
    return ProfileActivitiesOut(
        tab=tab,
        total=total,
        items=serialize_activities(activities, db, me),
    )
