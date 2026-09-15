from __future__ import annotations

import re
import unicodedata


def slugify(value: str) -> str:
    """Create a readable, URL-safe slug without depending on a database ID."""
    normalized = unicodedata.normalize("NFKD", value or "")
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_value).strip("-").lower()
    return slug or "publikasi"
