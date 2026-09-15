from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from .models import AuthSession
from .security import fingerprint_token


def create_session(db: Session, admin_id: int, jti: str, token: str, expires_at: datetime) -> AuthSession:
    session = AuthSession(
        admin_id=admin_id,
        jti=jti,
        token_hash=fingerprint_token(token),
        expires_at=expires_at.replace(tzinfo=None),
    )
    db.add(session)
    return session


def get_valid_session(db: Session, token: str, jti: str, admin_id: int) -> AuthSession | None:
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    stmt = select(AuthSession).where(
        AuthSession.admin_id == admin_id,
        AuthSession.jti == jti,
        AuthSession.token_hash == fingerprint_token(token),
        AuthSession.revoked_at.is_(None),
        AuthSession.expires_at > now,
    )
    return db.scalar(stmt)


def revoke_token(db: Session, token: str, jti: str) -> None:
    session = db.scalar(select(AuthSession).where(AuthSession.jti == jti, AuthSession.token_hash == fingerprint_token(token)))
    if session and session.revoked_at is None:
        session.revoked_at = datetime.now(timezone.utc).replace(tzinfo=None)


def revoke_admin_sessions(db: Session, admin_id: int) -> None:
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    db.execute(
        update(AuthSession)
        .where(AuthSession.admin_id == admin_id, AuthSession.revoked_at.is_(None))
        .values(revoked_at=now)
    )


def purge_expired_sessions(db: Session) -> None:
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    db.execute(delete(AuthSession).where(AuthSession.expires_at <= now))
