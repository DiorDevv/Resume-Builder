import pytest
from httpx import AsyncClient


class TestRateLimit:
    @pytest.mark.skip(reason="Requires running Redis instance")
    async def test_auth_rate_limit(self, client: AsyncClient, auth_cookies: dict):
        for _ in range(10):
            await client.post("/api/v1/auth/login", json={
                "email": "test@example.com", "password": "TestPass123",
            })
        response = await client.post("/api/v1/auth/login", json={
            "email": "test@example.com", "password": "TestPass123",
        })
        assert response.status_code == 429
