import uuid
from typing import Literal

from pydantic import BaseModel, ConfigDict

from schemas.activity import ActivityResponse as ActivityOut


class PublicProfileOut(BaseModel):
    id: uuid.UUID
    full_name: str
    location: str | None
    avatar_url: str | None
    bio: str | None
    is_buddy: bool
    is_follower: bool
    buddies_count: int
    followers_count: int
    is_own_profile: bool
    hosted_count: int
    common_count: int

    model_config = ConfigDict(from_attributes=True)


class ProfileActivitiesOut(BaseModel):
    tab: Literal["hosted", "common"]
    total: int
    items: list[ActivityOut]
