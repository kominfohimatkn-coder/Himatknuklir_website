from __future__ import annotations

import asyncio
import hashlib
import time
from collections import defaultdict, deque
from ipaddress import ip_address, ip_network

from fastapi import Request
try:
    from redis.asyncio import Redis
    from redis.exceptions import RedisError
except ImportError:  # local fallback when Redis client is unavailable
    Redis = None
    class RedisError(Exception):
        pass

from .core.config import settings


class RateLimiter:
    def __init__(self) -> None:
        self._events: dict[str, deque[float]] = defaultdict(deque)
        self._lock = asyncio.Lock()
        self._redis: Redis | None = None
        if settings.rate_limit_backend == "redis" and settings.redis_url and Redis is not None:
            self._redis = Redis.from_url(settings.redis_url, decode_responses=True)

    def _trusted_proxy(self, request: Request) -> bool:
        if not request.client:
            return False
        try:
            client_ip = ip_address(request.client.host)
        except ValueError:
            return False
        for net in settings.trusted_proxy_ips:
            try:
                if client_ip in ip_network(net, strict=False):
                    return True
            except ValueError:
                continue
        return False

    def client_ip(self, request: Request) -> str:
        if self._trusted_proxy(request):
            forwarded = request.headers.get("x-forwarded-for", "")
            if forwarded:
                candidate = forwarded.split(",")[0].strip()
                try:
                    ip_address(candidate)
                    return candidate
                except ValueError:
                    pass
        return request.client.host if request.client else "unknown"

    async def allow(self, key: str, limit: int, window_seconds: int) -> tuple[bool, int]:
        now = time.time()
        if settings.rate_limit_backend == "redis" and self._redis is None:
            if settings.rate_limit_fail_closed:
                return False, window_seconds

        if self._redis is not None:
            try:
                bucket = int(now // window_seconds)
                safe_key = hashlib.sha256(key.encode("utf-8")).hexdigest()
                redis_key = f"rl:{safe_key}:{bucket}"
                count = await self._redis.incr(redis_key)
                if count == 1:
                    await self._redis.expire(redis_key, window_seconds + 1)
                return count <= limit, max(0, window_seconds - int(now % window_seconds))
            except RedisError:
                if settings.rate_limit_fail_closed:
                    return False, window_seconds

        async with self._lock:
            q = self._events[key]
            cutoff = now - window_seconds
            while q and q[0] <= cutoff:
                q.popleft()
            if len(q) >= limit:
                return False, max(1, int(window_seconds - (now - q[0])))
            q.append(now)
            return True, 0


limiter = RateLimiter()


async def enforce_request_limit(request: Request) -> None:
    path = request.url.path
    method = request.method.upper()
    ip = limiter.client_ip(request)

    rules: list[tuple[str, int, int, str]] = []
    if path == "/api/auth/login":
        rules.append((f"login-ip:{ip}", 10, 60, "Login terlalu sering. Silakan coba lagi nanti."))
    elif path in {"/api/auth/logout", "/api/public/visit"}:
        rules.append((f"mutate:{path}:{ip}", 30 if path.endswith("logout") else 60, 60, "Terlalu banyak permintaan."))
    elif path == "/api/public/news" or path.startswith("/api/public/news/") or path in {"/api/public/home", "/api/public/config", "/api/public/structure"}:
        rules.append((f"read:{path}:{ip}", 120, 60, "Terlalu banyak permintaan."))
    elif path.startswith("/api/admin/search"):
        rules.append((f"search:{ip}", 60, 60, "Pencarian terlalu sering."))
    elif path.startswith("/api/admin/") and method in {"POST", "PUT", "PATCH", "DELETE"}:
        rules.append((f"admin-write:{ip}", 60, 60, "Terlalu banyak perubahan. Silakan coba lagi nanti."))

    for key, limit, window, message in rules:
        allowed, retry_after = await limiter.allow(key, limit, window)
        if not allowed:
            from fastapi import HTTPException
            exc = HTTPException(status_code=429, detail=message, headers={"Retry-After": str(retry_after)})
            raise exc
