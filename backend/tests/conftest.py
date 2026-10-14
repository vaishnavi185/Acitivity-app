import os
import uuid
from collections.abc import Callable, Iterator
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import CHAR, create_engine, event
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy.types import TypeDecorator

# Keep the import-time application engine pointed at a deliberately unusable URL
# until it is replaced by the isolated SQLite engine below.
os.environ.update(
    {
        "SECRET_KEY": "test-only-secret-key-not-for-production",
        "ALGORITHM": "HS256",
        "DB_HOST": "test-database.invalid",
        "DB_PORT": "5432",
        "DB_NAME": "activity_test_only",
        "DB_USER": "activity_test_only",
        "DB_PASSWORD": "activity_test_only",
    }
)


class SQLiteUUID(TypeDecorator):
    impl = CHAR(36)
    cache_ok = True

    def process_bind_param(self, value: Any, _dialect: Any) -> str | None:
        return str(value) if value is not None else None

    def process_result_value(self, value: str | None, _dialect: Any) -> uuid.UUID | None:
        return uuid.UUID(value) if value is not None else None


import db.database as database  # noqa: E402

test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


@event.listens_for(test_engine, "connect")
def enable_sqlite_foreign_keys(connection: Any, _record: Any) -> None:
    cursor = connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


database.engine = test_engine
database.SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
)

from db.database import Base  # noqa: E402
import models  # noqa: E402,F401

for table in Base.metadata.tables.values():
    for column in table.columns:
        if isinstance(column.type, PostgreSQLUUID):
            column.type = SQLiteUUID()

from main import app  # noqa: E402


@pytest.fixture
def client() -> Iterator[TestClient]:
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def create_user(client: TestClient) -> Callable[..., dict[str, Any]]:
    def _create_user(
        email: str | None = None,
        full_name: str = "Test Member",
    ) -> dict[str, Any]:
        normalized_email = email or f"{uuid.uuid4().hex}@example.com"
        password = "StrongPass123!"
        registration = client.post(
            "/auth/register",
            json={
                "full_name": full_name,
                "email": normalized_email,
                "password": password,
                "location": "Test City",
            },
        )
        assert registration.status_code == 201, registration.text
        login = client.post(
            "/auth/login",
            json={"email": normalized_email, "password": password},
        )
        assert login.status_code == 200, login.text
        return {
            "user": registration.json(),
            "password": password,
            "headers": {
                "Authorization": f"Bearer {login.json()['access_token']}"
            },
        }

    return _create_user


@pytest.fixture
def create_category(client: TestClient) -> Callable[..., dict[str, Any]]:
    def _create_category(
        name: str = "Outdoor Sports",
        slug: str = "outdoor-sports",
    ) -> dict[str, Any]:
        response = client.post(
            "/categories/",
            json={"name": name, "slug": slug, "icon_name": "Activity"},
        )
        assert response.status_code == 201, response.text
        return response.json()

    return _create_category

