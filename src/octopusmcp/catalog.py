from __future__ import annotations

import json
import sys
from pathlib import Path

from .models import CatalogPackage


class Catalog:
    def __init__(self, directory: Path | None = None):
        if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
            project_root = Path(sys._MEIPASS)  # type: ignore[attr-defined]
        else:
            project_root = Path(__file__).resolve().parents[2]
        self.directory = directory or project_root / "catalog" / "packages"

    def list(self) -> list[CatalogPackage]:
        packages = []
        for path in sorted(self.directory.glob("*.json")):
            packages.append(CatalogPackage.model_validate_json(path.read_text(encoding="utf-8")))
        return packages

    def get(self, package_id: str) -> CatalogPackage:
        for package in self.list():
            if package.id == package_id:
                return package
        raise KeyError(f"Catalog package not found: {package_id}")

    def path_for_local_source(self, package: CatalogPackage) -> Path:
        if package.source.type != "local" or not package.source.path:
            raise ValueError("package does not use a local source")
        path = Path(package.source.path).expanduser()
        if not path.is_absolute():
            path = self.directory.parent.parent / path
        return path.resolve()
