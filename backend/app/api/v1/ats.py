import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.resume import Resume
from app.models.section import Section
from pydantic import BaseModel

router = APIRouter(prefix="/ats", tags=["ats"])


class ATSCheckRequest(BaseModel):
    data: dict

OZBEK_IT_KEYWORDS = [
    "python", "javascript", "typescript", "java", "go", "rust", "c++", "c#",
    "react", "next.js", "vue", "angular", "node.js", "express", "django",
    "fastapi", "flask", "spring", "laravel", "dotnet",
    "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
    "docker", "kubernetes", "nginx", "kafka", "rabbitmq",
    "aws", "gcp", "azure", "git", "linux", "bash",
    "sql", "rest api", "graphql", "grpc", "websocket",
    "pytest", "jest", "ci/cd", "github actions", "gitlab ci",
    "microservices", "solid", "tdd", "agile", "scrum",
    "telegram bot", "bot", "api", "backend", "frontend", "fullstack",
]


def calculate_score(data: dict) -> dict:
    score = 50
    issues = []

    info = data.get("personal_info", {})

    if not info.get("full_name"):
        score -= 10
        issues.append({"type": "error", "message": "Ism va familiya majburiy"})

    email = info.get("email", "")
    if not email:
        score -= 10
        issues.append({"type": "error", "message": "Email majburiy"})
    elif "@" not in email:
        score -= 5
        issues.append({"type": "error", "message": "Email formati noto'g'ri"})

    if not info.get("phone"):
        score -= 5
        issues.append({"type": "error", "message": "Telefon raqam majburiy"})

    if not info.get("city"):
        score -= 3
        issues.append({"type": "warning", "message": "Shahar ko'rsatilmagan"})

    if not info.get("summary"):
        score -= 5
        issues.append({"type": "warning", "message": "Professional summary yo'q"})

    if info.get("linkedin"):
        score += 3
    if info.get("github"):
        score += 3

    work = data.get("work_experience", {}).get("items", [])
    if not work:
        score -= 15
        issues.append({"type": "error", "message": "Ish tajribasi yo'q"})
    else:
        score += min(len(work) * 5, 15)

    edu = data.get("education", {}).get("items", [])
    if not edu:
        score -= 10
        issues.append({"type": "error", "message": "Ta'lim ma'lumoti yo'q"})

    skills = data.get("skills", {})
    tech_skills = skills.get("technical", [])
    if not tech_skills:
        score -= 10
        issues.append({"type": "error", "message": "Texnik ko'nikmalar yo'q"})
    else:
        matched = sum(
            1 for kw in OZBEK_IT_KEYWORDS
            if any(kw in s.lower() for s in tech_skills)
        )
        score += min(matched * 2, 10)

    has_dates = any(
        e.get("start_date") and (e.get("end_date") or e.get("is_current"))
        for e in work
    )
    if work and not has_dates:
        score -= 5
        issues.append({"type": "error", "message": "Sanalar to'liq emas"})

    def _string_values(d):
        for v in d.values():
            if isinstance(v, str):
                yield v
            elif isinstance(v, dict):
                yield from _string_values(v)
            elif isinstance(v, list):
                for item in v:
                    if isinstance(item, str):
                        yield item
                    elif isinstance(item, dict):
                        yield from _string_values(item)

    for val in _string_values(data):
        if "<table" in val.lower():
            score -= 5
            issues.append({"type": "error", "message": "Jadval ishlatilgan"})
        if any(c in val for c in "<>{}"):
            score -= 5
            issues.append({"type": "error", "message": "Mos kelmaydigan belgilar"})

    score = max(0, min(100, score))

    return {"score": score, "issues": issues}


@router.get("/score/{resume_id}")
async def get_ats_score(
    resume_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == user.id)
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found",
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

    ats_result = calculate_score(data)

    resume.ats_score = ats_result["score"]
    await db.commit()

    return ats_result


@router.post("/check")
async def check_ats_score(payload: ATSCheckRequest):
    return calculate_score(payload.data)
