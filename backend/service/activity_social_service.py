from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from models.activity import Activity
from models.activity_bookmark import ActivityBookmark
from models.activity_like import ActivityLike
from models.user import User
from service.activity_service import ActivityNotFoundError


def _lock_activity(activity_id, db: Session) -> Activity:
    activity = (
        db.query(Activity)
        .filter(Activity.id == activity_id)
        .with_for_update()
        .first()
    )
    if activity is None:
        raise ActivityNotFoundError("Activity not found")
    return activity


def toggle_activity_like(activity_id, user: User, db: Session) -> dict:
    try:
        activity = _lock_activity(activity_id, db)
        like = (
            db.query(ActivityLike)
            .filter(
                ActivityLike.activity_id == activity.id,
                ActivityLike.user_id == user.id,
            )
            .first()
        )

        if like:
            db.delete(like)
            is_liked = False
        else:
            db.add(ActivityLike(activity_id=activity.id, user_id=user.id))
            is_liked = True

        db.flush()
        likes_count = (
            db.query(func.count(ActivityLike.user_id))
            .filter(ActivityLike.activity_id == activity.id)
            .scalar()
        )
        activity.likes_count = likes_count
        is_bookmarked = (
            db.query(ActivityBookmark.user_id)
            .filter(
                ActivityBookmark.activity_id == activity.id,
                ActivityBookmark.user_id == user.id,
            )
            .first()
            is not None
        )
        db.commit()
        return {
            "activity_id": str(activity.id),
            "is_liked": is_liked,
            "is_bookmarked": is_bookmarked,
            "likes_count": likes_count,
        }
    except Exception:
        db.rollback()
        raise


def toggle_activity_bookmark(activity_id, user: User, db: Session) -> dict:
    try:
        activity = _lock_activity(activity_id, db)
        bookmark = (
            db.query(ActivityBookmark)
            .filter(
                ActivityBookmark.activity_id == activity.id,
                ActivityBookmark.user_id == user.id,
            )
            .first()
        )

        if bookmark:
            db.delete(bookmark)
            is_bookmarked = False
        else:
            db.add(
                ActivityBookmark(
                    activity_id=activity.id,
                    user_id=user.id,
                )
            )
            is_bookmarked = True

        is_liked = (
            db.query(ActivityLike.user_id)
            .filter(
                ActivityLike.activity_id == activity.id,
                ActivityLike.user_id == user.id,
            )
            .first()
            is not None
        )
        likes_count = (
            db.query(func.count(ActivityLike.user_id))
            .filter(ActivityLike.activity_id == activity.id)
            .scalar()
        )
        activity.likes_count = likes_count
        db.commit()
        return {
            "activity_id": str(activity.id),
            "is_bookmarked": is_bookmarked,
            "is_liked": is_liked,
            "likes_count": likes_count,
        }
    except Exception:
        db.rollback()
        raise


def get_user_bookmarked_activities(user: User, db: Session) -> list[Activity]:
    return (
        db.query(Activity)
        .options(
            joinedload(Activity.category),
            joinedload(Activity.host),
        )
        .join(
            ActivityBookmark,
            ActivityBookmark.activity_id == Activity.id,
        )
        .filter(ActivityBookmark.user_id == user.id)
        .order_by(ActivityBookmark.created_at.desc())
        .all()
    )
