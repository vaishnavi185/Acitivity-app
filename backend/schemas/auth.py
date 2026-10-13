
from pydantic import BaseModel, EmailStr, Field, field_validator


def _validate_bcrypt_password_bytes(password: str) -> str:
    if len(password.encode("utf-8")) > 72:
        raise ValueError("Password must not exceed 72 UTF-8 bytes")
    return password


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    location: str | None = Field(default=None, max_length=120)

    @field_validator("password")
    @classmethod
    def password_fits_bcrypt(cls, password: str) -> str:
        return _validate_bcrypt_password_bytes(password)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(max_length=72)

    @field_validator("password")
    @classmethod
    def password_fits_bcrypt(cls, password: str) -> str:
        return _validate_bcrypt_password_bytes(password)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    location: str | None = None


class UpdateProfileRequest(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    location: str | None = Field(default=None, max_length=120)
    avatar_url: str | None = None
    bio: str | None = Field(default=None, max_length=500)
