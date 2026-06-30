import pytest
from httpx import AsyncClient


class TestCSRF:
    async def test_safe_methods_allowed(self, client: AsyncClient):
        response = await client.get("/api/v1/templates")
        assert response.status_code == 200

    async def test_post_without_auth_allowed(self, client: AsyncClient):
        response = await client.post("/api/v1/auth/login", json={
            "email": "x@y.com", "password": "x",
        })
        assert response.status_code in (200, 401)

    async def test_post_with_auth_requires_csrf_header(self, client: AsyncClient, auth_cookies: dict):
        response = await client.post("/api/v1/resumes", json={"title": "Test"}, cookies=auth_cookies)
        assert response.status_code == 403
        assert "CSRF" in response.json()["detail"]

    async def test_post_with_auth_and_csrf_header(self, client: AsyncClient, auth_cookies: dict):
        response = await client.post(
            "/api/v1/resumes",
            json={"title": "Test"},
            cookies=auth_cookies,
            headers={"X-Requested-With": "XMLHttpRequest"},
        )
        assert response.status_code == 201
