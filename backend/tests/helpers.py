from datetime import date, timedelta
from typing import Any


def activity_payload(
    category_id: int,
    title: str = "Weekend Basketball",
) -> dict[str, Any]:
    return {
        "title": title,
        "description": "A friendly game for local players.",
        "category_id": category_id,
        "cover_image_url": None,
        "location": "Riverside Court",
        "activity_date": (date.today() + timedelta(days=7)).isoformat(),
        "start_time": "09:00:00",
        "end_time": "10:30:00",
        "environment": "outdoor",
        "additional_needed": 3,
    }
