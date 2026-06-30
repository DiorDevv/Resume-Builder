import uuid
from http.cookies import SimpleCookie
from typing import AsyncGenerator

import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.core.config import settings
from app.main import app
from app.core.security import hash_password
from app.models.user import User

settings.RATE_LIMIT_ENABLED = False

TEST_DATABASE_URL = settings.DATABASE_URL + "_test"


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    engine = create_async_engine(TEST_DATABASE_URL, echo=False, pool_pre_ping=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    connection = await engine.connect()
    transaction = await connection.begin()
    session = AsyncSession(bind=connection, expire_on_commit=False)

    yield session

    await session.close()
    await transaction.rollback()
    await connection.close()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession) -> User:
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("TestPass123"),
        full_name="Test User",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    return user


def _parse_set_cookie(headers) -> dict:
    """Parse Set-Cookie headers (httpx ASGITransport doesn't populate response.cookies)."""
    c = SimpleCookie()
    for set_cookie in headers.get_list("set-cookie"):
        c.load(set_cookie)
    return {
        "access_token": c.get("access_token").value if c.get("access_token") else None,
        "refresh_token": c.get("refresh_token").value if c.get("refresh_token") else None,
    }


@pytest_asyncio.fixture
async def auth_cookies(client: AsyncClient, test_user: User) -> dict:
    response = await client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "TestPass123",
    })
    return _parse_set_cookie(response.headers)
