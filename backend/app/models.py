from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class Admin(Base):
    __tablename__ = "admin"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="admin")


class AuthSession(Base):
    __tablename__ = "auth_sessions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    admin_id: Mapped[int] = mapped_column(Integer, ForeignKey("admin.id", ondelete="CASCADE"), nullable=False, index=True)
    jti: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, index=True)


class Berita(Base):
    __tablename__ = "berita"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    judul: Mapped[str] = mapped_column(String(255), nullable=False)
    konten: Mapped[str] = mapped_column(Text, nullable=False)
    gambar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())


class ProgramKerja(Base):
    __tablename__ = "program_kerja"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nama_program: Mapped[str] = mapped_column(String(255), nullable=False)
    deskripsi: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="planned")


class Struktur(Base):
    __tablename__ = "struktur"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nama: Mapped[str] = mapped_column(String(255), nullable=False)
    jabatan: Mapped[str] = mapped_column(String(255), nullable=False)
    divisi: Mapped[str] = mapped_column(String(255), nullable=False)
    foto_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    periode: Mapped[str] = mapped_column(String(50), nullable=False, default="2025/2026")


class VisitorLog(Base):
    __tablename__ = "visitor_logs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ip_address: Mapped[str] = mapped_column(String(64), nullable=False)
    halaman: Mapped[str] = mapped_column(String(255), nullable=False)
    visited_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())


class ActivityLog(Base):
    __tablename__ = "activity_logs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    admin_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("admin.id", ondelete="SET NULL"), nullable=True)
    aktivitas: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())


class Notifikasi(Base):
    __tablename__ = "notifikasi"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    judul: Mapped[str] = mapped_column(String(255), nullable=False)
    pesan: Mapped[str] = mapped_column(Text, nullable=False)
    tipe: Mapped[str] = mapped_column(String(30), nullable=False, default="info")
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())


class SiteConfig(Base):
    __tablename__ = "site_config"
    config_key: Mapped[str] = mapped_column(String(100), primary_key=True)
    config_value: Mapped[str] = mapped_column(Text, nullable=False)
