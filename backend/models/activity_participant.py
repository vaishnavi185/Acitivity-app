
import uuid

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Enum,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from db.database import Base
from models.enums import ParticipantStatus


class ActivityParticipant(Base):
    __tablename__ = "activity_participants"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    activity_id = Column(
        UUID(as_uuid=True),
        ForeignKey("activities.id", ondelete="CASCADE"),
        nullable=False,
    )

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    status = Column(
        Enum(
            ParticipantStatus,
            name="participant_status_enum",
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        nullable=False,
        default=ParticipantStatus.CONFIRMED,
        server_default="confirmed",
    )

    joined_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "activity_id",
            "user_id",
            name="uq_activity_user",
        ),
    )

    user = relationship("User", back_populates="participations")
    activity = relationship("Activity", back_populates="participants")
