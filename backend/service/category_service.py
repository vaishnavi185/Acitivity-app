
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from models.category import Category
from schemas.category import CategoryCreate, CategoryUpdate


def create_category(data: CategoryCreate, db: Session):
    existing = (
        db.query(Category)
        .filter(
            (Category.name == data.name)
            | (Category.slug == data.slug)
        )
        .first()
    )

    if existing:
        raise ValueError("Category name or slug already exists")

    category = Category(**data.model_dump())

    db.add(category)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise ValueError("Category name or slug already exists") from error
    except Exception:
        db.rollback()
        raise
    db.refresh(category)

    return category


def get_all_categories(db: Session):
    return db.query(Category).order_by(Category.name).all()


def get_category_by_id(category_id, db: Session):
    return db.query(Category).filter(Category.id == category_id).first()


def update_category(category: Category, data: CategoryUpdate, db: Session):
    updates = data.model_dump(exclude_unset=True)

    if updates.get("name") is not None:
        existing = (
            db.query(Category)
            .filter(
                Category.name == updates["name"],
                Category.id != category.id,
            )
            .first()
        )
        if existing:
            raise ValueError("Category name already exists")

    if updates.get("slug") is not None:
        existing = (
            db.query(Category)
            .filter(
                Category.slug == updates["slug"],
                Category.id != category.id,
            )
            .first()
        )
        if existing:
            raise ValueError("Category slug already exists")

    for field, value in updates.items():
        setattr(category, field, value)

    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise ValueError("Category name or slug already exists") from error
    except Exception:
        db.rollback()
        raise
    db.refresh(category)

    return category


def delete_category(category: Category, db: Session):
    try:
        db.delete(category)
        db.commit()
    except Exception:
        db.rollback()
        raise
