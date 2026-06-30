import pytest
from httpx import AsyncClient


class TestExport:
    async def test_export_unauthorized(self, client: AsyncClient):
        response = await client.get("/api/v1/export/resume/00000000-0000-0000-0000-000000000000/pdf")
        assert response.status_code == 401

    async def test_export_invalid_uuid(self, client: AsyncClient, auth_cookies: dict):
        response = await client.get(
            "/api/v1/export/resume/not-a-uuid/pdf",
            cookies=auth_cookies,
            headers={"X-Requested-With": "XMLHttpRequest"},
        )
        assert response.status_code == 422

    async def test_export_not_found(self, client: AsyncClient, auth_cookies: dict):
        response = await client.get(
            "/api/v1/export/resume/00000000-0000-0000-0000-000000000000/pdf?template=classic",
            cookies=auth_cookies,
            headers={"X-Requested-With": "XMLHttpRequest"},
        )
        assert response.status_code == 404

    async def test_export_invalid_template(self, client: AsyncClient, auth_cookies: dict):
        create = await client.post(
            "/api/v1/resumes",
            json={"title": "Export Test"},
            cookies=auth_cookies,
            headers={"X-Requested-With": "XMLHttpRequest"},
        )
        rid = create.json()["id"]

        response = await client.get(
            f"/api/v1/export/resume/{rid}/pdf?template=invalid",
            cookies=auth_cookies,
            headers={"X-Requested-With": "XMLHttpRequest"},
        )
        assert response.status_code == 400
