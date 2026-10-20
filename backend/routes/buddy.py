# routers/buddy.py
import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from config.security import get_current_user
from db.database import get_db
from models.user import User
from schemas.buddy import BuddyActionOut, BuddyListOut, BuddyStatusOut
from service import buddy_service

router = APIRouter(prefix="/buddies", tags=["buddies"])


# ---------- Add / Remove ----------
@router.post("/{user_id}", response_model=BuddyActionOut)
def add_buddy(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    return buddy_service.add_buddy(db, me.id, user_id)


@router.delete("/{user_id}", response_model=BuddyActionOut)
def remove_buddy(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    return buddy_service.remove_buddy(db, me.id, user_id)


# ---------- Status (profile page ka button + counts) ----------
@router.get("/{user_id}/status", response_model=BuddyStatusOut)
def buddy_status(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    return buddy_service.get_buddy_status(db, me.id, user_id)


# ---------- Lists ----------
@router.get("/{user_id}/buddies", response_model=BuddyListOut)
def user_buddies(
    user_id: uuid.UUID,
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    """Return the users followed by the requested user."""
    return buddy_service.list_buddies(db, user_id, limit, offset)


@router.get("/{user_id}/followers", response_model=BuddyListOut)
def user_followers(
    user_id: uuid.UUID,
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    """Return users who follow the requested user."""
    return buddy_service.list_followers(db, user_id, limit, offset)