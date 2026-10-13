
import uuid

from sqlalchemy import (
    Column,
    String,
    Text,
    Integer,
    Date,
    Time,
    DateTime,
    ForeignKey,
    CheckConstraint,
    Enum,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from db.database import Base
from models.enums import IndoorOutdoorType, ActivityStatus


class Activity(Base):
    __tablename__ = "activities"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    host_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    category_id = Column(
        Integer,
        ForeignKey("categories.id", ondelete="RESTRICT"),
        nullable=False,
    )

    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    cover_image_url = Column(Text, nullable=True)
    location = Column(String(255), nullable=False)

    activity_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    environment = Column(
        Enum(
            IndoorOutdoorType,
            name="indoor_outdoor_type",
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        nullable=False,
        default=IndoorOutdoorType.OUTDOOR,
        server_default="outdoor",
    )

    status = Column(
        Enum(
            ActivityStatus,
            name="activity_status_enum",
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        nullable=False,
        default=ActivityStatus.UPCOMING,
        server_default="upcoming",
    )

    # Number of additional participants needed, excluding the host
    additional_needed = Column(Integer, nullable=False)

    joined_count = Column(Integer, nullable=False, default=0, server_default="0")
    likes_count = Column(Integer, nullable=False, default=0, server_default="0")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    __table_args__ = (
        CheckConstraint(
            "additional_needed >= 1",
            name="ck_activity_additional_needed",
        ),
        CheckConstraint(
            "joined_count >= 0",
            name="ck_activity_joined_count",
        ),
        CheckConstraint(
            "likes_count >= 0",
            name="ck_activity_likes_count",
        ),
    )

    host = relationship("User", back_populates="hosted_activities")
    category = relationship("Category", back_populates="activities")
    participants = relationship(
        "ActivityParticipant",
        back_populates="activity",
        cascade="all, delete-orphan",
    )
    likes = relationship(
        "ActivityLike",
        back_populates="activity",
        cascade="all, delete-orphan",
    )
    bookmarks = relationship(
        "ActivityBookmark",
        back_populates="activity",
        cascade="all, delete-orphan",
    )
