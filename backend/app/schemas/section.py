import uuid
from pydantic import BaseModel, model_validator
from typing import Any


class PersonalInfoData(BaseModel):
    full_name: str = ""
    email: str = ""
    phone: str = ""
    city: str = ""
    linkedin: str = ""
    github: str = ""
    portfolio: str = ""
    summary: str = ""


class WorkExperienceItem(BaseModel):
    company: str = ""
    position: str = ""
    start_date: str = ""
    end_date: str = ""
    is_current: bool = False
    description: str = ""
    bullet_points: list[str] = []


class WorkExperienceData(BaseModel):
    items: list[WorkExperienceItem] = []


class EducationItem(BaseModel):
    university: str = ""
    degree: str = ""
    field: str = ""
    start_year: str = ""
    end_year: str = ""
    gpa: str = ""


class EducationData(BaseModel):
    items: list[EducationItem] = []


class SkillItem(BaseModel):
    name: str = ""
    level: str = "intermediate"


class SkillsData(BaseModel):
    technical: list[str] = []
    languages: list[SkillItem] = []
    soft: list[str] = []


class ProjectItem(BaseModel):
    name: str = ""
    description: str = ""
    technologies: list[str] = []
    github_url: str = ""
    live_url: str = ""


class ProjectsData(BaseModel):
    items: list[ProjectItem] = []


class CertificationItem(BaseModel):
    name: str = ""
    issuer: str = ""
    date: str = ""


class CertificationsData(BaseModel):
    items: list[CertificationItem] = []


class LanguageItem(BaseModel):
    language: str = ""
    level: str = "A1"


class LanguagesData(BaseModel):
    items: list[LanguageItem] = []


class CustomData(BaseModel):
    content: str = ""


SECTION_DATA_SCHEMAS: dict[str, type[BaseModel]] = {
    "personal_info": PersonalInfoData,
    "work_experience": WorkExperienceData,
    "education": EducationData,
    "skills": SkillsData,
    "projects": ProjectsData,
    "certifications": CertificationsData,
    "languages": LanguagesData,
}


def validate_section_data(section_type: str, data: Any) -> dict:
    schema = SECTION_DATA_SCHEMAS.get(section_type)
    if schema is None:
        return data if isinstance(data, dict) else {}
    return schema.model_validate(data).model_dump()


class SectionCreate(BaseModel):
    section_type: str
    title: str | None = None
    sort_order: int = 0
    data: dict = {}

    @model_validator(mode="after")
    def _validate_data(self):
        self.data = validate_section_data(self.section_type, self.data)
        return self


class SectionUpdate(BaseModel):
    title: str | None = None
    sort_order: int | None = None
    data: dict | None = None


class SectionResponse(BaseModel):
    id: uuid.UUID
    resume_id: uuid.UUID
    section_type: str
    sort_order: int
    title: str | None
    data: dict

    class Config:
        from_attributes = True


class SectionReorder(BaseModel):
    section_ids: list[str]
