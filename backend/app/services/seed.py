from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.template import Template
from app.core.logging import logger


SEED_TEMPLATES = [
    {"name": "classic", "is_active": True, "thumbnail_url": None},
    {"name": "modern", "is_active": True, "thumbnail_url": None},
    {"name": "minimal", "is_active": True, "thumbnail_url": None},
]


async def seed_templates(db: AsyncSession) -> None:
    for tmpl in SEED_TEMPLATES:
        result = await db.execute(select(Template).where(Template.name == tmpl["name"]))
        existing = result.scalar_one_or_none()
        if not existing:
            template = Template(**tmpl)
            db.add(template)
            logger.info(f"Template seeded: {tmpl['name']}")

    await db.commit()
    logger.info("Template seeding completed")
