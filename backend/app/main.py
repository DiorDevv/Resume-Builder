from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.core.config import settings
from app.core.database import async_session_factory
from app.core.logging import setup_logging, logger
from app.middleware.csrf import CSRFMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.api.v1 import auth, resumes, templates, export, ats


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}")

    from app.core.database import engine, Base

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as db:
        from app.services.seed import seed_templates
        await seed_templates(db)

    from app.services.pdf_generator import get_browser
    try:
        await get_browser()
    except Exception as e:
        logger.warning(f"Browser pre-launch failed: {e}")

    yield

    from app.services.pdf_generator import close_browser
    await close_browser()
    await engine.dispose()
    logger.info("Application shutdown complete")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(CSRFMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Serverda kutilmagan xatolik yuz berdi"},
    )


app.include_router(auth.router, prefix="/api/v1")
app.include_router(resumes.router, prefix="/api/v1")
app.include_router(templates.router, prefix="/api/v1")
app.include_router(export.router, prefix="/api/v1")
app.include_router(ats.router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    from app.core.database import engine

    db_ok = False
    redis_ok = False
    pdf_ok = False

    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            db_ok = True
    except Exception as e:
        logger.warning(f"Health check — DB connection failed: {e}")

    try:
        import redis.asyncio as aioredis
        r = aioredis.from_url(settings.REDIS_URL)
        await r.ping()
        redis_ok = True
        await r.close()
    except Exception as e:
        logger.warning(f"Health check — Redis connection failed: {e}")

    from app.services.pdf_generator import _browser
    pdf_ok = _browser is not None

    return {
        "status": "healthy" if (db_ok and redis_ok) else "degraded",
        "version": settings.VERSION,
        "database": "connected" if db_ok else "disconnected",
        "redis": "connected" if redis_ok else "disconnected",
        "pdf_service": "ready" if pdf_ok else "lazy",
    }
