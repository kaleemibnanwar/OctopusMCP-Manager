from __future__ import annotations

import re
from datetime import datetime, timezone
from enum import StrEnum
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator

PACKAGE_ID = re.compile(r"^[a-z0-9][a-z0-9-]{1,62}$")


class InstallState(StrEnum):
    INSTALLING = "installing"
    READY = "ready"
    FAILED = "failed"
    UPDATING = "updating"
    REMOVING = "removing"


class SourceSpec(BaseModel):
    type: Literal["git", "local"]
    url: str | None = None
    path: str | None = None
    revision: str | None = None


class RuntimeSpec(BaseModel):
    python: str = ">=3.11"
    module: str
    extra_dependencies: list[str] = Field(default_factory=list)
    http_module: str | None = None


class AssetSpec(BaseModel):
    id: str
    type: Literal["huggingface"] = "huggingface"
    repository: str
    required: bool = True
    auto_download: bool = False


class CatalogPackage(BaseModel):
    schema_version: int = 1
    id: str
    name: str
    version: str
    publisher: str
    description: str
    category: str = "Utilities"
    source: SourceSpec
    runtime: RuntimeSpec
    transports: list[Literal["stdio", "streamable-http"]] = Field(default_factory=lambda: ["stdio"])
    environment: dict[str, str] = Field(default_factory=dict)
    assets: list[AssetSpec] = Field(default_factory=list)
    permissions: list[str] = Field(default_factory=list)
    hardware: str = "Any modern computer"

    @field_validator("id")
    @classmethod
    def valid_id(cls, value: str) -> str:
        if not PACKAGE_ID.fullmatch(value):
            raise ValueError("package id must be lowercase letters, digits, and hyphens")
        return value


class Installation(BaseModel):
    id: str
    package_id: str
    name: str
    version: str
    active_release: str
    state: InstallState
    transport: Literal["stdio", "streamable-http"] = "stdio"
    http_port: int | None = None
    pid: int | None = None
    error: str | None = None
    created_at: str
    updated_at: str
    environment: dict[str, str] = Field(default_factory=dict)

    @classmethod
    def new(cls, package: CatalogPackage) -> "Installation":
        now = datetime.now(timezone.utc).isoformat()
        return cls(
            id=package.id,
            package_id=package.id,
            name=package.name,
            version=package.version,
            active_release=package.version,
            state=InstallState.INSTALLING,
            created_at=now,
            updated_at=now,
        )

    def touch(self, **changes: Any) -> "Installation":
        return self.model_copy(update={**changes, "updated_at": datetime.now(timezone.utc).isoformat()})

