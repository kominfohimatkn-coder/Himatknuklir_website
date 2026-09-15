from __future__ import annotations

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile
from sqlalchemy import desc, func, or_, select
from sqlalchemy.orm import Session

from ..auth_sessions import revoke_admin_sessions
from ..database import get_db
from ..dependencies import get_current_admin, require_permission
from ..models import ActivityLog, Admin, Berita, Notifikasi, ProgramKerja, Struktur, VisitorLog
from ..schemas import AdminCreatePayload, AdminUpdatePayload, ProgramPayload
from ..serializers import member_dict, news_dict, program_dict
from ..services.audit import log_activity, notify
from ..services.config_service import DEFAULT_CONFIG, get_config, set_config
from ..services.files import delete_local_image, normalize_media_url, save_image
from ..permissions import (
    ASSIGNABLE_ROLES,
    FULL_ACCESS_ROLES,
    PERMISSION_ADMINS,
    PERMISSION_DASHBOARD,
    PERMISSION_MEMBERS,
    PERMISSION_NEWS,
    PERMISSION_PROGRAMS,
    PERMISSION_SETTINGS,
    admin_management_dict,
    permissions_for_role,
    role_options,
)
from ..security import hash_password

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(get_current_admin)])


def require_item(item, label: str):
    if not item:
        raise HTTPException(status_code=404, detail=f"{label} tidak ditemukan")
    return item


@router.get("/dashboard")
def dashboard(
    db: Session = Depends(get_db),
    _: Admin = Depends(require_permission(PERMISSION_DASHBOARD)),
):
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = today_start.replace(day=1)
    week_start = today_start - timedelta(days=6)
    previous_week_start = week_start - timedelta(days=7)

    total_berita = db.scalar(select(func.count()).select_from(Berita)) or 0
    total_proker = db.scalar(select(func.count()).select_from(ProgramKerja)) or 0
    total_pengurus = db.scalar(select(func.count()).select_from(Struktur)) or 0
    total_visitor = db.scalar(select(func.count()).select_from(VisitorLog)) or 0
    visitors_today = db.scalar(
        select(func.count()).select_from(VisitorLog).where(VisitorLog.visited_at >= today_start)
    ) or 0
    unique_today = db.scalar(
        select(func.count(func.distinct(VisitorLog.ip_address))).where(VisitorLog.visited_at >= today_start)
    ) or 0
    visitors_7d = db.scalar(
        select(func.count()).select_from(VisitorLog).where(VisitorLog.visited_at >= week_start)
    ) or 0
    visitors_previous_7d = db.scalar(
        select(func.count()).select_from(VisitorLog).where(
            VisitorLog.visited_at >= previous_week_start,
            VisitorLog.visited_at < week_start,
        )
    ) or 0
    visitor_growth = (
        round(((visitors_7d - visitors_previous_7d) / visitors_previous_7d) * 100)
        if visitors_previous_7d
        else (100 if visitors_7d else 0)
    )
    published_this_month = db.scalar(
        select(func.count()).select_from(Berita).where(Berita.created_at >= month_start)
    ) or 0

    status_rows = db.execute(
        select(ProgramKerja.status, func.count(ProgramKerja.id))
        .group_by(ProgramKerja.status)
    ).all()
    program_status = {
        "planned": 0, "ongoing": 0, "done": 0, "postponed": 0, "cancelled": 0
    }
    for status, total in status_rows:
        program_status[status] = total

    daily_rows = db.execute(
        select(func.date(VisitorLog.visited_at), func.count(VisitorLog.id))
        .where(VisitorLog.visited_at >= week_start)
        .group_by(func.date(VisitorLog.visited_at))
        .order_by(func.date(VisitorLog.visited_at))
    ).all()
    daily_lookup = {str(day): total for day, total in daily_rows}
    visit_trend = []
    for offset in range(7):
        day = (week_start + timedelta(days=offset)).date()
        visit_trend.append({"date": day.isoformat(), "total": daily_lookup.get(str(day), 0)})

    top_pages = db.execute(
        select(VisitorLog.halaman, func.count(VisitorLog.id).label("total"))
        .group_by(VisitorLog.halaman)
        .order_by(desc("total"))
        .limit(5)
    ).all()

    logs = db.execute(
        select(ActivityLog, Admin.username)
        .outerjoin(Admin, ActivityLog.admin_id == Admin.id)
        .order_by(ActivityLog.created_at.desc())
        .limit(7)
    ).all()
    visitors = db.scalars(select(VisitorLog).order_by(VisitorLog.visited_at.desc()).limit(6)).all()
    latest_news = db.scalars(select(Berita).order_by(Berita.created_at.desc()).limit(4)).all()

    return {
        "total_berita": total_berita,
        "total_proker": total_proker,
        "total_pengurus": total_pengurus,
        "proker_ongoing": program_status["ongoing"],
        "total_visitor": total_visitor,
        "visitors_today": visitors_today,
        "unique_today": unique_today,
        "visitors_7d": visitors_7d,
        "visitor_growth": visitor_growth,
        "published_this_month": published_this_month,
        "content_total": total_berita + total_proker + total_pengurus,
        "program_status": program_status,
        "visit_trend": visit_trend,
        "top_pages": [{"halaman": page, "total": total} for page, total in top_pages],
        "latest_news": [news_dict(item, include_content=False) for item in latest_news],
        "recent_logs": [
            {"id": log.id, "judul": log.aktivitas, "created_at": log.created_at.isoformat() if log.created_at else None, "admin": username or "Sistem"}
            for log, username in logs
        ],
        "visitor_logs": [
            {"id": row.id, "ip_address": row.ip_address, "halaman": row.halaman, "visited_at": row.visited_at.isoformat() if row.visited_at else None}
            for row in visitors
        ],
    }


