from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field, field_validator


class SecureBaseModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class LoginRequest(SecureBaseModel):
    username: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=1, max_length=200)


class ProgramPayload(SecureBaseModel):
    nama_program: str = Field(min_length=2, max_length=255)
    deskripsi: str = Field(min_length=2, max_length=10000)
    status: str = Field(default="planned", pattern="^(planned|ongoing|done|postponed|cancelled)$")


class VisitPayload(SecureBaseModel):
    halaman: str = Field(min_length=1, max_length=255)

    @field_validator("halaman")
    @classmethod
    def validate_path(cls, value: str) -> str:
        if "\x00" in value:
            raise ValueError("Nilai tidak valid")
        return value


class AdminCreatePayload(SecureBaseModel):
    username: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=10, max_length=200)
    role: str = Field(min_length=1, max_length=50)


class AdminUpdatePayload(SecureBaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=100)
    password: str | None = Field(default=None, min_length=10, max_length=200)
    role: str | None = Field(default=None, min_length=1, max_length=50)
