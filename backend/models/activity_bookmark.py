
from sqlalchemy import Column, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from db.database import Base


class ActivityBookmark(Base):
    __tablename__ = "activity_bookmarks"

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )

    activity_id = Column(
        UUID(as_uuid=True),
        ForeignKey("activities.id", ondelete="CASCADE"),
        primary_key=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    user = relationship("User", back_populates="bookmarks")
    activity = relationship("Activity", back_populates="bookmarks")
