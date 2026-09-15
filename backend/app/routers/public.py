from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Berita, ProgramKerja, Struktur, VisitorLog
from ..schemas import VisitPayload
from ..serializers import member_dict, news_dict, program_dict
from ..services.config_service import get_config
from ..services.slug import slugify

router = APIRouter(prefix="/api/public", tags=["public"])


@router.get("/config")
def public_config(db: Session = Depends(get_db)):
    return {"config": get_config(db)}


@router.get("/home")
def home(db: Session = Depends(get_db)):
    news = db.scalars(select(Berita).order_by(Berita.created_at.desc()).limit(3)).all()
    programs = db.scalars(select(ProgramKerja).order_by(ProgramKerja.id.desc())).all()
    return {
        "config": get_config(db),
        "berita_list": [news_dict(item, include_content=False) for item in news],
        "proker_list": [program_dict(item) for item in programs],
    }


@router.get("/news")
def news_list(
    q: str = Query(default="", max_length=100),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=9, ge=1, le=50),
    db: Session = Depends(get_db),
):
    conditions = []
    if q.strip():
        needle = f"%{q.strip()}%"
        conditions.append(or_(Berita.judul.ilike(needle), Berita.konten.ilike(needle)))
    count_stmt = select(func.count()).select_from(Berita)
    stmt = select(Berita)
    for condition in conditions:
        count_stmt = count_stmt.where(condition)
        stmt = stmt.where(condition)
    total = db.scalar(count_stmt) or 0
    items = db.scalars(
        stmt.order_by(Berita.created_at.desc()).offset((page - 1) * limit).limit(limit)
    ).all()
    return {
        "items": [news_dict(item, include_content=False) for item in items],
        "page": page,
        "limit": limit,
        "total": total,
        "pages": max(1, (total + limit - 1) // limit),
    }


@router.get("/news/{identifier}")
def news_detail(identifier: str, db: Session = Depends(get_db)):
    # Numeric identifiers remain supported so old shared links do not break.
    item = db.get(Berita, int(identifier)) if identifier.isdigit() else None
    if item is None:
        candidates = db.scalars(select(Berita).order_by(Berita.created_at.desc())).all()
        item = next((row for row in candidates if slugify(row.judul) == identifier), None)
    if not item:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Publikasi tidak ditemukan")
    related = db.scalars(
        select(Berita).where(Berita.id != item.id).order_by(Berita.created_at.desc()).limit(3)
    ).all()
    return {
        "berita": news_dict(item),
        "berita_lainnya": [news_dict(row, include_content=False) for row in related],
    }


@router.get("/structure")
def structure(db: Session = Depends(get_db)):
    members = db.scalars(select(Struktur).order_by(Struktur.id.asc())).all()
    grouped: dict[str, list[dict]] = {}
    for member in members:
        grouped.setdefault(member.divisi, []).append(member_dict(member))
    return {"struktur_grouped": grouped, "items": [member_dict(member) for member in members]}


@router.post("/visit", status_code=204)
def visit(payload: VisitPayload, request: Request, db: Session = Depends(get_db)):
    forwarded = request.headers.get("x-forwarded-for", "")
    ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")
    db.add(VisitorLog(ip_address=ip[:64], halaman=payload.halaman))
    db.commit()
