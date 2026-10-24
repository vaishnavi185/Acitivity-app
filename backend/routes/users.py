from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from config.security import get_current_user
from db.database import get_db
from models.activity_like import ActivityLike
from models.buddy import Buddy
from models.user import User
from routes.activities import serialize_activities
from schemas.buddy import (
    BuddyActionOut,
    BuddyListItem,
    BuddyListOut,
    BuddyOut,
    BuddyStatusOut,
    BuddyUserOut,
)
from schemas.user import UserProfileResponse, UserProfileUpdate
from service.avatar_service import (
    MAX_AVATAR_SIZE,
    remove_avatar,
    save_avatar,
)
from service.activity_social_service import get_user_bookmarked_activities

router = APIRouter(prefix="/users", tags=["Users"])


def serialize_user(user: User) -> dict:
    return {
        "id": str(user.id),
        "full_name": user.full_name,
        "email": user.email,
        "phone_number": user.phone_number,
        "location": user.location,
        "avatar_url": user.avatar_url,
        "bio": user.bio,
    }


@router.get("/me", response_model=UserProfileResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    return serialize_user(current_user)


@router.post("/me/avatar", response_model=UserProfileResponse)
async def upload_current_user_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        content = await file.read(MAX_AVATAR_SIZE + 1)
    finally:
        await file.close()

    new_avatar_url = save_avatar(content, file.content_type)
    previous_avatar_url = current_user.avatar_url
    current_user.avatar_url = new_avatar_url

    try:
        db.commit()
    except Exception:
        db.rollback()
        remove_avatar(new_avatar_url)
        raise

    db.refresh(current_user)
    if previous_avatar_url != new_avatar_url:
        remove_avatar(previous_avatar_url)

    return serialize_user(current_user)


@router.post(
    "/{user_id}/follow",
    response_model=BuddyOut,
    status_code=status.HTTP_200_OK,
)
def follow_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="You cannot follow yourself")

    followed_user = db.get(User, user_id)
    if followed_user is None:
        raise HTTPException(status_code=404, detail="User not found")

    existing_follow = (
        db.query(Buddy)
        .filter(
            Buddy.follower_id == current_user.id,
            Buddy.following_id == user_id,
        )
        .first()
    )
    if existing_follow is not None:
        return existing_follow

    buddy = Buddy(follower_id=current_user.id, following_id=user_id)
    db.add(buddy)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing_follow = (
            db.query(Buddy)
            .filter(
                Buddy.follower_id == current_user.id,
                Buddy.following_id == user_id,
            )
            .first()
        )
        if existing_follow is not None:
            return existing_follow
        raise HTTPException(
            status_code=409,
            detail="Unable to create follow relationship",
        ) from None

    return buddy


@router.delete("/{user_id}/follow", response_model=BuddyActionOut)
def unfollow_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="You cannot unfollow yourself")

    followed_user = db.get(User, user_id)
    if followed_user is None:
        raise HTTPException(status_code=404, detail="User not found")

    db.query(Buddy).filter(
        Buddy.follower_id == current_user.id,
        Buddy.following_id == user_id,
    ).delete(synchronize_session=False)
    db.commit()
    return {"message": "User unfollowed", "is_buddy": False}


@router.get("/me/following", response_model=BuddyListOut)
def list_following(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(User, Buddy)
        .join(Buddy, Buddy.following_id == User.id)
        .filter(Buddy.follower_id == current_user.id)
        .order_by(Buddy.created_at.desc())
        .all()
    )
    return BuddyListOut(
        total=len(rows),
        items=[
            BuddyListItem(
                user=BuddyUserOut.model_validate(user),
                created_at=buddy.created_at,
            )
            for user, buddy in rows
        ],
    )


@router.get("/me/followers", response_model=BuddyListOut)
def list_followers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(User, Buddy)
        .join(Buddy, Buddy.follower_id == User.id)
        .filter(Buddy.following_id == current_user.id)
        .order_by(Buddy.created_at.desc())
        .all()
    )
    return BuddyListOut(
        total=len(rows),
        items=[
            BuddyListItem(
                user=BuddyUserOut.model_validate(user),
                created_at=buddy.created_at,
            )
            for user, buddy in rows
        ],
    )


@router.get("/{user_id}/buddy-status", response_model=BuddyStatusOut)
def get_buddy_status(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    is_buddy = (
        db.query(Buddy)
        .filter(
            Buddy.follower_id == current_user.id,
            Buddy.following_id == user_id,
        )
        .first()
        is not None
    )
    is_follower = (
        db.query(Buddy)
        .filter(
            Buddy.follower_id == user_id,
            Buddy.following_id == current_user.id,
        )
        .first()
        is not None
    )
    buddies_count = (
        db.query(Buddy)
        .filter(Buddy.follower_id == user_id)
        .count()
    )
    followers_count = (
        db.query(Buddy)
        .filter(Buddy.following_id == user_id)
        .count()
    )
    return BuddyStatusOut(
        is_buddy=is_buddy,
        is_follower=is_follower,
        buddies_count=buddies_count,
        followers_count=followers_count,
    )


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
