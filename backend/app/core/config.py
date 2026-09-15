from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import quote_plus, urlparse

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[2]
PROJECT_DIR = BACKEND_DIR.parent

load_dotenv(PROJECT_DIR / ".env", override=False)
load_dotenv(BACKEND_DIR / ".env", override=False)


def _bool(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _int(name: str, default: int, *, minimum: int, maximum: int) -> int:
    raw = os.getenv(name, str(default)).strip()
    try:
        value = int(raw)
    except ValueError as exc:
        raise RuntimeError(f"{name} harus berupa bilangan bulat") from exc
    if not minimum <= value <= maximum:
        raise RuntimeError(f"{name} berada di luar rentang yang didukung")
    return value


def _normalize_mysql_url(value: str) -> str:
    value = value.strip()
    if value.startswith("mysql://"):
        value = value.replace("mysql://", "mysql+pymysql://", 1)
    if not value.startswith("mysql+pymysql://"):
        raise RuntimeError("DATABASE_URL/MYSQL_URL harus menggunakan driver MySQL yang didukung")
    return value


def _resolve_database_url() -> str:
    direct = os.getenv("DATABASE_URL") or os.getenv("MYSQL_URL")
    if direct:
        return _normalize_mysql_url(direct)

    host = os.getenv("DB_HOST")
    name = os.getenv("DB_NAME")
    user = os.getenv("DB_USER")
    if host and name and user:
        password = quote_plus(os.getenv("DB_PASSWORD", ""))
        port = os.getenv("DB_PORT", "3306")
        charset = os.getenv("DB_CHARSET", "utf8mb4")
        return (
            f"mysql+pymysql://{quote_plus(user)}:{password}"
            f"@{host}:{port}/{quote_plus(name)}?charset={charset}"
        )

    raise RuntimeError(
        "Konfigurasi database MySQL belum lengkap. Isi DATABASE_URL/MYSQL_URL "
        "atau DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD."
    )


def _validate_settings(*, app_env: str, secret: str, admin_password: str, cors: tuple[str, ...], cookie_secure: bool, db_url: str) -> None:
    production = app_env.lower() in {"production", "prod"}
    if production:
        if secret == "" or len(secret) < 32:
            raise RuntimeError("JWT_SECRET_KEY wajib diisi dan panjangnya minimal 32 karakter pada production")
        if admin_password == "" or admin_password in {"change-me-now", "change-me", "password"}:
            raise RuntimeError("ADMIN_DEFAULT_PASSWORD wajib diubah sebelum production")
        if not cookie_secure:
            raise RuntimeError("COOKIE_SECURE=true wajib pada production")
        if any("*" in origin for origin in cors):
            raise RuntimeError("CORS_ORIGINS tidak boleh menggunakan wildcard pada production")
        parsed = urlparse(db_url)
        if parsed.scheme not in {"mysql+pymysql", "mysql"}:
            raise RuntimeError("Database production harus menggunakan MySQL")


@dataclass(frozen=True)
class Settings:
    app_name: str = os.getenv("APP_NAME", "HIMATKN Website")
    app_env: str = os.getenv("APP_ENV", "development").strip().lower()
    debug: bool = _bool("DEBUG", False)
    database_url: str = _resolve_database_url()
    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "")
    jwt_issuer: str = os.getenv("JWT_ISSUER", "himatkn-api")
    jwt_audience: str = os.getenv("JWT_AUDIENCE", "himatkn-admin")
    jwt_expire_minutes: int = _int("JWT_EXPIRE_MINUTES", 30, minimum=5, maximum=120)
    cookie_secure: bool = _bool("COOKIE_SECURE", False)
    cookie_samesite: str = os.getenv("COOKIE_SAMESITE", "lax").strip().lower()
    cors_origins: tuple[str, ...] = tuple(
        origin.strip().rstrip("/")
        for origin in os.getenv(
            "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
        ).split(",")
        if origin.strip()
    )
    upload_dir: Path = Path(os.getenv("UPLOAD_DIR", str(BACKEND_DIR / "uploads")))
    max_upload_bytes: int = _int("MAX_UPLOAD_BYTES", 5_242_880, minimum=1_024, maximum=20 * 1024 * 1024)
    max_request_body_bytes: int = _int("MAX_REQUEST_BODY_BYTES", 10 * 1024 * 1024, minimum=64 * 1024, maximum=50 * 1024 * 1024)
    admin_default_username: str = os.getenv("ADMIN_DEFAULT_USERNAME", "admin").strip()
    admin_default_password: str = os.getenv("ADMIN_DEFAULT_PASSWORD", "")
    admin_default_role: str = os.getenv("ADMIN_DEFAULT_ROLE", "superadmin").strip().lower()
    auto_create_tables: bool = _bool("AUTO_CREATE_TABLES", True)
    redis_url: str = os.getenv("REDIS_URL", "").strip()
    rate_limit_backend: str = os.getenv("RATE_LIMIT_BACKEND", "memory").strip().lower()
    rate_limit_fail_closed: bool = _bool("RATE_LIMIT_FAIL_CLOSED", True)
    trusted_proxy_ips: tuple[str, ...] = tuple(x.strip() for x in os.getenv("TRUSTED_PROXY_IPS", "").split(",") if x.strip())
    frontend_dist: Path = BACKEND_DIR / "frontend_dist"


settings = Settings()

if settings.cookie_samesite not in {"lax", "strict", "none"}:
    raise RuntimeError("COOKIE_SAMESITE harus lax, strict, atau none")
if settings.cookie_samesite == "none" and not settings.cookie_secure:
    raise RuntimeError("SameSite=None membutuhkan COOKIE_SECURE=true")
if settings.rate_limit_backend not in {"memory", "redis"}:
    raise RuntimeError("RATE_LIMIT_BACKEND harus memory atau redis")
if settings.app_env in {"production", "prod"} and settings.rate_limit_backend != "redis":
    raise RuntimeError("Production wajib menggunakan RATE_LIMIT_BACKEND=redis untuk multi-instance consistency")
if settings.app_env in {"production", "prod"} and not settings.redis_url:
    raise RuntimeError("REDIS_URL wajib diisi pada production")
_validate_settings(
    app_env=settings.app_env,
    secret=settings.jwt_secret_key,
    admin_password=settings.admin_default_password,
    cors=settings.cors_origins,
    cookie_secure=settings.cookie_secure,
    db_url=settings.database_url,
)
if settings.app_env not in {"production", "prod"}:
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
