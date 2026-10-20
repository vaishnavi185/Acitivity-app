
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from db.database import get_db
from config.security import get_current_user, get_optional_current_user
from models.user import User
from models.activity import Activity
from models.activity_bookmark import ActivityBookmark
from models.activity_like import ActivityLike
from models.activity_participant import ActivityParticipant
from models.enums import ParticipantStatus
from schemas.activity import ActivityCreate, ActivityResponse, ActivityUpdate
from service.activity_service import (
    ActivityConflictError,
    ActivityNotFoundError,
    create_activity,
    get_confirmed_participant_counts,
    get_activities,
    get_activity,
    get_my_activities,
    update_activity,
    delete_activity,
)
from service.activity_participant_service import (
    join_activity,
    leave_activity,
    get_my_joined_activities,
    get_my_joined_count,
)
from service.activity_social_service import (
    toggle_activity_bookmark,
    toggle_activity_like,
)

router = APIRouter(prefix="/activities", tags=["Activities"])


def serialize_activity(
    activity: Activity,
    joined_count: int,
    include_crew: bool = False,
    is_liked: bool = False,
    is_bookmarked: bool = False,
    is_joined: bool = False,
):
    crew = []
    if include_crew:
        crew = [
            {
                "id": str(participant.user.id),
                "name": participant.user.full_name,
                "location": participant.user.location,
                "avatar_url": participant.user.avatar_url,
            }
            for participant in activity.participants
            if participant.status.value == "confirmed"
        ]

    return {
        "id": str(activity.id),
        "host_id": str(activity.host_id),
        "category_id": activity.category_id,
        "category": activity.category.name,
        "host": {
            "id": str(activity.host.id),
            "name": activity.host.full_name,
            "location": activity.host.location,
            "avatar_url": activity.host.avatar_url,
        },
        "title": activity.title,
        "description": activity.description,
        "cover_image_url": activity.cover_image_url,
        "location": activity.location,
        "activity_date": activity.activity_date,
        "start_time": activity.start_time,
        "end_time": activity.end_time,
        "environment": activity.environment.value,
        "status": activity.status.value,
        "additional_needed": activity.additional_needed,
        "joined_count": joined_count,
        "available_slots": max(0, activity.additional_needed - joined_count),
        "total_group_size": activity.additional_needed + 1,
        "likes_count": activity.likes_count,
        "crew": crew,
        "is_liked": is_liked,
        "is_bookmarked": is_bookmarked,
        "is_joined": is_joined,
    }


def serialize_activities(
    activities: list[Activity],
    db: Session,
    current_user: User | None = None,
    include_crew: bool = False,
):
    counts = get_confirmed_participant_counts(activities, db)
    liked_ids = set()
    bookmarked_ids = set()
    joined_ids = set()
    if current_user and activities:
        activity_ids = [activity.id for activity in activities]
        liked_ids = {
            activity_id
            for (activity_id,) in db.query(ActivityLike.activity_id)
            .filter(
                ActivityLike.user_id == current_user.id,
                ActivityLike.activity_id.in_(activity_ids),
            )
            .all()
        }
        bookmarked_ids = {
            activity_id
            for (activity_id,) in db.query(ActivityBookmark.activity_id)
            .filter(
                ActivityBookmark.user_id == current_user.id,
                ActivityBookmark.activity_id.in_(activity_ids),
            )
            .all()
        }
        joined_ids = {
            activity_id
            for (activity_id,) in db.query(ActivityParticipant.activity_id)
            .filter(
                ActivityParticipant.user_id == current_user.id,
                ActivityParticipant.activity_id.in_(activity_ids),
                ActivityParticipant.status == ParticipantStatus.CONFIRMED,
            )
            .all()
        }
    return [
        serialize_activity(
            activity,
            counts.get(activity.id, 0),
            include_crew=include_crew,
            is_liked=activity.id in liked_ids,
            is_bookmarked=activity.id in bookmarked_ids,
            is_joined=activity.id in joined_ids,
        )
        for activity in activities
    ]


