
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from config.security import get_current_user
from db.database import get_db
from models.category import Category
from models.user import User
from schemas.category import (
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse,
)
from service.category_service import (
    create_category,
    get_all_categories,
    get_category_by_id,
    update_category,
    delete_category,
)

router = APIRouter(prefix="/categories", tags=["Categories"])


def serialize_category(category: Category):
    return {
        "id": category.id,
        "name": category.name,
        "slug": category.slug,
        "icon_name": category.icon_name,
    }


@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category_api(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        category = create_category(data, db)
        return serialize_category(category)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.get("/", response_model=list[CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    return [serialize_category(c) for c in get_all_categories(db)]


@router.get("/{category_id}", response_model=CategoryResponse)
def category_details(category_id: int, db: Session = Depends(get_db)):
    category = get_category_by_id(category_id, db)

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    return serialize_category(category)


@router.patch("/{category_id}", response_model=CategoryResponse)
def update_category_api(
    category_id: int,
    data: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    category = get_category_by_id(category_id, db)

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    try:
        return serialize_category(update_category(category, data, db))
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category_api(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    category = get_category_by_id(category_id, db)

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    delete_category(category, db)
