from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from config.security import get_current_user
from db.database import get_db
from models.user import User
from routes.activities import serialize_activities
from service.dashboard_service import (
    get_dashboard_activities,
    get_dashboard_stats,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_dashboard_stats(current_user, db)


@router.get("/activities")
def dashboard_activities(
    activity_type: Literal["created", "joined", "upcoming", "past"] = Query(
        alias="type"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    activities = get_dashboard_activities(current_user, activity_type, db)
    return serialize_activities(activities, db, current_user)
