
from enum import Enum


class IndoorOutdoorType(str, Enum):
    INDOOR = "indoor"
    OUTDOOR = "outdoor"


class ActivityStatus(str, Enum):
    UPCOMING = "upcoming"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ParticipantStatus(str, Enum):
    CONFIRMED = "confirmed"
    WAITLISTED = "waitlisted"
    CANCELLED = "cancelled"
