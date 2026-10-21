
import math
import uuid

from sqlalchemy import exists, func, or_
from sqlalchemy.orm import Session, joinedload, selectinload

from models.activity import Activity
from models.activity_location import ActivityLocation
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
    latitude = activity_data.pop("latitude")
    longitude = activity_data.pop("longitude")

    activity = Activity(
        **activity_data,
        host_id=current_user.id,
    )

    db.add(activity)
    try:
        db.flush()
        if latitude is not None and longitude is not None:
            db.add(
                ActivityLocation(
                    activity_id=activity.id,
                    latitude=latitude,
                    longitude=longitude,
                )
            )
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(activity)
    activity.latitude = latitude
    activity.longitude = longitude
    return activity


def get_activities(
    db: Session,
    category_id: int | None = None,
    environment: str | None = None,
    search: str | None = None,
    buddy_user_id: uuid.UUID | None = None,
    near_latitude: float | None = None,
    near_longitude: float | None = None,
    radius_km: float = 25,
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

    if near_latitude is not None and near_longitude is not None:
        query = query.join(
            ActivityLocation,
            ActivityLocation.activity_id == Activity.id,
        )
        latitude_delta = radius_km / 110.5
        longitude_delta = min(
            180,
            radius_km
            / (111.32 * max(abs(math.cos(math.radians(near_latitude))), 1e-6)),
        )
        west = near_longitude - longitude_delta
        east = near_longitude + longitude_delta
        if west < -180:
            longitude_bounds = or_(
                ActivityLocation.longitude >= west + 360,
                ActivityLocation.longitude <= east,
            )
        elif east > 180:
            longitude_bounds = or_(
                ActivityLocation.longitude >= west,
                ActivityLocation.longitude <= east - 360,
            )
        else:
            longitude_bounds = ActivityLocation.longitude.between(west, east)
        query = query.filter(
            ActivityLocation.latitude.between(
                max(-90, near_latitude - latitude_delta),
                min(90, near_latitude + latitude_delta),
            ),
            longitude_bounds,
        )

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            Activity.title.ilike(term)
            | Activity.description.ilike(term)
            | Activity.location.ilike(term)
        )

    if near_latitude is not None and near_longitude is not None:
        rows = (
            query.add_columns(
                ActivityLocation.latitude,
                ActivityLocation.longitude,
            )
            .all()
        )
        activities_with_distance = []
        center_latitude = math.radians(near_latitude)
        for activity, latitude, longitude in rows:
            activity_latitude = math.radians(latitude)
            latitude_delta = activity_latitude - center_latitude
            longitude_delta = math.radians(longitude - near_longitude)
            haversine = (
                math.sin(latitude_delta / 2) ** 2
                + math.cos(center_latitude)
                * math.cos(activity_latitude)
                * math.sin(longitude_delta / 2) ** 2
            )
            distance_km = 6371.0088 * 2 * math.asin(
                math.sqrt(min(1, haversine))
            )
            if distance_km > radius_km:
                continue
            activity.latitude = latitude
            activity.longitude = longitude
            activity.distance_km = round(float(distance_km), 2)
            activities_with_distance.append((activity, distance_km))
        activities_with_distance.sort(
            key=lambda item: (item[1], item[0].created_at),
            reverse=False,
        )
        return [
            activity
            for activity, _distance in activities_with_distance[skip:skip + limit]
        ]

    return query.order_by(Activity.created_at.desc()).offset(skip).limit(limit).all()


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
    latitude = updates.pop("latitude", None)
    longitude = updates.pop("longitude", None)
    coordinates_provided = "latitude" in data.model_fields_set

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

    if coordinates_provided:
        coordinates = db.get(ActivityLocation, activity.id)
        if coordinates is None:
            coordinates = ActivityLocation(activity_id=activity.id)
            db.add(coordinates)
        coordinates.latitude = latitude
        coordinates.longitude = longitude
    elif (
        updates.get("location") is not None
        and updates["location"] != activity.location
    ):
        coordinates = db.get(ActivityLocation, activity.id)
        if coordinates is not None:
            db.delete(coordinates)

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
