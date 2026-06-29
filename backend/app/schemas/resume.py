from pydantic import BaseModel

from app.schemas.section import SectionResponse


class ResumeCreate(BaseModel):
    title: str = "Mening CV"
    template_id: str | None = None
    language: str = "uz"


class ResumeUpdate(BaseModel):
    title: str | None = None
    template_id: str | None = None
    language: str | None = None
    is_completed: bool | None = None


class ResumeAutoSave(BaseModel):
    title: str | None = None
    template_id: str | None = None
    language: str | None = None
    is_completed: bool | None = None
    sections: list[dict] | None = None


class ResumeResponse(BaseModel):
    id: str
    user_id: str
    title: str
    template_id: str | None
    language: str
    is_completed: bool
    ats_score: int | None
    created_at: str
    updated_at: str
    sections: list[SectionResponse] = []

    class Config:
        from_attributes = True


class ResumeListItem(BaseModel):
    id: str
    title: str
    language: str
    is_completed: bool
    ats_score: int | None
    updated_at: str

    class Config:
        from_attributes = True


class ResumeListResponse(BaseModel):
    resumes: list[ResumeListItem]
