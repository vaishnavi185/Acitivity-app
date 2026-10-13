
from pydantic import BaseModel, Field, model_validator


class CategoryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=50)
    slug: str = Field(min_length=2, max_length=50)
    icon_name: str | None = Field(default=None, max_length=50)


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=50)
    slug: str | None = Field(default=None, min_length=2, max_length=50)
    icon_name: str | None = Field(default=None, max_length=50)

    @model_validator(mode="after")
    def reject_null_required_fields(self):
        for field in self.model_fields_set - {"icon_name"}:
            if getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")
        return self


class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    icon_name: str | None = None
