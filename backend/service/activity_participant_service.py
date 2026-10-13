
from sqlalchemy.orm import Session, joinedload

from models.activity import Activity
from models.activity_participant import ActivityParticipant
from models.enums import ParticipantStatus
from service.activity_service import ActivityConflictError, ActivityNotFoundError


def _confirmed_count(activity_id, db: Session) -> int:
    return (
        db.query(ActivityParticipant)
        .filter(
            ActivityParticipant.activity_id == activity_id,
            ActivityParticipant.status == ParticipantStatus.CONFIRMED,
        )
        .count()
    )


def join_activity(activity_id, current_user, db: Session):
    activity = (
        db.query(Activity)
        .filter(Activity.id == activity_id)
        .with_for_update()
        .first()
    )

    if not activity:
        raise ActivityNotFoundError("Activity not found")

    if activity.host_id == current_user.id:
        raise ActivityConflictError("Host cannot join their own activity")

    participant = (
        db.query(ActivityParticipant)
        .filter(
            ActivityParticipant.activity_id == activity.id,
            ActivityParticipant.user_id == current_user.id,
        )
        .first()
    )

    if participant and participant.status == ParticipantStatus.CONFIRMED:
        raise ActivityConflictError("You already joined this activity")

    joined_count = _confirmed_count(activity.id, db)
    if joined_count >= activity.additional_needed:
        raise ActivityConflictError("Activity is full")

    if participant:
        participant.status = ParticipantStatus.CONFIRMED
    else:
        participant = ActivityParticipant(
            activity_id=activity.id,
            user_id=current_user.id,
            status=ParticipantStatus.CONFIRMED,
        )
        db.add(participant)

    activity.joined_count = joined_count + 1

    try:
        db.commit()
        db.refresh(activity)
    except Exception:
        db.rollback()
        raise

    return activity


def leave_activity(activity_id, current_user, db: Session):
    activity = (
        db.query(Activity)
        .filter(Activity.id == activity_id)
        .with_for_update()
        .first()
    )

    if not activity:
        raise ActivityNotFoundError("Activity not found")

    participant = (
        db.query(ActivityParticipant)
        .filter(
            ActivityParticipant.activity_id == activity.id,
            ActivityParticipant.user_id == current_user.id,
            ActivityParticipant.status == ParticipantStatus.CONFIRMED,
        )
        .first()
    )

    if not participant:
        raise ActivityConflictError("You have not joined this activity")

    joined_count = _confirmed_count(activity.id, db)
    participant.status = ParticipantStatus.CANCELLED
    activity.joined_count = max(0, joined_count - 1)

    try:
        db.commit()
        db.refresh(activity)
    except Exception:
        db.rollback()
        raise

    return activity


def get_my_joined_activities(current_user, db: Session):
    return (
        db.query(Activity)
        .options(
            joinedload(Activity.category),
            joinedload(Activity.host),
        )
        .join(
            ActivityParticipant,
            ActivityParticipant.activity_id == Activity.id,
        )
        .filter(
            ActivityParticipant.user_id == current_user.id,
            ActivityParticipant.status == ParticipantStatus.CONFIRMED,
        )
        .order_by(Activity.created_at.desc())
        .all()
    )


def get_my_joined_count(current_user, db: Session) -> int:
    return (
        db.query(ActivityParticipant)
        .filter(
            ActivityParticipant.user_id == current_user.id,
            ActivityParticipant.status == ParticipantStatus.CONFIRMED,
        )
        .count()
    )
