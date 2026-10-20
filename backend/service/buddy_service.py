# services/buddy_service.py
import uuid

from fastapi import HTTPException, status
from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models.buddy import Buddy
from models.user import User
from schemas.buddy import (
    BuddyActionOut,
    BuddyListItem,
    BuddyListOut,
    BuddyStatusOut,
    BuddyUserOut,
)


def add_buddy(db: Session, current_user_id: uuid.UUID, target_user_id: uuid.UUID) -> BuddyActionOut:
    # khud ko follow nahi kar sakte
    if current_user_id == target_user_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You can't add yourself as a buddy")

    # target user exist karta hai?
    if db.get(User, target_user_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    # pehle se buddy hai to kuch mat kar (idempotent)
    if db.get(Buddy, (current_user_id, target_user_id)) is not None:
        return BuddyActionOut(message="Already buddies", is_buddy=True)

    db.add(Buddy(follower_id=current_user_id, following_id=target_user_id))
    try:
        db.commit()
    except IntegrityError:
        # do requests ek saath aayi to DB ka primary key bacha lega
        db.rollback()
        return BuddyActionOut(message="Already buddies", is_buddy=True)

    return BuddyActionOut(message="Buddy added", is_buddy=True)


def remove_buddy(db: Session, current_user_id: uuid.UUID, target_user_id: uuid.UUID) -> BuddyActionOut:
    result = db.execute(
        delete(Buddy).where(
            Buddy.follower_id == current_user_id,
            Buddy.following_id == target_user_id,
        )
    )
    db.commit()

    if result.rowcount == 0:
        return BuddyActionOut(message="Not in your buddies", is_buddy=False)
    return BuddyActionOut(message="Buddy removed", is_buddy=False)


def get_buddy_status(db: Session, current_user_id: uuid.UUID, target_user_id: uuid.UUID) -> BuddyStatusOut:
    if db.get(User, target_user_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    is_buddy = db.get(Buddy, (current_user_id, target_user_id)) is not None
    is_follower = db.get(Buddy, (target_user_id, current_user_id)) is not None

    buddies_count = db.scalar(
        select(func.count()).select_from(Buddy).where(Buddy.follower_id == target_user_id)
    )
    followers_count = db.scalar(
        select(func.count()).select_from(Buddy).where(Buddy.following_id == target_user_id)
    )

    return BuddyStatusOut(
        is_buddy=is_buddy,
        is_follower=is_follower,
        buddies_count=buddies_count or 0,
        followers_count=followers_count or 0,
    )


def list_buddies(
    db: Session,
    user_id: uuid.UUID,
    limit: int = 20,
    offset: int = 0,
) -> BuddyListOut:
    if db.get(User, user_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    base_query = (
        db.query(Buddy, User)
        .join(User, Buddy.following_id == User.id)
        .filter(Buddy.follower_id == user_id)
    )
    total = base_query.count()
    rows = (
        base_query.order_by(Buddy.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return BuddyListOut(
        total=total,
        items=[
            BuddyListItem(
                user=BuddyUserOut.model_validate(user),
                created_at=buddy.created_at,
            )
            for buddy, user in rows
        ],
    )


def list_followers(
    db: Session,
    user_id: uuid.UUID,
    limit: int = 20,
    offset: int = 0,
) -> BuddyListOut:
    if db.get(User, user_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    base_query = (
        db.query(Buddy, User)
        .join(User, Buddy.follower_id == User.id)
        .filter(Buddy.following_id == user_id)
    )
    total = base_query.count()
    rows = (
        base_query.order_by(Buddy.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return BuddyListOut(
        total=total,
        items=[
            BuddyListItem(
                user=BuddyUserOut.model_validate(user),
                created_at=buddy.created_at,
            )
            for buddy, user in rows
        ],
    )