@router.post("/", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
@router.post("", status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_activity_api(
    data: ActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.end_time <= data.start_time:
        raise HTTPException(400, "End time must be after start time")

    try:
        activity = create_activity(data, current_user, db)
    except ActivityNotFoundError as error:
        raise HTTPException(404, str(error)) from error

    return serialize_activity(activity, 0)


@router.get("/", response_model=list[ActivityResponse])
@router.get("", include_in_schema=False)
def list_activities(
    search: str | None = Query(default=None, min_length=1, max_length=200),
    category_id: int | None = Query(default=None),
    environment: str | None = Query(default=None, pattern="^(indoor|outdoor)$"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    activities = get_activities(
        db,
        category_id=category_id,
        environment=environment,
        search=search,
        skip=skip,
        limit=limit,
    )
    return serialize_activities(activities, db, current_user)


@router.get("/my/created", response_model=list[ActivityResponse])
def my_created_activities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    activities = get_my_activities(current_user, db)
    return serialize_activities(activities, db, current_user)


@router.get("/my/joined/count", response_model=int)
def my_joined_activity_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_my_joined_count(current_user, db)


@router.get("/my/joined", response_model=list[ActivityResponse])
def my_joined_activities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    activities = get_my_joined_activities(current_user, db)
    return serialize_activities(activities, db, current_user)


@router.get("/{activity_id}", response_model=ActivityResponse)
def activity_details(
    activity_id: UUID,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    activity = get_activity(activity_id, db, include_participants=True)

    if not activity:
        raise HTTPException(404, "Activity not found")

    return serialize_activities(
        [activity],
        db,
        current_user,
        include_crew=True,
    )[0]


@router.patch("/{activity_id}", response_model=ActivityResponse)
def edit_activity(
    activity_id: UUID,
    data: ActivityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    activity = get_activity(activity_id, db, lock=True)

    if not activity:
        raise HTTPException(404, "Activity not found")

    if activity.host_id != current_user.id:
        raise HTTPException(403, "You can only edit your own activities")

    updates = data.model_dump(exclude_unset=True)
    start_time = updates.get("start_time", activity.start_time)
    end_time = updates.get("end_time", activity.end_time)

    if start_time is not None and end_time is not None and end_time <= start_time:
        raise HTTPException(400, "End time must be after start time")

    try:
        updated = update_activity(activity, data, db)
    except ActivityNotFoundError as error:
        raise HTTPException(404, str(error)) from error
    except ActivityConflictError as error:
        raise HTTPException(409, str(error)) from error

    counts = get_confirmed_participant_counts([updated], db)
    return serialize_activities([updated], db, current_user)[0]


@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_activity(
    activity_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    activity = get_activity(activity_id, db, lock=True)

    if not activity:
        raise HTTPException(404, "Activity not found")

    if activity.host_id != current_user.id:
        raise HTTPException(403, "You can only delete your own activities")

    delete_activity(activity, db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{activity_id}/like")
def toggle_like_api(
    activity_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return toggle_activity_like(activity_id, current_user, db)
    except ActivityNotFoundError as error:
        raise HTTPException(404, str(error)) from error


@router.post("/{activity_id}/bookmark")
def toggle_bookmark_api(
    activity_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return toggle_activity_bookmark(activity_id, current_user, db)
    except ActivityNotFoundError as error:
        raise HTTPException(404, str(error)) from error


@router.post("/{activity_id}/join", response_model=ActivityResponse)
def join_activity_api(
    activity_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        activity = join_activity(activity_id, current_user, db)
    except ActivityNotFoundError as error:
        raise HTTPException(404, str(error)) from error
    except ActivityConflictError as error:
        raise HTTPException(409, str(error)) from error

    return serialize_activities([activity], db, current_user)[0]


@router.post("/{activity_id}/leave", response_model=ActivityResponse)
@router.delete("/{activity_id}/join", response_model=ActivityResponse, include_in_schema=False)
def leave_activity_api(
    activity_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        activity = leave_activity(activity_id, current_user, db)
    except ActivityNotFoundError as error:
        raise HTTPException(404, str(error)) from error
    except ActivityConflictError as error:
        raise HTTPException(409, str(error)) from error

    return serialize_activities([activity], db, current_user)[0]
