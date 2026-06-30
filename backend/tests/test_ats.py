import pytest
from httpx import AsyncClient

CSRF_HEADERS = {"X-Requested-With": "XMLHttpRequest"}


class TestATSCheck:
    async def test_check_complete_data(self, client: AsyncClient):
        response = await client.post("/api/v1/ats/check", json={
            "data": {
                "personal_info": {
                    "full_name": "Ali Valiyev",
                    "email": "ali@test.com",
                    "phone": "+998901234567",
                    "city": "Tashkent",
                    "summary": "Experienced Python developer",
                    "linkedin": "https://linkedin.com/in/ali",
                    "github": "https://github.com/ali",
                },
                "work_experience": {
                    "items": [
                        {
                            "company": "Tech Corp",
                            "position": "Developer",
                            "start_date": "2020-01",
                            "end_date": "2023-12",
                            "description": "Built APIs",
                            "bullet_points": ["Designed REST API", "Implemented CI/CD", "Led team of 3"],
                        }
                    ]
                },
                "education": {
                    "items": [{"university": "MIT", "degree": "BS", "field": "CS", "start_year": "2016", "end_year": "2020"}]
                },
                "skills": {
                    "technical": ["python", "fastapi", "postgresql", "docker", "kubernetes"],
                    "soft": ["communication"],
                },
            }
        })
        assert response.status_code == 200
        result = response.json()
        assert "score" in result
        assert "issues" in result
        assert result["score"] >= 50

    async def test_check_empty_data(self, client: AsyncClient):
        response = await client.post("/api/v1/ats/check", json={"data": {}})
        assert response.status_code == 200
        result = response.json()
        assert result["score"] <= 50
        assert len(result["issues"]) > 0

    async def test_check_missing_fields(self, client: AsyncClient):
        response = await client.post("/api/v1/ats/check", json={
            "data": {
                "personal_info": {"full_name": "Ali"},
                "work_experience": {"items": []},
            }
        })
        assert response.status_code == 200
        issues = response.json()["issues"]
        assert any("Email" in i["message"] for i in issues)
        assert any("Texnik" in i["message"] for i in issues)


class TestATSScore:
    async def test_get_score(self, client: AsyncClient, auth_cookies: dict):
        create = await client.post(
            "/api/v1/resumes", json={"title": "ATS Test"},
            cookies=auth_cookies, headers=CSRF_HEADERS,
        )
        assert create.status_code == 201, f"Create resume failed: {create.text}"
        rid = create.json()["id"]

        response = await client.get(f"/api/v1/ats/score/{rid}", cookies=auth_cookies)
        assert response.status_code == 200
        assert "score" in response.json()

    async def test_get_score_unauthorized(self, client: AsyncClient):
        response = await client.get("/api/v1/ats/score/00000000-0000-0000-0000-000000000000")
        assert response.status_code == 401

    async def test_get_score_invalid_uuid(self, client: AsyncClient, auth_cookies: dict):
        response = await client.get("/api/v1/ats/score/not-a-uuid", cookies=auth_cookies)
        assert response.status_code == 422
