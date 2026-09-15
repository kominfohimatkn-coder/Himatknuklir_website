from __future__ import annotations

from .models import Admin

PERMISSION_DASHBOARD = "dashboard.view"
PERMISSION_NEWS = "news.manage"
PERMISSION_PROGRAMS = "programs.manage"
PERMISSION_MEMBERS = "members.manage"
PERMISSION_SETTINGS = "settings.manage"
PERMISSION_ADMINS = "admins.manage"

ALL_PERMISSIONS = frozenset({
    PERMISSION_DASHBOARD,
    PERMISSION_NEWS,
    PERMISSION_PROGRAMS,
    PERMISSION_MEMBERS,
    PERMISSION_SETTINGS,
    PERMISSION_ADMINS,
})

# Role "admin" dipertahankan sebagai role legacy agar akun lama tetap memiliki akses penuh.
FULL_ACCESS_ROLES = frozenset({"admin", "superadmin"})

ROLE_DEFINITIONS: dict[str, dict[str, object]] = {
    "superadmin": {
        "label": "Administrator Utama",
        "description": "Akses penuh ke seluruh modul dan manajemen administrator.",
        "permissions": ALL_PERMISSIONS,
    },
    "publication_admin": {
        "label": "Admin Publikasi",
        "description": "Hanya dapat melihat dan mengelola publikasi.",
        "permissions": frozenset({PERMISSION_NEWS}),
    },
    "program_admin": {
        "label": "Admin Program Kerja",
        "description": "Hanya dapat melihat dan mengelola program kerja.",
        "permissions": frozenset({PERMISSION_PROGRAMS}),
    },
    "structure_admin": {
        "label": "Admin Kepengurusan",
        "description": "Hanya dapat melihat dan mengelola struktur kepengurusan.",
        "permissions": frozenset({PERMISSION_MEMBERS}),
    },
    "settings_admin": {
        "label": "Admin Pengaturan",
        "description": "Hanya dapat melihat dan mengelola pengaturan website.",
        "permissions": frozenset({PERMISSION_SETTINGS}),
    },
}

ASSIGNABLE_ROLES = tuple(ROLE_DEFINITIONS.keys())


def permissions_for_role(role: str | None) -> set[str]:
    normalized = (role or "").strip().lower()
    if normalized in FULL_ACCESS_ROLES:
        return set(ALL_PERMISSIONS)

    definition = ROLE_DEFINITIONS.get(normalized)
    if not definition:
        return set()

    return set(definition["permissions"])


def role_label(role: str | None) -> str:
    normalized = (role or "").strip().lower()
    if normalized in FULL_ACCESS_ROLES:
        return "Administrator Utama"

    definition = ROLE_DEFINITIONS.get(normalized)
    if not definition:
        return normalized or "Administrator"

    return str(definition["label"])


def has_permission(admin: Admin, permission: str) -> bool:
    return permission in permissions_for_role(admin.role)


def admin_session_dict(admin: Admin) -> dict:
    return {
        "id": admin.id,
        "username": admin.username,
        "role": admin.role,
        "role_label": role_label(admin.role),
        "permissions": sorted(permissions_for_role(admin.role)),
    }


def admin_management_dict(admin: Admin) -> dict:
    return admin_session_dict(admin)


def role_options() -> list[dict]:
    return [
        {
            "value": role,
            "label": str(definition["label"]),
            "description": str(definition["description"]),
            "permissions": sorted(set(definition["permissions"])),
        }
        for role, definition in ROLE_DEFINITIONS.items()
    ]
