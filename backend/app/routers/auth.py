from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth_sessions import create_session, revoke_admin_sessions, revoke_token
from ..core.config import settings
from ..database import get_db
from ..dependencies import get_current_admin
from ..models import Admin
from ..permissions import admin_session_dict
from ..rate_limit import limiter
from ..schemas import LoginRequest
from ..security import COOKIE_NAME, create_access_token, hash_password, verify_password, decode_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
async def login(request: Request, payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    username = payload.username.strip()
    account_key = f"{limiter.client_ip(request)}:{username.casefold()[:100]}"
    # Per-IP throttling is applied globally; this second bucket makes credential stuffing harder.
    allowed, retry_after = await limiter.allow(f"login-account:{account_key}", 5, 60)
    if not allowed:
        raise HTTPException(status_code=429, detail="Terlalu banyak percobaan login. Silakan coba lagi nanti.", headers={"Retry-After": str(retry_after)})

    admin = db.scalar(select(Admin).where(Admin.username == username))
    if admin is None:
        # Perform an Argon2 computation to reduce username enumeration via timing.
        hash_password(payload.password)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Username atau password salah")

    valid, needs_upgrade = verify_password(payload.password, admin.password)
    if not valid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Username atau password salah")

    if needs_upgrade:
        admin.password = hash_password(payload.password)

    token, jti, expires_at = create_access_token(admin.id, admin.username, admin.role)
    create_session(db, admin.id, jti, token, expires_at)
    db.commit()

    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=settings.jwt_expire_minutes * 60,
        path="/",
    )
    return {"user": admin_session_dict(admin)}


@router.get("/me")
def me(admin: Admin = Depends(get_current_admin)):
    return {"user": admin_session_dict(admin)}


@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    token = request.cookies.get(COOKIE_NAME)
    if token:
        try:
            payload = decode_access_token(token)
            revoke_token(db, token, str(payload["jti"]))
            db.commit()
        except Exception:
            db.rollback()
    response.delete_cookie(COOKIE_NAME, path="/")
    return {"message": "Logout berhasil"}


@router.post("/revoke-all")
def revoke_all(admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    revoke_admin_sessions(db, admin.id)
    db.commit()
    return {"message": "Seluruh sesi telah dicabut"}
