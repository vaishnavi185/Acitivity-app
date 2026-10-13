from pydantic import BaseModel, EmailStr, Field, model_validator


class UserProfileResponse(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    location: str | None = None
    avatar_url: str | None = None
    bio: str | None = None


class UserProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    location: str | None = Field(default=None, max_length=120)
    avatar_url: str | None = None
    bio: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def validate_non_nullable_fields(self):
        for field in self.model_fields_set - {"location", "avatar_url", "bio"}:
            if getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")
        return self