@router.get("/news")
def admin_news(
    db: Session = Depends(get_db),
    _: Admin = Depends(require_permission(PERMISSION_NEWS)),
):
    items = db.scalars(select(Berita).order_by(Berita.created_at.desc())).all()
    return {"items": [news_dict(item) for item in items]}


@router.post("/news", status_code=201)
async def create_news(
    judul: str = Form(..., min_length=2, max_length=255),
    konten: str = Form(..., min_length=2),
    gambar: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    admin: Admin = Depends(require_permission(PERMISSION_NEWS)),
):
    image_url = await save_image(gambar)
    item = Berita(judul=judul.strip(), konten=konten.strip(), gambar_url=image_url)
    db.add(item)
    log_activity(db, admin.id, f'Menerbitkan publikasi: {item.judul}')
    notify(db, "Publikasi Baru", f'Berhasil menerbitkan "{item.judul}"', "success")
    db.commit(); db.refresh(item)
    return news_dict(item)


@router.put("/news/{news_id}")
async def update_news(
    news_id: int,
    judul: str = Form(..., min_length=2, max_length=255),
    konten: str = Form(..., min_length=2),
    gambar: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    admin: Admin = Depends(require_permission(PERMISSION_NEWS)),
):
    item = require_item(db.get(Berita, news_id), "Publikasi")
    new_image = await save_image(gambar)
    if new_image:
        old_image = item.gambar_url
        item.gambar_url = new_image
        delete_local_image(old_image)
    item.judul, item.konten = judul.strip(), konten.strip()
    log_activity(db, admin.id, f"Memperbarui publikasi ID {news_id}")
    db.commit(); db.refresh(item)
    return news_dict(item)


@router.delete("/news/{news_id}", status_code=204)
def delete_news(
    news_id: int,
    db: Session = Depends(get_db),
    admin: Admin = Depends(require_permission(PERMISSION_NEWS)),
):
    item = require_item(db.get(Berita, news_id), "Publikasi")
    image = item.gambar_url
    db.delete(item)
    log_activity(db, admin.id, f"Menghapus publikasi ID {news_id}")
    db.commit()
    delete_local_image(image)


