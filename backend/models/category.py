
from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship

from db.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    name = Column(String(50), unique=True, nullable=False)
    slug = Column(String(50), unique=True, nullable=False)
    icon_name = Column(String(50), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    activities = relationship("Activity", back_populates="category")
