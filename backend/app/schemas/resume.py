import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.section import SectionResponse


class ResumeCreate(BaseModel):
    title: str = "Mening CV"
    template_id: uuid.UUID | None = None
    language: str = "uz"


class ResumeUpdate(BaseModel):
    title: str | None = None
    template_id: uuid.UUID | None = None
    language: str | None = None
    is_completed: bool | None = None


class ResumeAutoSave(BaseModel):
    title: str | None = None
    template_id: uuid.UUID | None = None
    language: str | None = None
    is_completed: bool | None = None
    sections: list[dict] | None = None


class ResumeResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    template_id: uuid.UUID | None
    language: str
    is_completed: bool
    ats_score: int | None
    created_at: datetime
    updated_at: datetime
    sections: list[SectionResponse] = []

    class Config:
        from_attributes = True


class ResumeListItem(BaseModel):
    id: uuid.UUID
    title: str
    language: str
    is_completed: bool
    ats_score: int | None
    updated_at: datetime

    class Config:
        from_attributes = True


class ResumeListResponse(BaseModel):
    resumes: list[ResumeListItem]
