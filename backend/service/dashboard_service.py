from datetime import date

from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session, joinedload

from models.activity import Activity
from models.activity_participant import ActivityParticipant
from models.enums import ActivityStatus, ParticipantStatus
from models.user import User


def _user_activities_query(user: User, db: Session):
    return (
        db.query(Activity)
        .outerjoin(
            ActivityParticipant,
            and_(
                ActivityParticipant.activity_id == Activity.id,
                ActivityParticipant.user_id == user.id,
                ActivityParticipant.status == ParticipantStatus.CONFIRMED,
            ),
        )
        .filter(
            or_(
                Activity.host_id == user.id,
                ActivityParticipant.user_id == user.id,
            )
        )
        .distinct()
    )


def get_dashboard_stats(user: User, db: Session) -> dict[str, int]:
    created_count = (
        db.query(func.count(Activity.id))
        .filter(Activity.host_id == user.id)
        .scalar()
    )
    joined_count = (
        db.query(func.count(func.distinct(ActivityParticipant.activity_id)))
        .filter(
            ActivityParticipant.user_id == user.id,
            ActivityParticipant.status == ParticipantStatus.CONFIRMED,
        )
        .scalar()
    )
    upcoming_count = (
        _user_activities_query(user, db)
        .filter(
            Activity.activity_date >= date.today(),
            Activity.status.in_(
                [ActivityStatus.UPCOMING, ActivityStatus.ONGOING]
            ),
        )
        .with_entities(func.count(func.distinct(Activity.id)))
        .scalar()
    )
    return {
        "created_count": created_count or 0,
        "joined_count": joined_count or 0,
        "upcoming_count": upcoming_count or 0,
    }


def get_dashboard_activities(
    user: User,
    activity_type: str,
    db: Session,
) -> list[Activity]:
    query = _user_activities_query(user, db).options(
        joinedload(Activity.category),
        joinedload(Activity.host),
    )

    if activity_type == "created":
        query = query.filter(Activity.host_id == user.id)
    elif activity_type == "joined":
        query = query.filter(
            ActivityParticipant.user_id == user.id,
            ActivityParticipant.status == ParticipantStatus.CONFIRMED,
        )
    elif activity_type == "upcoming":
        query = query.filter(
            Activity.activity_date >= date.today(),
            Activity.status.in_(
                [ActivityStatus.UPCOMING, ActivityStatus.ONGOING]
            ),
        )
    elif activity_type == "past":
        query = query.filter(
            or_(
                Activity.activity_date < date.today(),
                Activity.status == ActivityStatus.COMPLETED,
            )
        )

    return query.order_by(Activity.activity_date.desc()).all()
