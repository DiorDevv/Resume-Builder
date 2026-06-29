import os
from pathlib import Path

from jinja2 import Environment, FileSystemLoader
from playwright.async_api import async_playwright

from app.core.config import settings

TEMPLATES_DIR = Path(__file__).parent.parent / "templates"
OUTPUT_DIR = Path(settings.PDF_STORAGE_PATH)

env = Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)))


async def generate_pdf(
    template_name: str,
    data: dict,
    filename: str | None = None,
) -> bytes:
    template = env.get_template(f"{template_name}.html")

    def flatten_technologies(items):
        if not items:
            return items
        result = []
        for item in items:
            item = dict(item)
            tech = item.get("technologies", "")
            if isinstance(tech, str) and tech:
                item["technologies"] = [t.strip() for t in tech.split(",")]
            elif not tech:
                item["technologies"] = []
            result.append(item)
        return result

    sections = {
        "personal_info": data.get("personal_info", {}),
        "work_experience": data.get("work_experience", {}),
        "education": data.get("education", {}),
        "skills": data.get("skills", {}),
        "projects": {"items": flatten_technologies((data.get("projects", {}) or {}).get("items", []))},
        "certifications": data.get("certifications", {}),
        "languages_section": data.get("languages", {}),
    }

    if sections["work_experience"] and sections["work_experience"].get("items"):
        sections["work_experience"]["items"] = flatten_technologies(
            sections["work_experience"]["items"]
        )

    html = template.render(**sections)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            args=["--no-sandbox", "--disable-setuid-sandbox"]
        )
        page = await browser.new_page(
            viewport={"width": 794, "height": 1123},
            device_scale_factor=2,
        )
        await page.set_content(html, wait_until="networkidle")

        pdf_bytes = await page.pdf(
            format="A4",
            margin={"top": "0mm", "bottom": "0mm", "left": "0mm", "right": "0mm"},
            print_background=True,
        )

        await browser.close()

    if filename:
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        filepath = OUTPUT_DIR / filename
        filepath.write_bytes(pdf_bytes)

    return pdf_bytes
