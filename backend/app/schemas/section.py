from datetime import date
from pydantic import BaseModel


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


class SectionCreate(BaseModel):
    section_type: str
    title: str | None = None
    sort_order: int = 0
    data: dict = {}


class SectionUpdate(BaseModel):
    title: str | None = None
    sort_order: int | None = None
    data: dict | None = None


class SectionResponse(BaseModel):
    id: str
    resume_id: str
    section_type: str
    sort_order: int
    title: str | None
    data: dict

    class Config:
        from_attributes = True


class SectionReorder(BaseModel):
    section_ids: list[str]
