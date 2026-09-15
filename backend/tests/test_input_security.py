import os
os.environ.setdefault('APP_ENV', 'test')
os.environ.setdefault('DATABASE_URL', 'mysql+pymysql://test:test@127.0.0.1:3306/himatkn')
os.environ.setdefault('JWT_SECRET_KEY', 'x' * 64)
os.environ.setdefault('ADMIN_DEFAULT_PASSWORD', 'test-only-password-not-production')

from fastapi import Request
from app.services.config_service import _validate_config_value


def test_config_url_allowlist_rejects_non_approved_hosts():
    try:
        _validate_config_value('instagram_url', 'https://example.invalid/phish')
    except ValueError:
        return
    raise AssertionError('unapproved external host must be rejected')


def test_config_url_allowlist_accepts_expected_host():
    assert _validate_config_value('instagram_url', 'https://instagram.com/himatkn.polteknuklir')
