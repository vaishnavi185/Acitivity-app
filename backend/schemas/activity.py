
from datetime import date, time
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class ActivityHostResponse(BaseModel):
    id: str
    name: str
    location: str | None
    avatar_url: str | None


class ActivityCrewMemberResponse(BaseModel):
    id: str
    name: str
    location: str | None
    avatar_url: str | None


class ActivityCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str
    category_id: int
    cover_image_url: str | None = None
    location: str = Field(min_length=2, max_length=255)
    activity_date: date
    start_time: time
    end_time: time
    environment: Literal["indoor", "outdoor"] = "outdoor"
    additional_needed: int = Field(ge=1)


class ActivityUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = None
    category_id: int | None = None
    cover_image_url: str | None = None
    location: str | None = Field(default=None, min_length=2, max_length=255)
    activity_date: date | None = None
    start_time: time | None = None
    end_time: time | None = None
    environment: Literal["indoor", "outdoor"] | None = None
    additional_needed: int | None = Field(default=None, ge=1)

    @model_validator(mode="after")
    def reject_null_for_required_fields(self):
        nullable_fields = {"cover_image_url"}
        for field in self.model_fields_set - nullable_fields:
            if getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")
        return self


class ActivityResponse(BaseModel):
    id: str
    host_id: str
    category_id: int
    category: str
    host: ActivityHostResponse
    title: str
    description: str
    cover_image_url: str | None
    location: str
    activity_date: date
    start_time: time
    end_time: time
    environment: str
    status: str
    additional_needed: int
    joined_count: int
    available_slots: int
    total_group_size: int
    likes_count: int
    crew: list[ActivityCrewMemberResponse] = Field(default_factory=list)
    is_liked: bool = False
    is_bookmarked: bool = False
