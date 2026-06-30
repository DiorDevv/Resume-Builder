import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.template import Template


@pytest.fixture
async def seed_templates(db_session: AsyncSession):
    templates = [
        Template(name="classic", is_active=True),
        Template(name="modern", is_active=True),
        Template(name="minimal", is_active=True),
    ]
    for t in templates:
        db_session.add(t)
    await db_session.commit()


class TestTemplates:
    async def test_list_templates(self, client: AsyncClient, seed_templates):
        response = await client.get("/api/v1/templates")
        assert response.status_code == 200
        data = response.json()
        assert "templates" in data
        names = [t["name"] for t in data["templates"]]
        assert "classic" in names
        assert "modern" in names
        assert "minimal" in names

    async def test_get_template_by_id(self, client: AsyncClient, db_session: AsyncSession, seed_templates):
        result = await db_session.execute(
            select(Template).where(Template.name == "classic")
        )
        template = result.scalar_one()
        response = await client.get(f"/api/v1/templates/{template.id}")
        assert response.status_code == 200
        assert response.json()["name"] == "classic"

    async def test_get_template_invalid_uuid(self, client: AsyncClient):
        response = await client.get("/api/v1/templates/not-a-uuid")
        assert response.status_code == 422

    async def test_get_template_not_found(self, client: AsyncClient):
        response = await client.get("/api/v1/templates/00000000-0000-0000-0000-000000000000")
        assert response.status_code == 404
