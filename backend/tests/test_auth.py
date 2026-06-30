import pytest
from httpx import AsyncClient


class TestAuth:
    async def test_register(self, client: AsyncClient):
        response = await client.post("/api/v1/auth/register", json={
            "email": "newuser@example.com",
            "password": "StrongPass1",
            "full_name": "New User",
        })
        assert response.status_code == 201

    async def test_register_duplicate(self, client: AsyncClient):
        await client.post("/api/v1/auth/register", json={
            "email": "dup@example.com",
            "password": "StrongPass1",
        })
        response = await client.post("/api/v1/auth/register", json={
            "email": "dup@example.com",
            "password": "StrongPass1",
        })
        assert response.status_code == 409

    async def test_register_weak_password(self, client: AsyncClient):
        response = await client.post("/api/v1/auth/register", json={
            "email": "weak@example.com",
            "password": "short",
        })
        assert response.status_code == 422

    async def test_login(self, client: AsyncClient):
        await client.post("/api/v1/auth/register", json={
            "email": "login@example.com",
            "password": "TestPass123",
        })
        response = await client.post("/api/v1/auth/login", json={
            "email": "login@example.com",
            "password": "TestPass123",
        })
        assert response.status_code == 200
        assert "access_token" in response.cookies
        assert "refresh_token" in response.cookies

    async def test_login_invalid(self, client: AsyncClient):
        response = await client.post("/api/v1/auth/login", json={
            "email": "nonexist@example.com",
            "password": "wrong",
        })
        assert response.status_code == 401

    async def test_me(self, client: AsyncClient, auth_cookies: dict):
        response = await client.get("/api/v1/auth/me", cookies=auth_cookies)
        assert response.status_code == 200
        assert response.json()["email"] == "test@example.com"

    async def test_me_unauthorized(self, client: AsyncClient):
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 401

    async def test_refresh(self, client: AsyncClient, auth_cookies: dict):
        response = await client.post("/api/v1/auth/refresh", cookies=auth_cookies)
        assert response.status_code == 200
        assert "access_token" in response.cookies


class TestHealth:
    async def test_health(self, client: AsyncClient):
        response = await client.get("/health")
        assert response.status_code == 200
        assert "status" in response.json()
