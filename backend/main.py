
from fastapi import FastAPI
from sqlalchemy import text

from db.database import Base, engine
from models import (
    User,
    Category,
    Activity,
    ActivityParticipant,
    ActivityLike,
    ActivityBookmark,
)
from routes import api_router

app = FastAPI(title="Activity App API")

# Create database tables
Base.metadata.create_all(bind=engine)

# Register all API routes
app.include_router(api_router)


@app.get("/")
def home():
    return {"message": "Activity App Backend is running!"}


@app.get("/test-db")
def test_db():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {"database": "Connected successfully!"}

    except Exception as e:
        return {
            "database": "Connection failed",
            "error": str(e),
        }
