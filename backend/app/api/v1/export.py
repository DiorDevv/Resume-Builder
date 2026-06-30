import re
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.resume import Resume
from app.models.section import Section

router = APIRouter(prefix="/export", tags=["export"])

VALID_TEMPLATES = {"classic", "modern", "minimal"}


def sanitize_filename(name: str) -> str:
    return re.sub(r"[^\w\s-]", "", name).strip().replace(" ", "_")[:50]


def extract_name(data: dict) -> str:
    pi = data.get("personal_info") or data.get("personalInfo") or {}
    return pi.get("full_name") or "CV"


@router.get("/resume/{resume_id}/pdf")
async def export_pdf(
    resume_id: uuid.UUID,
    template: str = Query("classic", description="Template name: classic, modern, minimal"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if template not in VALID_TEMPLATES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Noto'g'ri template. Tanlang: {', '.join(VALID_TEMPLATES)}",
        )

    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == user.id)
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume topilmadi",
        )

    sections_result = await db.execute(
        select(Section)
        .where(Section.resume_id == resume.id)
        .order_by(Section.sort_order)
    )
    sections = sections_result.scalars().all()

    data = {}
    for section in sections:
        data[section.section_type] = section.data

    name = extract_name(data)
    filename = f"{sanitize_filename(name)}_CV.pdf"

    try:
        from app.services.pdf_generator import generate_pdf
        from app.core.logging import logger

        pdf_bytes = await generate_pdf(template, data, filename)
    except Exception as e:
        logger.error(f"PDF generation failed for resume {resume_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="PDF yaratishda xatolik yuz berdi",
        )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Type": "application/pdf",
        },
    )