@router.get("/programs")
def programs(
    db: Session = Depends(get_db),
    _: Admin = Depends(require_permission(PERMISSION_PROGRAMS)),
):
    items = db.scalars(select(ProgramKerja).order_by(ProgramKerja.id.desc())).all()
    return {"items": [program_dict(item) for item in items]}


@router.post("/programs", status_code=201)
def create_program(
    payload: ProgramPayload,
    db: Session = Depends(get_db),
    admin: Admin = Depends(require_permission(PERMISSION_PROGRAMS)),
):
    item = ProgramKerja(**payload.model_dump())
    db.add(item)
    log_activity(db, admin.id, f"Menambah program kerja: {item.nama_program}")
    notify(db, "Program Kerja", f'Berhasil menambah "{item.nama_program}"', "success")
    db.commit(); db.refresh(item)
    return program_dict(item)


@router.put("/programs/{program_id}")
def update_program(
    program_id: int,
    payload: ProgramPayload,
    db: Session = Depends(get_db),
    admin: Admin = Depends(require_permission(PERMISSION_PROGRAMS)),
):
    item = require_item(db.get(ProgramKerja, program_id), "Program kerja")
    for key, value in payload.model_dump().items(): setattr(item, key, value)
    log_activity(db, admin.id, f"Memperbarui program kerja ID {program_id}")
    db.commit(); db.refresh(item)
    return program_dict(item)


@router.delete("/programs/{program_id}", status_code=204)
def delete_program(
    program_id: int,
    db: Session = Depends(get_db),
    admin: Admin = Depends(require_permission(PERMISSION_PROGRAMS)),
):
    item = require_item(db.get(ProgramKerja, program_id), "Program kerja")
    db.delete(item)
    log_activity(db, admin.id, f"Menghapus program kerja ID {program_id}")
    db.commit()


@router.get("/members")
def members(
    db: Session = Depends(get_db),
    _: Admin = Depends(require_permission(PERMISSION_MEMBERS)),
):
    items = db.scalars(select(Struktur).order_by(Struktur.id.desc())).all()
    return {"items": [member_dict(item) for item in items]}


@router.get("/members/{member_id}")
def member_detail(
    member_id: int,
    db: Session = Depends(get_db),
    _: Admin = Depends(require_permission(PERMISSION_MEMBERS)),
):
    item = require_item(db.get(Struktur, member_id), "Pengurus")
    return member_dict(item)


@router.post("/members", status_code=201)
async def create_member(
    nama: str = Form(..., min_length=2, max_length=255),
    jabatan: str = Form(..., min_length=2, max_length=255),
    divisi: str = Form(..., min_length=2, max_length=255),
    periode: str = Form("2025/2026", max_length=50),
    foto: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    admin: Admin = Depends(require_permission(PERMISSION_MEMBERS)),
):
    photo_url = await save_image(foto)
    item = Struktur(nama=nama.strip(), jabatan=jabatan.strip(), divisi=divisi.strip(), periode=periode.strip(), foto_url=photo_url)
    db.add(item)
    log_activity(db, admin.id, f"Menambah pengurus: {item.nama}")
    notify(db, "Kepengurusan", f'Berhasil menambah "{item.nama}"', "success")
    db.commit(); db.refresh(item)
    return member_dict(item)


@router.put("/members/{member_id}")
async def update_member(
    member_id: int,
    nama: str = Form(..., min_length=2, max_length=255),
    jabatan: str = Form(..., min_length=2, max_length=255),
    divisi: str = Form(..., min_length=2, max_length=255),
    periode: str = Form("2025/2026", max_length=50),
    foto: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    admin: Admin = Depends(require_permission(PERMISSION_MEMBERS)),
):
    item = require_item(db.get(Struktur, member_id), "Pengurus")
    new_photo = await save_image(foto)
    if new_photo:
        old_photo = item.foto_url
        item.foto_url = new_photo
        delete_local_image(old_photo)
    item.nama, item.jabatan, item.divisi, item.periode = nama.strip(), jabatan.strip(), divisi.strip(), periode.strip()
    log_activity(db, admin.id, f"Memperbarui pengurus ID {member_id}")
    db.commit(); db.refresh(item)
    return member_dict(item)


