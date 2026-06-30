import uuid
from pydantic import BaseModel


class TemplateResponse(BaseModel):
    id: uuid.UUID
    name: str
    thumbnail_url: str | None
    is_active: bool

    class Config:
        from_attributes = True


class TemplateListResponse(BaseModel):
    templates: list[TemplateResponse]
