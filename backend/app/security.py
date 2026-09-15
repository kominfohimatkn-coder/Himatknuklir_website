from __future__ import annotations

from datetime import datetime, timedelta, timezone
import hashlib
import secrets

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

from .core.config import settings

ALGORITHM = "HS256"
COOKIE_NAME = "himatkn_access"
PASSWORD_HASHER = PasswordHasher()


def hash_password(password: str) -> str:
    return PASSWORD_HASHER.hash(password)


def verify_password(password: str, stored: str) -> tuple[bool, bool]:
    """Return (valid, needs_upgrade). New hashes use Argon2id; bcrypt/plaintext are legacy."""
    if stored.startswith("$argon2id$"):
        try:
            valid = PASSWORD_HASHER.verify(stored, password)
            return bool(valid), PASSWORD_HASHER.check_needs_rehash(stored)
        except (VerifyMismatchError, VerificationError, InvalidHashError):
            return False, False

    if stored.startswith(("$2a$", "$2b$", "$2y$")):
        try:
            import bcrypt
            valid = bcrypt.checkpw(password.encode("utf-8"), stored.encode("utf-8"))
            return bool(valid), bool(valid)
        except (ValueError, TypeError):
            return False, False

    # Legacy plaintext compatibility is intentionally one-time only; successful login upgrades immediately.
    return secrets.compare_digest(stored, password), True


def create_access_token(admin_id: int, username: str, role: str) -> tuple[str, str, datetime]:
    now = datetime.now(timezone.utc)
    expires = now + timedelta(minutes=settings.jwt_expire_minutes)
    jti = secrets.token_urlsafe(32)
    payload = {
        "sub": str(admin_id),
        "username": username,
        "role": role,
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
        "jti": jti,
        "iat": now,
        "nbf": now,
        "exp": expires,
    }
    token = jwt.encode(payload, settings.jwt_secret_key, algorithm=ALGORITHM)
    return token, jti, expires


def decode_access_token(token: str) -> dict:
    return jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[ALGORITHM],
        issuer=settings.jwt_issuer,
        audience=settings.jwt_audience,
        options={"require": ["sub", "iss", "aud", "jti", "iat", "exp"]},
    )


def fingerprint_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
