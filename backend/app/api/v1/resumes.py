import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.resume import Resume
from app.models.section import Section
from app.schemas.resume import (
    ResumeAutoSave,
    ResumeCreate,
    ResumeListResponse,
    ResumeResponse,
    ResumeUpdate,
)
from app.schemas.section import (
    SectionCreate,
    SectionReorder,
    SectionResponse,
    SectionUpdate,
    validate_section_data,
)

router = APIRouter(prefix="/resumes", tags=["resumes"])


async def get_resume_or_404(
    resume_id: uuid.UUID,
    user: User,
    db: AsyncSession,
) -> Resume:
    result = await db.execute(
        select(Resume)
        .options(selectinload(Resume.sections))
        .where(Resume.id == resume_id, Resume.user_id == user.id)
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found",
        )
    return resume


@router.get("", response_model=ResumeListResponse)
async def list_resumes(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 20,
    offset: int = 0,
):
    result = await db.execute(
        select(Resume)
        .where(Resume.user_id == user.id)
        .order_by(Resume.updated_at.desc())
        .limit(limit)
        .offset(offset)
    )
    resumes = result.scalars().all()
    return ResumeListResponse(resumes=resumes)


@router.post("", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def create_resume(
    payload: ResumeCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    resume = Resume(
        user_id=user.id,
        title=payload.title,
        template_id=payload.template_id,
        language=payload.language,
    )
    db.add(resume)
    await db.commit()
    result = await db.execute(
        select(Resume).options(selectinload(Resume.sections)).where(Resume.id == resume.id)
    )
    return result.scalar_one()


@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(
    resume_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    resume = await get_resume_or_404(resume_id, user, db)
    return resume


@router.put("/{resume_id}", response_model=ResumeResponse)
async def update_resume(
    resume_id: uuid.UUID,
    payload: ResumeUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    resume = await get_resume_or_404(resume_id, user, db)

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(resume, key, value)

    await db.commit()
    result = await db.execute(
        select(Resume).options(selectinload(Resume.sections)).where(Resume.id == resume.id)
    )
    return result.scalar_one()


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resume(
    resume_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    resume = await get_resume_or_404(resume_id, user, db)
    await db.delete(resume)
    await db.commit()


@router.patch("/{resume_id}/auto-save", response_model=ResumeResponse)
async def auto_save_resume(
    resume_id: uuid.UUID,
    payload: ResumeAutoSave,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    resume = await get_resume_or_404(resume_id, user, db)

    update_data = payload.model_dump(exclude_unset=True, exclude={"sections"})
    for key, value in update_data.items():
        setattr(resume, key, value)

    if payload.sections is not None:
        for section_data in payload.sections:
            section_id = section_data.get("id")
            if section_id:
                result = await db.execute(
                    select(Section).where(
                        Section.id == section_id,
                        Section.resume_id == resume.id,
                    )
                )
                section = result.scalar_one_or_none()
                if section:
                    if "data" in section_data:
                        section_data["data"] = validate_section_data(
                            section.section_type, section_data["data"]
                        )
                    for key, value in section_data.items():
                        if key != "id":
                            setattr(section, key, value)
            else:
                st = section_data.get("section_type", "custom")
                sd = validate_section_data(st, section_data.get("data", {}))
                section = Section(
                    resume_id=resume.id,
                    section_type=st,
                    sort_order=section_data.get("sort_order", 0),
                    title=section_data.get("title"),
                    data=sd,
                )
                db.add(section)

    await db.commit()
    result = await db.execute(
        select(Resume).options(selectinload(Resume.sections)).where(Resume.id == resume.id)
    )
    return result.scalar_one()


@router.get("/{resume_id}/sections", response_model=list[SectionResponse])
async def list_sections(
    resume_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    resume = await get_resume_or_404(resume_id, user, db)
    return resume.sections


@router.post("/{resume_id}/sections", response_model=SectionResponse, status_code=status.HTTP_201_CREATED)
async def create_section(
    resume_id: uuid.UUID,
    payload: SectionCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    resume = await get_resume_or_404(resume_id, user, db)

    section = Section(
        resume_id=resume.id,
        section_type=payload.section_type,
        sort_order=payload.sort_order,
        title=payload.title,
        data=payload.data,
    )
    db.add(section)
    await db.commit()
    await db.refresh(section)
    return section


@router.put("/{resume_id}/sections/{section_id}", response_model=SectionResponse)
async def update_section(
    resume_id: uuid.UUID,
    section_id: uuid.UUID,
    payload: SectionUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    resume = await get_resume_or_404(resume_id, user, db)

    result = await db.execute(
        select(Section).where(Section.id == section_id, Section.resume_id == resume.id)
    )
    section = result.scalar_one_or_none()
    if not section:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Section not found",
        )

    update_data = payload.model_dump(exclude_unset=True)
    if "data" in update_data:
        update_data["data"] = validate_section_data(section.section_type, update_data["data"])
    for key, value in update_data.items():
        setattr(section, key, value)

    await db.commit()
    await db.refresh(section)
    return section


@router.delete("/{resume_id}/sections/{section_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_section(
    resume_id: uuid.UUID,
    section_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    resume = await get_resume_or_404(resume_id, user, db)

    result = await db.execute(
        select(Section).where(Section.id == section_id, Section.resume_id == resume.id)
    )
    section = result.scalar_one_or_none()
    if not section:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Section not found",
        )

    await db.delete(section)
    await db.commit()


@router.put("/{resume_id}/sections/reorder", status_code=status.HTTP_200_OK)
async def reorder_sections(
    resume_id: uuid.UUID,
    payload: SectionReorder,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    resume = await get_resume_or_404(resume_id, user, db)

    for index, section_id in enumerate(payload.section_ids):
        await db.execute(
            update(Section)
            .where(Section.id == section_id, Section.resume_id == resume.id)
            .values(sort_order=index)
        )

    await db.commit()
    return {"message": "Sections reordered"}
