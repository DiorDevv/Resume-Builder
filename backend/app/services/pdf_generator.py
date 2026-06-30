import asyncio
from pathlib import Path

from jinja2 import Environment, FileSystemLoader
from playwright.async_api import Browser, async_playwright

from app.core.config import settings
from app.core.logging import logger

TEMPLATES_DIR = Path(__file__).parent.parent / "templates"
OUTPUT_DIR = Path(settings.PDF_STORAGE_PATH)
env = Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)))

_browser: Browser | None = None
_playwright = None
_lock = asyncio.Lock()


async def get_browser() -> Browser:
    global _browser, _playwright
    if _browser is None:
        async with _lock:
            if _browser is None:
                _playwright = await async_playwright().start()
                _browser = await _playwright.chromium.launch(
                    args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
                )
                logger.info("Playwright browser launched")
    return _browser


async def close_browser():
    global _browser, _playwright
    if _browser:
        await _browser.close()
        _browser = None
    if _playwright:
        await _playwright.stop()
        _playwright = None
    logger.info("Playwright browser closed")


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
        sections["work_experience"]["items"] = flatten_technologies(sections["work_experience"]["items"])

    html = template.render(**sections)

    browser = await get_browser()
    page = await browser.new_page(
        viewport={"width": 794, "height": 1123},
        device_scale_factor=2,
    )

    try:
        await page.set_content(html, wait_until="networkidle")
        pdf_bytes = await page.pdf(
            format="A4",
            margin={"top": "0mm", "bottom": "0mm", "left": "0mm", "right": "0mm"},
            print_background=True,
        )
    finally:
        await page.close()

    if filename:
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        (OUTPUT_DIR / filename).write_bytes(pdf_bytes)

    return pdf_bytes
