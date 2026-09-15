from __future__ import annotations

import logging
import os
import re
import uuid
from pathlib import Path
from io import BytesIO
from PIL import Image

from fastapi import HTTPException, UploadFile, status
try:
    from vercel.blob import AsyncBlobClient
    from vercel.blob.errors import BlobError
except ImportError:  # optional for local tests without media provider package
    AsyncBlobClient = None
    class BlobError(Exception):
        pass

from ..core.config import settings


logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp"}
MAGIC_PREFIXES = {
    ".jpg": (b"\xff\xd8\xff",),
    ".jpeg": (b"\xff\xd8\xff",),
    ".png": (b"\x89PNG\r\n\x1a\n",),
    ".webp": (b"RIFF",),
}

async def upload_to_vercel_blob(content: bytes, filename: str, content_type: str) -> str:
    """Helper internal untuk mengirim bytes ke Vercel Blob."""
    token = os.getenv("BLOB_READ_WRITE_TOKEN", "").strip()

    if not token or AsyncBlobClient is None:
        logger.error("Media storage integration is unavailable")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Konfigurasi penyimpanan media belum tersedia",
        )

    try:
        client = AsyncBlobClient(token=token)
        blob = await client.put(
            filename,
            content,
            access="public",
            content_type=content_type,
            add_random_suffix=True,
        )
        return blob.url

    except BlobError:
        logger.exception("Vercel Blob upload failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Gagal menyimpan gambar ke Vercel Blob",
        )
    except Exception:
        logger.exception("Unexpected Blob upload error")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Gagal menyimpan gambar ke Vercel Blob",
        )

async def process_and_upload_image(file_content: bytes, filename: str, content_type: str) -> str:
    """
    Melakukan kompresi dan resize otomatis pada gambar sebelum diunggah ke Vercel Blob.
    """
    if not content_type.startswith("image/"):
        return await upload_to_vercel_blob(file_content, filename, content_type)

    try:
        image = Image.open(BytesIO(file_content))

        # Handle transparansi jika gambar PNG / RGBA / Palette
        if image.mode in ("RGBA", "LA") or (image.mode == "P" and "transparency" in image.info):
            # Jika transparan, lebih aman dikompres ke WebP karena WebP mendukung transparansi
            save_format = "WEBP"
            content_type = "image/webp"
        else:
            # Jika tidak ada transparansi, jadikan JPEG agar ukuran paling optimal & kompatibel
            if image.mode != "RGB":
                image = image.convert("RGB")
            save_format = "JPEG"
            content_type = "image/jpeg"

        # Batasi resolusi maksimal agar tidak membebani bandwidth dan RAM
        max_width = 1600
        if image.width > max_width:
            ratio = max_width / image.width
            new_height = int(image.height * ratio)
            image = image.resize((max_width, new_height), Image.Resampling.LANCZOS)

        output_buffer = BytesIO()
        image.save(
            output_buffer, 
            format=save_format, 
            quality=82, 
            optimize=True
        )
        
        compressed_content = output_buffer.getvalue()
        
        # SINKRONISASI EKSTENSI FILE:
        # Ubah ekstensi pada string 'filename' agar sesuai dengan hasil kompresi (misal .jpg atau .webp)
        path_obj = Path(filename)
        ext = ".webp" if save_format == "WEBP" else ".jpg"
        filename = f"{path_obj.parent}/{path_obj.stem}{ext}"

        return await upload_to_vercel_blob(compressed_content, filename, content_type)

    except Exception:
        # Fallback: Jika terjadi error pada library Pillow, unggah file asli apa adanya
        return await upload_to_vercel_blob(file_content, filename, content_type)


def normalize_media_url(value: str | None) -> str | None:
    if not value:
        return None

    if value.startswith("/static/uploads/"):
        return value.replace(
            "/static/uploads/",
            "/uploads/",
            1,
        )

    return value


def _safe_stem(filename: str) -> str:
    stem = Path(filename).stem
    stem = re.sub(
        r"[^A-Za-z0-9_-]+",
        "-",
        stem,
    ).strip("-")

    return stem[:60] or "image"


async def save_image(
    upload: UploadFile | None,
) -> str | None:
    if not upload or not upload.filename:
        return None

    extension = Path(upload.filename).suffix.lower()
    content_type = upload.content_type or ""

    if (
        extension not in ALLOWED_EXTENSIONS
        or content_type not in ALLOWED_MIME
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format gambar harus JPG, PNG, atau WebP",
        )

    content = await upload.read(
        settings.max_upload_bytes + 1
    )

    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File gambar kosong",
        )

    if len(content) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Ukuran gambar melebihi batas",
        )

    signature_ok = any(content.startswith(prefix) for prefix in MAGIC_PREFIXES.get(extension, ()))
    if extension == ".webp" and (len(content) < 12 or content[8:12] != b"WEBP"):
        signature_ok = False
    if not signature_ok:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Isi file gambar tidak sesuai dengan format yang diizinkan",
        )

    filename = (
        f"himatkn/"
        f"{uuid.uuid4().hex}_"
        f"{_safe_stem(upload.filename)}"
        f"{extension}"
    )

    # Memanggil fungsi kompresi dan upload otomatis yang sudah dibuat di atas
    return await process_and_upload_image(content, filename, content_type)

def delete_local_image(
    url: str | None,
) -> None:
    # Dipertahankan sementara agar pemanggilan lama
    # dari router tidak rusak.
    # Blob lama belum dihapus otomatis pada tahap ini.

    url = normalize_media_url(url)

    if not url or not url.startswith("/uploads/"):
        return

    candidate = (
        settings.upload_dir
        / Path(url).name
    ).resolve()

    if (
        candidate.parent
        == settings.upload_dir.resolve()
        and candidate.exists()
    ):
        candidate.unlink(missing_ok=True)