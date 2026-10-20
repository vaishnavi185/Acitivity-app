# schemas/buddy.py
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class BuddyUserOut(BaseModel):
    id: uuid.UUID
    full_name: str
    location: str | None = None
    avatar_url: str | None = None
    bio: str | None = None

    model_config = ConfigDict(from_attributes=True)


class BuddyOut(BaseModel):
    follower_id: uuid.UUID
    following_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BuddyListItem(BaseModel):
    user: BuddyUserOut
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BuddyListOut(BaseModel):
    total: int
    items: list[BuddyListItem]


class BuddyStatusOut(BaseModel):
    is_buddy: bool
    is_follower: bool
    buddies_count: int
    followers_count: int


class BuddyActionOut(BaseModel):
    message: str
    is_buddy: bool