from __future__ import annotations

from contextlib import asynccontextmanager
from html import escape
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select
from starlette.exceptions import HTTPException as StarletteHTTPException

from .auth_sessions import purge_expired_sessions
from .core.config import settings
from .database import Base, SessionLocal, engine
from .models import Admin
from .permissions import ASSIGNABLE_ROLES
from .rate_limit import enforce_request_limit
from .routers import admin, auth, public
from .services.logging import configure_logging
from .security import hash_password


class SPAStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope):
        index_path = Path(self.directory) / "index.html"
        try:
            response = await super().get_response(path, scope)
        except StarletteHTTPException as exc:
            if exc.status_code == 404 and index_path.exists():
                return FileResponse(index_path)
            raise
        if response.status_code == 404 and index_path.exists():
            return FileResponse(index_path)
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.app_env == "test":
        yield
        return

    if settings.auto_create_tables and settings.app_env not in {"production", "prod"}:
        Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        if db.scalar(select(Admin).limit(1)) is None:
            if not settings.admin_default_password:
                raise RuntimeError("ADMIN_DEFAULT_PASSWORD wajib diisi untuk membuat administrator awal")
            if settings.admin_default_role not in ASSIGNABLE_ROLES:
                raise RuntimeError("ADMIN_DEFAULT_ROLE tidak valid")
            db.add(
                Admin(
                    username=settings.admin_default_username,
                    password=hash_password(settings.admin_default_password),
                    role=settings.admin_default_role,
                )
            )
            db.commit()
        purge_expired_sessions(db)
        db.commit()

    yield


production = settings.app_env in {"production", "prod"}
configure_logging()
app = FastAPI(
    title=settings.app_name,
    debug=settings.debug and not production,
    lifespan=lifespan,
    docs_url=None if production else "/docs",
    redoc_url=None if production else "/redoc",
    openapi_url=None if production else "/openapi.json",
)


def is_direct_browser_navigation(request: Request) -> bool:
    sec_fetch_mode = request.headers.get("sec-fetch-mode", "").lower()
    accept = request.headers.get("accept", "").lower()
    return sec_fetch_mode == "navigate" or "text/html" in accept


def not_found_page() -> str:
    return """<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>404 — Not Found</title><style>body{min-height:100vh;margin:0;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#f3fbf6;color:#073c2d}.wrap{text-align:center}.number{font-size:clamp(7rem,22vw,13rem);font-weight:900;line-height:1;margin:0}.button{display:inline-flex;margin-top:24px;padding:12px 24px;border-radius:6px;background:#126b3a;color:#fff;text-decoration:none;font-weight:700}</style></head><body><main class="wrap"><p class="number">404</p><h1>Not Found</h1><a class="button" href="/">Go Home</a></main></body></html>"""


def _is_allowed_origin(origin: str) -> bool:
    return origin.rstrip("/") in settings.cors_origins


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    request_id = request.headers.get("x-request-id")
    if not request_id or len(request_id) > 100 or any(ch.isspace() for ch in request_id):
        request_id = uuid4().hex
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


@app.middleware("http")
async def security_middleware(request: Request, call_next):
    if len(request.headers.get("content-length", "0")) > settings.max_request_body_bytes:
        return JSONResponse(
            status_code=413,
            content={"detail": "Ukuran request terlalu besar"},
        )

    origin = request.headers.get("origin")

    if (
        request.method.upper() in {"POST", "PUT", "PATCH", "DELETE"}
        and origin
        and not _is_allowed_origin(origin)
    ):
        return JSONResponse(
            status_code=403,
            content={"detail": "Origin tidak diizinkan"},
        )

    try:
        await enforce_request_limit(request)
    except StarletteHTTPException as exc:
        retry = exc.headers or {}

        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": str(exc.detail)},
            headers=retry,
        )

    response = await call_next(request)

    response.headers.setdefault(
        "X-Content-Type-Options",
        "nosniff",
    )

    response.headers.setdefault(
        "Referrer-Policy",
        "strict-origin-when-cross-origin",
    )

    response.headers.setdefault(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=(), payment=()",
    )

    response.headers.setdefault(
        "X-Frame-Options",
        "DENY",
    )

    is_docs_page = request.url.path in {
        "/docs",
        "/redoc",
        "/openapi.json",
    }

    if not is_docs_page:
        response.headers.setdefault(
            "Content-Security-Policy",
            "default-src 'self'; "
            "object-src 'none'; "
            "base-uri 'self'; "
            "frame-ancestors 'none'",
        )

    if request.url.path.startswith("/api/"):
        response.headers.setdefault(
            "Cache-Control",
            "no-store",
        )

    if production:
        response.headers.setdefault(
            "Strict-Transport-Security",
            "max-age=31536000; includeSubDomains",
        )

    return response

@app.middleware("http")
async def hide_direct_api_navigation(request: Request, call_next):
    path = request.url.path
    if path == "/api/health":
        return await call_next(request)
    if request.method.upper() == "GET" and path.startswith("/api/") and is_direct_browser_navigation(request):
        return HTMLResponse(
            content=not_found_page(),
            status_code=404,
            headers={"Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow"},
        )
    return await call_next(request)


app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Accept", "Content-Type", "X-CSRF-Token", "X-Requested-With"],
)

if not production:
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

app.include_router(auth.router)
app.include_router(public.router)
app.include_router(admin.router)


@app.get("/api/health", include_in_schema=False)
def health():
    return {"status": "ok", "app": settings.app_name}


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    if exc.status_code == 404:
        if is_direct_browser_navigation(request):
            return HTMLResponse(content=not_found_page(), status_code=404, headers={"Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow"})
        return JSONResponse(status_code=404, content={"detail": "Endpoint tidak ditemukan"})
    detail = exc.detail if isinstance(exc.detail, str) else "Permintaan tidak valid"
    return JSONResponse(status_code=exc.status_code, content={"detail": detail})


@app.exception_handler(Exception)
async def unexpected_error(request: Request, exc: Exception):
    # Detail exception hanya boleh ditangani oleh observability platform, bukan client.
    return JSONResponse(status_code=500, content={"detail": "Terjadi kesalahan pada server"})


@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/api/health", status_code=307)
