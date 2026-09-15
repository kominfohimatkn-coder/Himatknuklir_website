from __future__ import annotations

from datetime import datetime

from .models import Berita, ProgramKerja, Struktur
from .services.files import normalize_media_url
from .services.slug import slugify


def iso(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


def news_dict(item: Berita, include_content: bool = True) -> dict:
    data = {
        "id": item.id,
        "judul": item.judul,
        "slug": slugify(item.judul),
        "gambar_url": normalize_media_url(item.gambar_url),
        "created_at": iso(item.created_at),
    }
    if include_content:
        data["konten"] = item.konten
    else:
        plain = " ".join(item.konten.replace("<", " <").split())
        data["ringkasan"] = plain[:220] + ("…" if len(plain) > 220 else "")
    return data


def program_dict(item: ProgramKerja) -> dict:
    return {
        "id": item.id,
        "nama_program": item.nama_program,
        "deskripsi": item.deskripsi,
        "status": item.status,
    }


def member_dict(item: Struktur) -> dict:
    return {
        "id": item.id,
        "nama": item.nama,
        "jabatan": item.jabatan,
        "divisi": item.divisi,
        "foto_url": normalize_media_url(item.foto_url),
        "periode": item.periode,
    }
