
import uuid

from sqlalchemy import Column, String, Text, Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    full_name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)

    location = Column(String(120), nullable=True)
    avatar_url = Column(Text, nullable=True)
    bio = Column(Text, nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    hosted_activities = relationship("Activity", back_populates="host")
    participations = relationship("ActivityParticipant", back_populates="user")
    likes = relationship("ActivityLike", back_populates="user")
    bookmarks = relationship("ActivityBookmark", back_populates="user")
    following_buddies = relationship(
        "Buddy",
        foreign_keys="Buddy.follower_id",
        back_populates="follower",
        cascade="all, delete-orphan",
    )
    follower_buddies = relationship(
        "Buddy",
        foreign_keys="Buddy.following_id",
        back_populates="following",
        cascade="all, delete-orphan",
    )
