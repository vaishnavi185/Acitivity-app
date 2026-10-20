import uuid
from typing import Literal

from fastapi import HTTPException, status
from sqlalchemy import func, intersect, select, union
from sqlalchemy.orm import Session, joinedload

from models.activity import Activity
from models.activity_participant import ActivityParticipant
from models.enums import ParticipantStatus
from models.user import User
from schemas.profile import PublicProfileOut
from service.buddy_service import get_buddy_status


def _user_activity_ids(user_id: uuid.UUID):
    """Build the distinct activity IDs a user hosts or confirmed-joins."""
    return union(
        select(Activity.id.label("activity_id")).where(
            Activity.host_id == user_id
        ),
        select(ActivityParticipant.activity_id.label("activity_id")).where(
            ActivityParticipant.user_id == user_id,
            ActivityParticipant.status == ParticipantStatus.CONFIRMED,
        ),
    )


def _common_activity_ids(me_id: uuid.UUID, user_id: uuid.UUID):
    """Build the activity IDs shared by the viewer and profile user."""
    profile_activity_ids = _user_activity_ids(user_id).subquery()
    viewer_activity_ids = _user_activity_ids(me_id).subquery()
    return intersect(
        select(profile_activity_ids.c.activity_id),
        select(viewer_activity_ids.c.activity_id),
    )


def get_public_profile(
    db: Session,
    me_id: uuid.UUID,
    user_id: uuid.UUID,
) -> PublicProfileOut:
    """Return public profile details and buddy state for the current viewer."""
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    buddy_status = get_buddy_status(db, me_id, user_id)
    hosted_count = db.execute(
        select(func.count())
        .select_from(Activity)
        .where(Activity.host_id == user_id)
    ).scalar_one()
    common_count = 0
    if me_id != user_id:
        common_count = db.execute(
            select(func.count())
            .select_from(Activity)
            .where(Activity.id.in_(_common_activity_ids(me_id, user_id)))
        ).scalar_one()

    return PublicProfileOut(
        id=user.id,
        full_name=user.full_name,
        location=user.location,
        avatar_url=user.avatar_url,
        bio=user.bio,
        **buddy_status.model_dump(),
        is_own_profile=me_id == user_id,
        hosted_count=hosted_count,
        common_count=common_count,
    )


def list_profile_activities(
    db: Session,
    me_id: uuid.UUID,
    user_id: uuid.UUID,
    tab: Literal["hosted", "common"],
    limit: int,
    offset: int,
) -> tuple[int, list[Activity]]:
    """Return one page of hosted or commonly attended activities."""
    if db.get(User, user_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    if tab == "hosted":
        activity_filter = Activity.host_id == user_id
    elif me_id == user_id:
        return 0, []
    else:
        activity_filter = Activity.id.in_(_common_activity_ids(me_id, user_id))

    total = db.execute(
        select(func.count()).select_from(Activity).where(activity_filter)
    ).scalar_one()
    activities = (
        db.query(Activity)
        .options(
            joinedload(Activity.category),
            joinedload(Activity.host),
        )
        .filter(activity_filter)
        .order_by(Activity.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return total, activities
