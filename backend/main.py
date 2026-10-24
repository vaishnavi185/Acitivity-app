
import logging

from fastapi import FastAPI
from fastapi import HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from db.database import Base, engine
from service.avatar_service import AVATAR_DIR
from models import (
    User,
    Category,
    Activity,
    ActivityParticipant,
    ActivityLike,
    ActivityBookmark,
    Buddy,
)
from routes import api_router, profile

logger = logging.getLogger(__name__)

app = FastAPI(title="Activity App API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.mount(
    "/uploads/avatars",
    StaticFiles(directory=str(AVATAR_DIR), check_dir=False),
    name="avatar_file",
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Register all API routes
app.include_router(api_router)
app.include_router(profile.router)


@app.get("/")
def home():
    return {"message": "Activity App Backend is running!"}


@app.get("/test-db")
def test_db():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {"database": "Connected successfully!"}

    except Exception:
        logger.exception("Database connectivity check failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable",
        ) from None
