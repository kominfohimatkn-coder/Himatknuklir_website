from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import SiteConfig
from .files import normalize_media_url

# Konfigurasi berbentuk key-value agar database Flask lama tetap kompatibel.
# Key baru otomatis memakai nilai default sampai admin menyimpannya dari halaman Pengaturan.
DEFAULT_CONFIG = {
    "hero_image": "",
    "hero_eyebrow": "Politeknik Teknologi Nuklir Indonesia",
    "hero_title": "Energi tidak hilang.",
    "hero_emphasis": "Ia berpindah bentuk.",
    "hero_description": "HIMATKN Kabinet Nexus adalah rumah bagi mahasiswa Teknokimia Nuklir: titik temu strategis antara pendidikan formal akademik dengan pengembangan kompetensi diri.",
    "hero_primary_label": "Lihat Kegiatan",
    "hero_secondary_label": "Kenali Pengurus",

    "about_eyebrow": "t½ — Tentang Kami",
    "about_title": "Bukan organisasi formalitas. Ruang untuk benar-benar paham apa yang kami pelajari.",
    "about_description": "Simbol Kabinet Nexus memiliki makna mengikat dan menyatukan. Menjadi wadah pergerakan progresif untuk membangun ekosistem mahasiswa yang adaptif terhadap masa depan.",
    "about_item_1_tag": "Akademik",
    "about_item_1_title": "Belajar bersama, bukan sendiri-sendiri",
    "about_item_1_description": "Membantu mahasiswa Teknokimia Nuklir melewati kesulitan mata kuliah inti melalui kerja sama yang solid.",
    "about_item_2_tag": "Riset",
    "about_item_2_title": "Dari rasa ingin tahu ke publikasi",
    "about_item_2_description": "Wadah kolaborasi riset mahasiswa, publikasi, dan pendampingan menuju inovasi nasional.",
    "about_item_3_tag": "Komunitas",
    "about_item_3_title": "Satu ikatan yang saling kenal",
    "about_item_3_description": "Dari mentoring mahasiswa baru sampai kolaborasi antarangkatan — tidak ada yang berjalan sendirian.",

    "program_eyebrow": "Program Kerja",
    "program_title": "Inisiatif dan agenda strategis HIMATKN",
    "program_empty_text": "Belum ada program kerja yang ditambahkan.",

    "news_eyebrow": "Publikasi Terkini",
    "news_title": "Kabar dan dokumentasi terbaru",
    "news_empty_text": "Belum ada publikasi berita terbaru.",
    "news_more_label": "Lihat Semua Publikasi →",

    "structure_eyebrow": "Susunan Kepengurusan",
    "structure_title": "Tujuh simpul divisi, satu kepengurusan",
    "structure_description": "Struktur HIMATKN Kabinet Nexus membagi fokus melalui Divisi Internal, Eksternal, Reaksi, Minat dan Bakat, Keuangan, Minfo, dan Sosmas.",
    "structure_note": "Struktur diperbarui tiap pergantian periode kepengurusan.",
    "structure_button_label": "Selengkapnya →",
    "structure_item_1_kind": "Pimpinan",
    "structure_item_1_title": "Badan Pengurus Harian",
    "structure_item_1_description": "Ketua, Wakil, Sekretaris, dan Bendahara penggerak arah organisasi.",
    "structure_item_2_kind": "Divisi",
    "structure_item_2_title": "Internal & Eksternal",
    "structure_item_2_description": "Mengelola keharmonisan pengurus dan relasi ke luar himpunan.",
    "structure_item_3_kind": "Divisi",
    "structure_item_3_title": "Reaksi",
    "structure_item_3_description": "Menangani isu akademik, pengawalan kebijakan, dan literasi ilmiah.",
    "structure_item_4_kind": "Divisi",
    "structure_item_4_title": "Minat dan Bakat",
    "structure_item_4_description": "Mewadahi potensi seni, olahraga, dan kreativitas anggota.",
    "structure_item_5_kind": "Divisi",
    "structure_item_5_title": "Keuangan",
    "structure_item_5_description": "Bertanggung jawab atas stabilitas dana dan usaha mandiri himpunan.",
    "structure_item_6_kind": "Divisi",
    "structure_item_6_title": "Minfo & Sosmas",
    "structure_item_6_description": "Mengerjakan media informasi digital serta program pengabdian masyarakat.",

    "contact_eyebrow": "Bergabung",
    "contact_title": "Jadilah bagian dari Kabinet Nexus",
    "contact_description": "Terbuka untuk seluruh mahasiswa aktif Teknokimia Nuklir yang memiliki tekad untuk berkontribusi.",
    "contact_button_label": "Hubungi Kami",
    "contact_back_label": "Kembali ke Atas",
    "contact_email": "himatknuklir@gmail.com",
    "instagram_url": "https://instagram.com/himatkn.polteknuklir",
    "instagram_label": "@himatkn.polteknuklir",
    "bank_soal_url": "https://drive.google.com/drive/folders/1cURykHoJWo6xkeHE99uZE_wG0-WbGqi_",
    "secretariat": "Student Center POLTEK NUKLIR Lantai 1, Jl. Babarsari, D.I. Yogyakarta 55281",
    "period_label": "Nexus 2026",

    "brand_name": "HIMA TEKNOKIMIA NUKLIR",
    "brand_subtitle": "POLITEKNIK TEKNOLOGI NUKLIR",
    "footer_copyright": "© 2026 HIMA TEKNOKIMIA NUKLIR — Kabinet Nexus",
    "footer_institution": "Politeknik Teknologi Nuklir Indonesia, BRIN",
    "map_embed_url": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1791.3063296938928!2d110.41304960339254!3d-7.778376325970459!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a5996aaaaaaab%3A0xdd5277d8652c4602!2sPoliteknik%20Teknologi%20Nuklir%20Indonesia!5e0!3m2!1sid!2sid!4v1782232132224!5m2!1sid!2sid",
}

from urllib.parse import urlparse

ALLOWED_EXTERNAL_HOSTS = {
    "instagram.com", "www.instagram.com",
    "drive.google.com",
    "www.google.com", "maps.google.com",
    "maps.app.goo.gl",
}

URL_KEYS = {key for key in DEFAULT_CONFIG if key.endswith("_url")}

def _validate_config_value(key: str, value: str) -> str:
    if len(value) > 20000:
        raise ValueError("Nilai konfigurasi terlalu panjang")
    if "\x00" in value:
        raise ValueError("Nilai konfigurasi tidak valid")
    if key in URL_KEYS and value:
        parsed = urlparse(value)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError(f"URL konfigurasi {key} tidak valid")
        if parsed.hostname not in ALLOWED_EXTERNAL_HOSTS:
            raise ValueError(f"Host URL konfigurasi {key} tidak diizinkan")
    if key == "contact_email" and value and ("@" not in value or len(value) > 254):
        raise ValueError("Alamat email tidak valid")
    return value


def get_config(db: Session) -> dict[str, str]:
    result = dict(DEFAULT_CONFIG)
    for row in db.scalars(select(SiteConfig)).all():
        result[row.config_key] = row.config_value
    result["hero_image"] = normalize_media_url(result.get("hero_image")) or ""
    return result


def set_config(db: Session, values: dict[str, str]) -> None:
    for key, value in values.items():
        if key not in DEFAULT_CONFIG:
            continue
        current = db.get(SiteConfig, key)
        value = _validate_config_value(key, value)
        if current:
            current.config_value = value
        else:
            db.add(SiteConfig(config_key=key, config_value=value))
