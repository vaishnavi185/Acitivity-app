from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

from schemas.phone import normalize_phone_number


class UserProfileResponse(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    phone_number: str | None = None
    location: str | None = None
    avatar_url: str | None = None
    bio: str | None = None


class UserProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    phone_number: str | None = Field(default=None, min_length=7, max_length=32)
    location: str | None = Field(default=None, max_length=120)
    avatar_url: str | None = None
    bio: str | None = Field(default=None, max_length=500)

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, phone_number: str | None) -> str | None:
        if phone_number is None:
            raise ValueError("Phone number cannot be null")
        return normalize_phone_number(phone_number)

    @model_validator(mode="after")
    def validate_non_nullable_fields(self):
        for field in self.model_fields_set - {
            "location",
            "avatar_url",
            "bio",
        }:
            if getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")
        return self