@router.delete("/members/{member_id}", status_code=204)
def delete_member(
    member_id: int,
    db: Session = Depends(get_db),
    admin: Admin = Depends(require_permission(PERMISSION_MEMBERS)),
):
    item = require_item(db.get(Struktur, member_id), "Pengurus")
    photo = item.foto_url
    db.delete(item)
    log_activity(db, admin.id, f"Menghapus pengurus ID {member_id}")
    db.commit()
    delete_local_image(photo)


@router.get("/settings")
def settings_get(
    db: Session = Depends(get_db),
    _: Admin = Depends(require_permission(PERMISSION_SETTINGS)),
):
    return {"config": get_config(db)}


@router.put("/settings")
async def settings_update(
    request: Request,
    db: Session = Depends(get_db),
    admin: Admin = Depends(require_permission(PERMISSION_SETTINGS)),
):
    form = await request.form()
    old = get_config(db)

    values: dict[str, str] = {}
    for key in DEFAULT_CONFIG:
        if key == "hero_image":
            continue
        raw = form.get(key)
        if raw is not None and isinstance(raw, str):
            values[key] = raw.strip()

    image = form.get("hero_image")
    if image is not None and getattr(image, "filename", ""):
        new_image = await save_image(image)
        if new_image:
            values["hero_image"] = new_image
            delete_local_image(old.get("hero_image"))

    try:
        set_config(db, values)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Nilai pengaturan tidak valid") from exc
    log_activity(db, admin.id, "Memperbarui pengaturan website")
    notify(db, "Pengaturan", "Konfigurasi website berhasil diperbarui", "success")
    db.commit()
    return {"config": get_config(db)}


@router.get("/search")
def search(
    q: str = Query(min_length=2, max_length=100),
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    needle = f"%{q.strip()}%"
    result = []
    permissions = permissions_for_role(admin.role)

    if PERMISSION_NEWS in permissions:
        for row in db.scalars(select(Berita).where(Berita.judul.ilike(needle)).limit(4)).all():
            result.append({"id": row.id, "title": row.judul, "type": "Publikasi", "url": "/admin/news", "entity": "news"})

    if PERMISSION_PROGRAMS in permissions:
        for row in db.scalars(select(ProgramKerja).where(ProgramKerja.nama_program.ilike(needle)).limit(4)).all():
            result.append({"id": row.id, "title": row.nama_program, "type": "Program Kerja", "url": "/admin/programs", "entity": "program"})

    if PERMISSION_MEMBERS in permissions:
        for row in db.scalars(select(Struktur).where(or_(Struktur.nama.ilike(needle), Struktur.jabatan.ilike(needle))).limit(4)).all():
            result.append({"id": row.id, "title": row.nama, "type": f"Pengurus — {row.jabatan}", "url": f"/admin/struktur/{row.id}/edit", "entity": "member"})

    return {"items": result[:10]}


@router.get("/notifications")
def notifications(
    db: Session = Depends(get_db),
    _: Admin = Depends(require_permission(PERMISSION_DASHBOARD)),
):
    items = db.scalars(select(Notifikasi).where(Notifikasi.is_read.is_(False)).order_by(Notifikasi.created_at.desc()).limit(10)).all()
    return {"items": [
        {"id": n.id, "judul": n.judul, "pesan": n.pesan, "tipe": n.tipe, "created_at": n.created_at.isoformat() if n.created_at else None}
        for n in items
    ]}


@router.post("/notifications/{notification_id}/read")
def notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    _: Admin = Depends(require_permission(PERMISSION_DASHBOARD)),
):
    item = require_item(db.get(Notifikasi, notification_id), "Notifikasi")
    item.is_read = True
    db.commit()
    return {"status": "ok"}


