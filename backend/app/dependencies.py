from __future__ import annotations

from collections.abc import Callable

from fastapi import Cookie, Depends, HTTPException, status
from jwt import InvalidTokenError
from sqlalchemy.orm import Session

from .auth_sessions import get_valid_session
from .database import get_db
from .models import Admin
from .permissions import has_permission
from .security import COOKIE_NAME, decode_access_token


def get_current_admin(
    token: str | None = Cookie(default=None, alias=COOKIE_NAME),
    db: Session = Depends(get_db),
) -> Admin:
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Belum login")
    try:
        payload = decode_access_token(token)
        admin_id = int(payload["sub"])
        jti = str(payload["jti"])
    except (InvalidTokenError, KeyError, TypeError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesi tidak valid")

    if get_valid_session(db, token, jti, admin_id) is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesi tidak valid")

    admin = db.get(Admin, admin_id)
    if not admin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesi tidak valid")
    return admin


def require_permission(permission: str) -> Callable:
    def dependency(admin: Admin = Depends(get_current_admin)) -> Admin:
        if not has_permission(admin, permission):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Anda tidak memiliki akses ke modul ini")
        return admin

    return dependency
