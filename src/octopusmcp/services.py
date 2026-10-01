from __future__ import annotations

import json
import os
import shutil
import socket
import subprocess
import sys
import threading
import uuid
from pathlib import Path

import psutil
from packaging.specifiers import SpecifierSet
from packaging.version import Version

from .catalog import Catalog
from .database import Database
from .models import CatalogPackage, Installation, InstallState
from .paths import AppPaths

_LOCKS: dict[str, threading.Lock] = {}
_LOCKS_GUARD = threading.Lock()


def _package_lock(package_id: str) -> threading.Lock:
    with _LOCKS_GUARD:
        return _LOCKS.setdefault(package_id, threading.Lock())


def _python(venv_dir: Path) -> Path:
    executable = "python.exe" if os.name == "nt" else "python"
    folder = "Scripts" if os.name == "nt" else "bin"
    return venv_dir / folder / executable


class Manager:
    def __init__(
        self,
        paths: AppPaths | None = None,
        catalog: Catalog | None = None,
        database: Database | None = None,
    ):
        self.paths = (paths or AppPaths.discover()).ensure()
        self.catalog = catalog or Catalog()
        self.database = database or Database(self.paths.database)

    def packages(self) -> list[CatalogPackage]:
        return self.catalog.list()

    def installations(self) -> list[Installation]:
        return self.database.list()

    def install(self, package_id: str) -> Installation:
        package = self.catalog.get(package_id)
        lock = _package_lock(package.id)
        if not lock.acquire(blocking=False):
            raise RuntimeError(f"An operation is already running for {package.id}")
        try:
            existing = self.database.get(package.id)
            if existing and existing.state == InstallState.READY:
                raise RuntimeError(f"{package.name} is already installed")
            installation = existing or Installation.new(package)
            installation = installation.touch(state=InstallState.INSTALLING, error=None)
            self.database.save(installation)
            self.database.event(package.id, "install.started", f"Installing {package.name} {package.version}")
            try:
                self._install_release(package)
                installation = installation.touch(
                    version=package.version,
                    active_release=package.version,
                    state=InstallState.READY,
                    environment=self._environment(package),
                )
                self.database.save(installation)
                self._write_installation(installation, package)
                self.database.event(package.id, "install.ready", f"{package.name} is ready")
                return installation
            except Exception as exc:
                installation = installation.touch(state=InstallState.FAILED, error=str(exc))
                self.database.save(installation)
                self.database.event(package.id, "install.failed", str(exc))
                raise
        finally:
            lock.release()

    def _install_release(self, package: CatalogPackage) -> None:
        stage_root = self.paths.staging / f"{package.id}-{uuid.uuid4().hex}"
        stage_release = stage_root / package.version
        source = stage_release / "source"
        environment = stage_release / "venv"
        final_root = self.paths.server(package.id)
        final_release = final_root / "releases" / package.version
        stage_release.mkdir(parents=True)
        try:
            self._fetch(package, source)
            self._create_environment(package.runtime.python, environment)
            python = _python(environment)
            subprocess.run(
                [str(python), "-m", "pip", "install", "--disable-pip-version-check", str(source)],
                check=True,
                capture_output=True,
                text=True,
            )
            if package.runtime.extra_dependencies:
                subprocess.run(
                    [str(python), "-m", "pip", "install", *package.runtime.extra_dependencies],
                    check=True,
                    capture_output=True,
                    text=True,
                )
            for asset in package.assets:
                if not asset.auto_download:
                    continue
                asset_dir = final_root / "models" / asset.id
                if asset_dir.exists() and any(asset_dir.iterdir()):
                    continue
                asset_dir.mkdir(parents=True, exist_ok=True)
                subprocess.run(
                    [
                        str(python),
                        "-c",
                        "from huggingface_hub import snapshot_download; "
                        f"snapshot_download(repo_id={asset.repository!r}, local_dir={str(asset_dir)!r})",
                    ],
                    check=True,
                    capture_output=True,
                    text=True,
                )
            subprocess.run(
                [str(python), "-c", f"import {package.runtime.module}"],
                cwd=source,
                check=True,
                timeout=60,
                env={**os.environ, **self._environment(package)},
            )
            for directory in ("config", "models", "data", "output", "logs", "runtime", "backups"):
                (final_root / directory).mkdir(parents=True, exist_ok=True)
            (final_root / "releases").mkdir(parents=True, exist_ok=True)
            if final_release.exists():
                raise RuntimeError(f"Release {package.version} already exists")
            shutil.move(str(stage_release), str(final_release))
        finally:
            shutil.rmtree(stage_root, ignore_errors=True)

    def _fetch(self, package: CatalogPackage, destination: Path) -> None:
        if package.source.type == "local":
            source = self.catalog.path_for_local_source(package)
            if not source.is_dir():
                raise FileNotFoundError(f"Local package source not found: {source}")
            shutil.copytree(
                source,
                destination,
                ignore=shutil.ignore_patterns(".git", ".venv", "__pycache__", "*.pyc"),
            )
            return
        if not package.source.url:
            raise ValueError("Git source requires a URL")
        subprocess.run(
            ["git", "clone", "--filter=blob:none", package.source.url, str(destination)],
            check=True,
            capture_output=True,
            text=True,
        )
        if package.source.revision:
            subprocess.run(
                ["git", "checkout", "--detach", package.source.revision],
                cwd=destination,
                check=True,
                capture_output=True,
                text=True,
            )

    @staticmethod
    def _create_environment(requirement: str, destination: Path) -> None:
        specifier = SpecifierSet(requirement)
        candidates = [sys.executable]
        candidates.extend(
            executable
            for name in ("python3.14", "python3.13", "python3.12", "python3.11", "python3")
            if (executable := shutil.which(name))
        )
        checked: set[str] = set()
        for executable in candidates:
            resolved = str(Path(executable).resolve())
            if resolved in checked:
                continue
            checked.add(resolved)
            result = subprocess.run(
                [executable, "-c", "import sys; print('.'.join(map(str, sys.version_info[:3])))"],
                capture_output=True,
                text=True,
                check=True,
            )
            if Version(result.stdout.strip()) in specifier:
                subprocess.run(
                    [executable, "-m", "venv", str(destination)],
                    check=True,
                    capture_output=True,
                    text=True,
                )
                return
        raise RuntimeError(
            f"No installed Python interpreter satisfies {requirement}. "
            "Install a compatible Python version and retry."
        )

    def _environment(self, package: CatalogPackage) -> dict[str, str]:
        root = self.paths.server(package.id)
        replacements = {
            "{server_root}": str(root),
            "{models}": str(root / "models"),
            "{data}": str(root / "data"),
            "{output}": str(root / "output"),
            "{logs}": str(root / "logs"),
        }
        result: dict[str, str] = {}
        for key, value in package.environment.items():
            for marker, replacement in replacements.items():
                value = value.replace(marker, replacement)
            result[key] = value
        result.setdefault("HF_HOME", str(root / "models" / "huggingface"))
        result.setdefault("TORCH_HOME", str(root / "models" / "torch"))
        return result

    def _write_installation(self, installation: Installation, package: CatalogPackage) -> None:
        root = self.paths.server(package.id)
        (root / "installation.json").write_text(
            installation.model_dump_json(indent=2), encoding="utf-8"
        )
        (root / "manifest.json").write_text(package.model_dump_json(indent=2), encoding="utf-8")
        (root / "config" / "environment.json").write_text(
            json.dumps(installation.environment, indent=2), encoding="utf-8"
        )

    def connection_config(self, package_id: str) -> dict:
        installation = self._ready(package_id)
        package = self.catalog.get(package_id)
        if installation.transport == "streamable-http":
            return {"url": f"http://127.0.0.1:{installation.http_port}/mcp"}
        release = self.paths.server(package_id) / "releases" / installation.active_release
        return {
            "command": str(_python(release / "venv")),
            "args": ["-m", package.runtime.module],
            "cwd": str(release / "source"),
            "env": installation.environment,
        }

    def start_http(self, package_id: str, port: int | None = None) -> Installation:
        installation = self._ready(package_id)
        package = self.catalog.get(package_id)
        if "streamable-http" not in package.transports or not package.runtime.http_module:
            raise RuntimeError(f"{package.name} does not provide an HTTP entry point")
        if installation.pid and psutil.pid_exists(installation.pid):
            return installation
        port = port or self._free_port()
        release = self.paths.server(package_id) / "releases" / installation.active_release
        log_path = self.paths.server(package_id) / "logs" / "http.log"
        log = log_path.open("ab")
        env = {
            **os.environ,
            **installation.environment,
            "OCTOPUSMCP_HOST": "127.0.0.1",
            "OCTOPUSMCP_PORT": str(port),
        }
        process = subprocess.Popen(
            [str(_python(release / "venv")), "-m", package.runtime.http_module],
            cwd=release / "source",
            env=env,
            stdout=log,
            stderr=subprocess.STDOUT,
            start_new_session=os.name != "nt",
        )
        log.close()
        installation = installation.touch(
            transport="streamable-http", http_port=port, pid=process.pid
        )
        self.database.save(installation)
        self._write_installation(installation, package)
        self.database.event(package_id, "http.started", f"Listening on 127.0.0.1:{port}")
        return installation

    def stop_http(self, package_id: str) -> Installation:
        installation = self.database.get(package_id)
        if not installation:
            raise KeyError(f"Not installed: {package_id}")
        if installation.pid and psutil.pid_exists(installation.pid):
            process = psutil.Process(installation.pid)
            process.terminate()
            try:
                process.wait(timeout=8)
            except psutil.TimeoutExpired:
                process.kill()
        package = self.catalog.get(package_id)
        installation = installation.touch(transport="stdio", http_port=None, pid=None)
        self.database.save(installation)
        self._write_installation(installation, package)
        self.database.event(package_id, "http.stopped", "HTTP service stopped")
        return installation

    def remove(self, package_id: str, purge_data: bool = False) -> None:
        installation = self.database.get(package_id)
        if not installation:
            raise KeyError(f"Not installed: {package_id}")
        if installation.pid:
            self.stop_http(package_id)
        root = self.paths.server(package_id)
        if purge_data:
            shutil.rmtree(root)
        else:
            for disposable in ("releases", "runtime"):
                shutil.rmtree(root / disposable, ignore_errors=True)
            (root / "UNINSTALLED").write_text("User data preserved.\n", encoding="utf-8")
        self.database.delete(package_id)
        self.database.event(package_id, "install.removed", "Installation removed")

    def status(self, installation: Installation) -> str:
        if installation.state != InstallState.READY:
            return installation.state.value
        if installation.pid:
            return "running" if psutil.pid_exists(installation.pid) else "stopped unexpectedly"
        return "ready"

    def _ready(self, package_id: str) -> Installation:
        installation = self.database.get(package_id)
        if not installation or installation.state != InstallState.READY:
            raise RuntimeError(f"{package_id} is not ready")
        return installation

    @staticmethod
    def _free_port() -> int:
        with socket.socket() as sock:
            sock.bind(("127.0.0.1", 0))
            return int(sock.getsockname()[1])
