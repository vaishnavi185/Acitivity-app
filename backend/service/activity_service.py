
import uuid

from sqlalchemy import exists, func
from sqlalchemy.orm import Session, joinedload, selectinload

from models.activity import Activity
from models.activity_participant import ActivityParticipant
from models.buddy import Buddy
from models.category import Category
from models.enums import IndoorOutdoorType, ParticipantStatus
from schemas.activity import ActivityCreate, ActivityUpdate


class ActivityNotFoundError(ValueError):
    pass


class ActivityConflictError(ValueError):
    pass


def create_activity(data: ActivityCreate, current_user, db: Session):
    if not db.query(Category.id).filter(Category.id == data.category_id).first():
        raise ActivityNotFoundError("Category not found")

    activity_data = data.model_dump()
    activity_data["environment"] = IndoorOutdoorType(
        activity_data["environment"]
    )

    activity = Activity(
        **activity_data,
        host_id=current_user.id,
    )

    db.add(activity)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(activity)
    return activity


def get_activities(
    db: Session,
    category_id: int | None = None,
    environment: str | None = None,
    search: str | None = None,
    buddy_user_id: uuid.UUID | None = None,
    skip: int = 0,
    limit: int = 20,
):
    query = db.query(Activity).options(
        joinedload(Activity.category),
        joinedload(Activity.host),
    )

    if category_id is not None:
        query = query.filter(Activity.category_id == category_id)

    if environment is not None:
        query = query.filter(
            Activity.environment == IndoorOutdoorType(environment)
        )

    if buddy_user_id is not None:
        followed_host = exists().where(
            Buddy.follower_id == buddy_user_id
        ).where(
            Buddy.following_id == Activity.host_id
        )
        query = query.filter(
            Activity.host_id != buddy_user_id,
            followed_host,
        )

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            Activity.title.ilike(term)
            | Activity.description.ilike(term)
            | Activity.location.ilike(term)
        )

    return (
        query.order_by(Activity.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_activity(
    activity_id,
    db: Session,
    lock: bool = False,
    include_participants: bool = False,
):
    query = db.query(Activity).options(
        joinedload(Activity.category),
        joinedload(Activity.host),
    )
    if include_participants:
        query = query.options(
            selectinload(Activity.participants).joinedload(
                ActivityParticipant.user
            )
        )
    query = query.filter(Activity.id == activity_id)
    if lock:
        query = query.with_for_update(of=Activity)
    return query.first()


def get_my_activities(current_user, db: Session):
    return (
        db.query(Activity)
        .options(
            joinedload(Activity.category),
            joinedload(Activity.host),
        )
        .filter(Activity.host_id == current_user.id)
        .order_by(Activity.created_at.desc())
        .all()
    )


def get_confirmed_participant_counts(
    activities: list[Activity],
    db: Session,
) -> dict:
    if not activities:
        return {}

    counts = (
        db.query(
            ActivityParticipant.activity_id,
            func.count(ActivityParticipant.user_id),
        )
        .filter(
            ActivityParticipant.activity_id.in_(
                [activity.id for activity in activities]
            ),
            ActivityParticipant.status == ParticipantStatus.CONFIRMED,
        )
        .group_by(ActivityParticipant.activity_id)
        .all()
    )
    return {activity_id: count for activity_id, count in counts}


def update_activity(activity, data: ActivityUpdate, db: Session):
    updates = data.model_dump(exclude_unset=True)

    if (
        updates.get("category_id") is not None
        and not db.query(Category.id)
        .filter(Category.id == updates["category_id"])
        .first()
    ):
        raise ActivityNotFoundError("Category not found")

    if updates.get("additional_needed") is not None:
        joined_count = (
            db.query(func.count(ActivityParticipant.user_id))
            .filter(
                ActivityParticipant.activity_id == activity.id,
                ActivityParticipant.status == ParticipantStatus.CONFIRMED,
            )
            .scalar()
        )
        if updates["additional_needed"] < joined_count:
            raise ActivityConflictError(
                "additional_needed cannot be less than confirmed participants"
            )

    if updates.get("environment") is not None:
        updates["environment"] = IndoorOutdoorType(
            updates["environment"]
        )

    for field, value in updates.items():
        setattr(activity, field, value)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(activity)
    return activity


def delete_activity(activity, db: Session):
    try:
        db.delete(activity)
        db.commit()
    except Exception:
        db.rollback()
        raise
