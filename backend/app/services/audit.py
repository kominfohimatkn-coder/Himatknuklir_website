from __future__ import annotations

from sqlalchemy.orm import Session

from ..models import ActivityLog, Notifikasi


def log_activity(db: Session, admin_id: int | None, text: str) -> None:
    db.add(ActivityLog(admin_id=admin_id, aktivitas=text))


def notify(db: Session, title: str, message: str, kind: str = "info") -> None:
    db.add(Notifikasi(judul=title, pesan=message, tipe=kind, is_read=False))
