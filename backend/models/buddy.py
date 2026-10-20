# models/buddy.py
import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.database import Base


class Buddy(Base):
    __tablename__ = "buddies"

    follower_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    following_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    follower: Mapped["User"] = relationship(
        "User",
        foreign_keys=[follower_id],
        back_populates="following_buddies",
    )
    following: Mapped["User"] = relationship(
        "User",
        foreign_keys=[following_id],
        back_populates="follower_buddies",
    )

    __table_args__ = (
        CheckConstraint("follower_id <> following_id", name="no_self_follow"),
        Index("ix_buddies_following_id", "following_id"),
    )