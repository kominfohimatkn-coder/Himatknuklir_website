import os

os.environ.setdefault('APP_ENV', 'test')
os.environ.setdefault('DEBUG', 'false')
os.environ.setdefault('DATABASE_URL', 'mysql+pymysql://test:test@127.0.0.1:3306/himatkn')
os.environ.setdefault('JWT_SECRET_KEY', 'x' * 64)
os.environ.setdefault('ADMIN_DEFAULT_PASSWORD', 'test-only-password-not-production')
os.environ.setdefault('RATE_LIMIT_BACKEND', 'memory')

from datetime import datetime, timedelta, timezone

import pytest
import jwt
from fastapi.testclient import TestClient

from app.core.config import settings
from app.auth_sessions import create_session, get_valid_session, revoke_token
from app.database import Base
from app.models import Admin
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from app.main import app
from app.security import ALGORITHM, create_access_token, decode_access_token, hash_password, verify_password


def test_argon2_password_hash_and_verify():
    stored = hash_password('correct horse battery staple')
    assert stored.startswith('$argon2id$')
    assert verify_password('correct horse battery staple', stored)[0] is True
    assert verify_password('wrong', stored)[0] is False


def test_bcrypt_legacy_hash_is_upgrade_candidate():
    bcrypt = pytest.importorskip('bcrypt')
    stored = bcrypt.hashpw(b'legacy-password', bcrypt.gensalt()).decode()
    valid, upgrade = verify_password('legacy-password', stored)
    assert valid is True
    assert upgrade is True


def test_jwt_requires_issuer_audience_and_jti():
    token, jti, _ = create_access_token(1, 'admin', 'superadmin')
    payload = decode_access_token(token)
    assert payload['jti'] == jti
    assert payload['iss'] == settings.jwt_issuer
    assert payload['aud'] == settings.jwt_audience


def test_jwt_wrong_algorithm_is_rejected():
    now = datetime.now(timezone.utc)
    token = jwt.encode(
        {'sub': '1', 'iss': settings.jwt_issuer, 'aud': settings.jwt_audience, 'jti': 'x', 'iat': now, 'exp': now + timedelta(minutes=5)},
        settings.jwt_secret_key,
        algorithm='HS384',
    )
    with pytest.raises(jwt.InvalidTokenError):
        decode_access_token(token)


def test_jwt_expiration_is_rejected():
    now = datetime.now(timezone.utc)
    token = jwt.encode(
        {'sub': '1', 'iss': settings.jwt_issuer, 'aud': settings.jwt_audience, 'jti': 'x', 'iat': now - timedelta(minutes=5), 'exp': now - timedelta(minutes=1)},
        settings.jwt_secret_key,
        algorithm=ALGORITHM,
    )
    with pytest.raises(jwt.InvalidTokenError):
        decode_access_token(token)


def test_jwt_wrong_audience_is_rejected():
    now = datetime.now(timezone.utc)
    token = jwt.encode(
        {'sub': '1', 'iss': settings.jwt_issuer, 'aud': 'wrong', 'jti': 'x', 'iat': now, 'exp': now + timedelta(minutes=5)},
        settings.jwt_secret_key,
        algorithm=ALGORITHM,
    )
    try:
        decode_access_token(token)
    except jwt.InvalidTokenError:
        pass
    else:
        raise AssertionError('wrong audience must be rejected')


def test_health_is_non_sensitive():
    with TestClient(app) as client:
        response = client.get('/api/health')
    assert response.status_code == 200
    assert set(response.json()) == {'status', 'app'}
    assert 'secret' not in response.text.lower()


def test_session_can_be_revoked():
    engine = create_engine('sqlite+pysqlite:///:memory:')
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        admin = Admin(username='test-admin', password='hash', role='superadmin')
        db.add(admin); db.flush()
        token, jti, expires = create_access_token(admin.id, admin.username, admin.role)
        create_session(db, admin.id, jti, token, expires)
        db.commit()
        assert get_valid_session(db, token, jti, admin.id) is not None
        revoke_token(db, token, jti)
        db.commit()
        assert get_valid_session(db, token, jti, admin.id) is None
