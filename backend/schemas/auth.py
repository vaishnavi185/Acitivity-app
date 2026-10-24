
from pydantic import BaseModel, EmailStr, Field, field_validator

from schemas.phone import normalize_phone_number


def _validate_bcrypt_password_bytes(password: str) -> str:
    if len(password.encode("utf-8")) > 72:
        raise ValueError("Password must not exceed 72 UTF-8 bytes")
    return password


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone_number: str = Field(min_length=7, max_length=32)
    password: str = Field(min_length=8, max_length=72)
    location: str | None = Field(default=None, max_length=120)

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, phone_number: str) -> str:
        return normalize_phone_number(phone_number)

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
    phone_number: str | None = None
    location: str | None = None


class UpdateProfileRequest(BaseModel):
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
