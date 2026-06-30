import pytest
from httpx import AsyncClient

CSRF_HEADERS = {"X-Requested-With": "XMLHttpRequest"}


class TestResumes:
    async def test_create_resume(self, client: AsyncClient, auth_cookies: dict):
        response = await client.post("/api/v1/resumes", json={
            "title": "My CV",
            "language": "uz",
        }, cookies=auth_cookies, headers=CSRF_HEADERS)
        assert response.status_code == 201
        assert response.json()["title"] == "My CV"

    async def test_list_resumes(self, client: AsyncClient, auth_cookies: dict):
        response = await client.get("/api/v1/resumes", cookies=auth_cookies)
        assert response.status_code == 200
        assert "resumes" in response.json()

    async def test_get_resume(self, client: AsyncClient, auth_cookies: dict):
        create_res = await client.post("/api/v1/resumes", json={
            "title": "Test CV",
        }, cookies=auth_cookies, headers=CSRF_HEADERS)
        rid = create_res.json()["id"]

        response = await client.get(f"/api/v1/resumes/{rid}", cookies=auth_cookies)
        assert response.status_code == 200
        assert response.json()["id"] == rid

    async def test_delete_resume(self, client: AsyncClient, auth_cookies: dict):
        create_res = await client.post("/api/v1/resumes", json={
            "title": "To Delete",
        }, cookies=auth_cookies, headers=CSRF_HEADERS)
        rid = create_res.json()["id"]

        response = await client.delete(f"/api/v1/resumes/{rid}", cookies=auth_cookies, headers=CSRF_HEADERS)
        assert response.status_code == 204

    async def test_create_section(self, client: AsyncClient, auth_cookies: dict):
        create_res = await client.post("/api/v1/resumes", json={
            "title": "CV with sections",
        }, cookies=auth_cookies, headers=CSRF_HEADERS)
        rid = create_res.json()["id"]

        response = await client.post(f"/api/v1/resumes/{rid}/sections", json={
            "section_type": "personal_info",
            "sort_order": 0,
            "data": {"full_name": "Ali", "email": "ali@test.com"},
        }, cookies=auth_cookies, headers=CSRF_HEADERS)
        assert response.status_code == 201