def _is_full_access_role(role: str | None) -> bool:
    return (role or "").strip().lower() in FULL_ACCESS_ROLES


def _full_admin_count(db: Session) -> int:
    return db.scalar(
        select(func.count()).select_from(Admin).where(Admin.role.in_(tuple(FULL_ACCESS_ROLES)))
    ) or 0


def _validate_assignable_role(role: str) -> str:
    normalized = role.strip().lower()
    if normalized not in ASSIGNABLE_ROLES:
        raise HTTPException(status_code=400, detail="Role administrator tidak valid")
    return normalized


def _ensure_unique_username(db: Session, username: str, exclude_id: int | None = None) -> None:
    query = select(Admin).where(func.lower(Admin.username) == username.lower())
    if exclude_id is not None:
        query = query.where(Admin.id != exclude_id)
    if db.scalar(query):
        raise HTTPException(status_code=409, detail="Username administrator sudah digunakan")


@router.get("/admins/roles")
def admin_roles(
    _: Admin = Depends(require_permission(PERMISSION_ADMINS)),
):
    return {"items": role_options()}


@router.get("/admins")
def admin_list(
    db: Session = Depends(get_db),
    _: Admin = Depends(require_permission(PERMISSION_ADMINS)),
):
    items = db.scalars(select(Admin).order_by(Admin.username.asc())).all()
    return {"items": [admin_management_dict(item) for item in items]}


@router.post("/admins", status_code=201)
def admin_create(
    payload: AdminCreatePayload,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(require_permission(PERMISSION_ADMINS)),
):
    username = payload.username.strip()
    role = _validate_assignable_role(payload.role)
    _ensure_unique_username(db, username)

    item = Admin(
        username=username,
        password=hash_password(payload.password),
        role=role,
    )
    db.add(item)
    db.flush()
    log_activity(db, current_admin.id, f"Menambah administrator: {item.username} ({item.role})")
    db.commit()
    db.refresh(item)
    return admin_management_dict(item)


@router.put("/admins/{admin_id}")
def admin_update(
    admin_id: int,
    payload: AdminUpdatePayload,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(require_permission(PERMISSION_ADMINS)),
):
    item = require_item(db.get(Admin, admin_id), "Administrator")

    if payload.username is not None:
        username = payload.username.strip()
        _ensure_unique_username(db, username, exclude_id=item.id)
        item.username = username

    if payload.password:
        item.password = hash_password(payload.password)

    if payload.role is not None:
        new_role = _validate_assignable_role(payload.role)
        if _is_full_access_role(item.role) and not _is_full_access_role(new_role):
            if _full_admin_count(db) <= 1:
                raise HTTPException(
                    status_code=400,
                    detail="Administrator utama terakhir tidak dapat diturunkan rolenya",
                )
        item.role = new_role

    if payload.password is not None or payload.role is not None or payload.username is not None:
        revoke_admin_sessions(db, item.id)
    log_activity(db, current_admin.id, f"Memperbarui administrator ID {admin_id}")
    db.commit()
    db.refresh(item)
    return admin_management_dict(item)


@router.delete("/admins/{admin_id}", status_code=204)
def admin_delete(
    admin_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(require_permission(PERMISSION_ADMINS)),
):
    item = require_item(db.get(Admin, admin_id), "Administrator")

    if item.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Anda tidak dapat menghapus akun sendiri")

    if _is_full_access_role(item.role) and _full_admin_count(db) <= 1:
        raise HTTPException(
            status_code=400,
            detail="Administrator utama terakhir tidak dapat dihapus",
        )

    username = item.username
    db.delete(item)
    log_activity(db, current_admin.id, f"Menghapus administrator: {username}")
    db.commit()
