from pydantic import BaseModel


class TemplateResponse(BaseModel):
    id: str
    name: str
    thumbnail_url: str | None
    is_active: bool

    class Config:
        from_attributes = True


class TemplateListResponse(BaseModel):
    templates: list[TemplateResponse]
