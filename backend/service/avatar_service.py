import logging
import uuid
from pathlib import Path

from fastapi import HTTPException, status

AVATAR_DIR = Path(__file__).resolve().parents[1] / "uploads" / "avatars"
MAX_AVATAR_SIZE = 5 * 1024 * 1024
AVATAR_TYPES = {
    "image/jpeg": (".jpg", lambda content: content.startswith(b"\xff\xd8\xff")),
    "image/png": (".png", lambda content: content.startswith(b"\x89PNG\r\n\x1a\n")),
    "image/webp": (
        ".webp",
        lambda content: (
            len(content) >= 12
            and content.startswith(b"RIFF")
            and content[8:12] == b"WEBP"
        ),
    ),
}
logger = logging.getLogger(__name__)


def save_avatar(content: bytes, content_type: str | None) -> str:
    image_type = AVATAR_TYPES.get(content_type or "")
    if (
        image_type is None
        or not content
        or len(content) > MAX_AVATAR_SIZE
        or not image_type[1](content)
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Upload a valid JPEG, PNG, or WebP image up to 5 MB",
        )

    extension = image_type[0]
    filename = f"{uuid.uuid4().hex}{extension}"
    AVATAR_DIR.mkdir(parents=True, exist_ok=True)
    (AVATAR_DIR / filename).write_bytes(content)
    return f"/uploads/avatars/{filename}"


def remove_avatar(avatar_url: str | None) -> None:
    prefix = "/uploads/avatars/"
    if not avatar_url or not avatar_url.startswith(prefix):
        return

    avatar_path = (AVATAR_DIR / Path(avatar_url).name).resolve()
    if avatar_path.parent != AVATAR_DIR.resolve():
        return

    try:
        avatar_path.unlink(missing_ok=True)
    except OSError:
        logger.exception("Unable to remove replaced avatar file")
