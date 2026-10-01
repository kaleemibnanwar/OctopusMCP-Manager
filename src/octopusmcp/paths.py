from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from platformdirs import user_data_path


@dataclass(frozen=True)
class AppPaths:
    root: Path

    @classmethod
    def discover(cls) -> "AppPaths":
        override = os.environ.get("OCTOPUSMCP_HOME")
        root = Path(override).expanduser() if override else user_data_path("OctopusMCP", appauthor=False)
        return cls(root.resolve())

    @property
    def database(self) -> Path:
        return self.root / "octopus.db"

    @property
    def servers(self) -> Path:
        return self.root / "servers"

    @property
    def staging(self) -> Path:
        return self.root / "staging"

    @property
    def catalog_cache(self) -> Path:
        return self.root / "catalog" / "cache"

    @property
    def logs(self) -> Path:
        return self.root / "logs"

    def ensure(self) -> "AppPaths":
        for directory in (self.root, self.servers, self.staging, self.catalog_cache, self.logs):
            directory.mkdir(parents=True, exist_ok=True)
        return self

    def server(self, package_id: str) -> Path:
        return self.servers / package_id

