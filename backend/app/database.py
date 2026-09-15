from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import NullPool
import certifi
from .core.config import settings

engine_kwargs = {"pool_pre_ping": True}

if settings.app_env in {"production", "prod"}:
    engine_kwargs["poolclass"] = NullPool
    engine_kwargs["connect_args"] = {"ssl": {"ca": certifi.where()}}
else:
    engine_kwargs["pool_recycle"] = 280

engine = create_engine(settings.database_url, **engine_kwargs)
class Base(DeclarativeBase):
    pass

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
