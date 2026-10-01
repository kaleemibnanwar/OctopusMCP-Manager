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

# Track active subprocesses and cancel events per package for responsive cancellation
_ACTIVE_PROCS: dict[str, set[subprocess.Popen]] = {}
_CANCEL_EVENTS: dict[str, threading.Event] = {}
_PROCS_GUARD = threading.Lock()


def _package_lock(package_id: str) -> threading.Lock:
    with _LOCKS_GUARD:
        return _LOCKS.setdefault(package_id, threading.Lock())


def _get_cancel_event(package_id: str) -> threading.Event:
    with _PROCS_GUARD:
        return _CANCEL_EVENTS.setdefault(package_id, threading.Event())


def _register_proc(package_id: str, proc: subprocess.Popen) -> None:
    with _PROCS_GUARD:
        _ACTIVE_PROCS.setdefault(package_id, set()).add(proc)


def _unregister_proc(package_id: str, proc: subprocess.Popen) -> None:
    with _PROCS_GUARD:
        procs = _ACTIVE_PROCS.get(package_id)
        if procs and proc in procs:
            procs.remove(proc)


def _terminate_package_procs(package_id: str) -> None:
    with _PROCS_GUARD:
        event = _CANCEL_EVENTS.get(package_id)
        if event:
            event.set()
        procs = list(_ACTIVE_PROCS.get(package_id, []))
    for proc in procs:
        try:
            if proc.poll() is None:
                proc.terminate()
                try:
                    proc.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    proc.kill()
        except Exception:
            pass


def _run_cancellable(package_id: str, cmd: list[str], **kwargs) -> subprocess.CompletedProcess:
    cancel_event = _get_cancel_event(package_id)
    if cancel_event.is_set():
        raise InterruptedError(f"Installation of {package_id} was cancelled")

    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, **kwargs)
    _register_proc(package_id, proc)
    try:
        while proc.poll() is None:
            if cancel_event.is_set():
                proc.terminate()
                try:
                    proc.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    proc.kill()
                raise InterruptedError(f"Installation of {package_id} was cancelled")
            try:
                stdout, stderr = proc.communicate(timeout=0.2)
                break
            except subprocess.TimeoutExpired:
                continue
        else:
            stdout, stderr = proc.communicate()

        if cancel_event.is_set():
            raise InterruptedError(f"Installation of {package_id} was cancelled")

        if proc.returncode != 0:
            raise subprocess.CalledProcessError(proc.returncode, cmd, output=stdout, stderr=stderr)
        return subprocess.CompletedProcess(cmd, proc.returncode, stdout, stderr)
    finally:
        _unregister_proc(package_id, proc)


def _python(venv_dir: Path) -> Path:
    executable = "python.exe" if os.name == "nt" else "python"
    folder = "Scripts" if os.name == "nt" else "bin"
    return venv_dir / folder / executable


SYSTEM_PACKAGE_ID = "octopusmcp-manager"


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

    def _system_installation(self) -> Installation:
        return Installation(
            id=SYSTEM_PACKAGE_ID,
            package_id=SYSTEM_PACKAGE_ID,
            name="OctopusMCP Manager Core",
            version="1.0.0",
            active_release="1.0.0",
            state=InstallState.READY,
            transport="stdio",
            created_at="2025-01-01T00:00:00+00:00",
            updated_at="2025-01-01T00:00:00+00:00",
            is_system=True,
        )

    def packages(self) -> list[CatalogPackage]:
        return self.catalog.list()

    def installations(self) -> list[Installation]:
        items = self.database.list()
        has_system = any(item.id == SYSTEM_PACKAGE_ID for item in items)
        if not has_system:
            items.insert(0, self._system_installation())
        return items

    def get_installation(self, package_id: str) -> Installation | None:
        if package_id == SYSTEM_PACKAGE_ID:
            return self._system_installation()
        return self.database.get(package_id)

    def cancel_install(self, package_id: str) -> dict[str, Any]:
        """Signal ongoing installation to stop, abort child processes, and clean up workspace."""
        _terminate_package_procs(package_id)
        # Clean up database entry and staging/server directories
        installation = self.database.get(package_id)
        if installation and installation.state == InstallState.INSTALLING:
            self.database.delete(package_id)
            self.database.event(package_id, "install.cancelled", f"Installation of {package_id} was cancelled")
        
        # Clean up any leftover staging or partial server directory
        for item in self.paths.staging.glob(f"{package_id}-*"):
            shutil.rmtree(item, ignore_errors=True)
        server_dir = self.paths.server(package_id)
        if server_dir.exists():
            # If never reached ready state, wipe it
            if not installation or installation.state != InstallState.READY:
                shutil.rmtree(server_dir, ignore_errors=True)
        return {"cancelled": True, "package_id": package_id}

    def install(self, package_id: str) -> Installation:
        if package_id == SYSTEM_PACKAGE_ID:
            return self._system_installation()
        package = self.catalog.get(package_id)
        lock = _package_lock(package.id)
        if not lock.acquire(blocking=False):
            raise RuntimeError(f"An operation is already running for {package.id}")
        
        cancel_event = _get_cancel_event(package.id)
        cancel_event.clear()

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
            except InterruptedError:
                self.database.delete(package.id)
                self.database.event(package.id, "install.cancelled", f"Installation of {package.name} cancelled by user")
                server_dir = self.paths.server(package.id)
                if server_dir.exists():
                    shutil.rmtree(server_dir, ignore_errors=True)
                raise
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
            _run_cancellable(
                package.id,
                [str(python), "-m", "pip", "install", "--disable-pip-version-check", str(source)],
            )
            if package.runtime.extra_dependencies:
                _run_cancellable(
                    package.id,
                    [str(python), "-m", "pip", "install", *package.runtime.extra_dependencies],
                )
            for asset in package.assets:
                if not asset.auto_download:
                    continue
                asset_dir = final_root / "models" / asset.id
                if asset_dir.exists() and any(asset_dir.iterdir()):
                    continue
                asset_dir.mkdir(parents=True, exist_ok=True)
                _run_cancellable(
                    package.id,
                    [
                        str(python),
                        "-c",
                        "from huggingface_hub import snapshot_download; "
                        f"snapshot_download(repo_id={asset.repository!r}, local_dir={str(asset_dir)!r})",
                    ],
                )
            _run_cancellable(
                package.id,
                [str(python), "-c", f"import {package.runtime.module}"],
                cwd=source,
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
        destination.parent.mkdir(parents=True, exist_ok=True)
        source = package.source
        if source.type == "local":
            path = (self.catalog.directory / source.path).resolve()
            if not path.exists():
                raise FileNotFoundError(f"Source path not found: {path}")
            shutil.copytree(path, destination)
            return
        if source.type == "git":
            cmd = ["git", "clone", "--depth", "1", source.url, str(destination)]
            if source.ref:
                cmd[2:2] = ["--branch", source.ref]
            _run_cancellable(package.id, cmd)
            return
        raise ValueError(f"Unsupported source type: {source.type}")

    def _create_environment(self, python_spec: str, destination: Path) -> None:
        system_version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
        if Version(system_version) not in SpecifierSet(f"=={python_spec}.*" if len(python_spec.split('.')) < 3 else f"=={python_spec}"):
            # Fall back gracefully to base python if compatible major.minor
            pass
        subprocess.run([sys.executable, "-m", "venv", str(destination)], check=True, capture_output=True, text=True)

    def _environment(self, package: CatalogPackage) -> dict[str, str]:
        root = self.paths.server(package.id)
        return {
            "OCTOPUSMCP_CONFIG_DIR": str(root / "config"),
            "OCTOPUSMCP_MODELS_DIR": str(root / "models"),
            "OCTOPUSMCP_DATA_DIR": str(root / "data"),
            "OCTOPUSMCP_OUTPUT_DIR": str(root / "output"),
            "OCTOPUSMCP_LOGS_DIR": str(root / "logs"),
            "OCTOPUSMCP_RUNTIME_DIR": str(root / "runtime"),
            "OCTOPUSMCP_SERVER_ID": package.id,
        }

    def _write_installation(self, installation: Installation, package: CatalogPackage) -> None:
        target = self.paths.server(package.id) / "installation.json"
        target.write_text(installation.model_dump_json(indent=2), encoding="utf-8")

    def connection_config(self, package_id: str) -> dict[str, Any]:
        if package_id == SYSTEM_PACKAGE_ID:
            if getattr(sys, "frozen", False):
                cmd = str(sys.executable)
                args = ["mcp"]
            else:
                cmd = str(sys.executable)
                args = ["-m", "octopusmcp.mcp_server"]
            env = {
                "OCTOPUSMCP_DATA_DIR": str(self.paths.root),
            }
            stdio_details = {
                "command": cmd,
                "args": args,
                "env": env,
            }
            return {
                "active_transport": "stdio",
                "stdio": stdio_details,
                "http_url": None,
                "env": env,
                "command": cmd,
                "args": args,
                "type": "stdio",
                "is_system": True,
            }

        installation = self._ready(package_id)
        package = self.catalog.get(package_id)
        root = self.paths.server(package_id)
        environment = self._environment(package)
        release_venv = root / "releases" / installation.active_release / "venv"
        python = _python(release_venv)

        stdio_details = {
            "command": str(python),
            "args": ["-m", package.runtime.module],
            "env": environment,
        }

        http_url = (
            f"http://127.0.0.1:{installation.http_port}/mcp"
            if installation.http_port
            else None
        )

        details: dict[str, Any] = {
            "active_transport": installation.transport,
            "stdio": stdio_details,
            "http_url": http_url,
            "env": environment,
            "command": str(python),
            "args": ["-m", package.runtime.module],
        }

        if installation.transport == "streamable-http":
            details["type"] = "http"
            details["url"] = http_url
        else:
            details["type"] = "stdio"

        return details

    def start_http(self, package_id: str, port: int | None = None) -> Installation:
        if package_id == SYSTEM_PACKAGE_ID:
            raise ValueError("OctopusMCP Manager Core is a built-in stdio service and does not run standalone HTTP.")
        installation = self._ready(package_id)
        package = self.catalog.get(package_id)
        if "streamable-http" not in package.transports:
            raise ValueError(f"{package.name} does not support HTTP transport")
        if installation.pid and psutil.pid_exists(installation.pid):
            return installation

        port = port or self._free_port()
        root = self.paths.server(package_id)
        release_venv = root / "releases" / installation.active_release / "venv"
        python = _python(release_venv)
        environment = {**os.environ, **self._environment(package), "OCTOPUSMCP_HTTP_PORT": str(port)}
        log_file = (root / "logs" / "http.log").open("a", encoding="utf-8")
        entry = package.runtime.http_module or package.runtime.module
        process = subprocess.Popen(
            [str(python), "-m", entry, "--port", str(port)],
            cwd=str(root / "releases" / installation.active_release / "source"),
            env=environment,
            stdout=log_file,
            stderr=log_file,
        )
        installation = installation.touch(transport="streamable-http", http_port=port, pid=process.pid)
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
        if package_id == SYSTEM_PACKAGE_ID:
            raise ValueError("The OctopusMCP Manager Core MCP is a built-in system service and cannot be deleted.")
        installation = self.database.get(package_id)
        if not installation:
            raise KeyError(f"Not installed: {package_id}")
        if installation.is_system:
            raise ValueError("Built-in system MCP servers cannot be deleted.")
        if installation.pid:
            self.stop_http(package_id)
        root = self.paths.server(package_id)
        if purge_data:
            shutil.rmtree(root, ignore_errors=True)
        else:
            for disposable in ("releases", "runtime"):
                shutil.rmtree(root / disposable, ignore_errors=True)
            (root / "UNINSTALLED").write_text("User data preserved.\n", encoding="utf-8")
        self.database.delete(package_id)
        self.database.event(package_id, "install.removed", "Installation removed")

    def status(self, installation: Installation) -> str:
        if installation.is_system or installation.id == SYSTEM_PACKAGE_ID:
            return "ready"
        if installation.state != InstallState.READY:
            return installation.state.value
        if installation.pid:
            return "running" if psutil.pid_exists(installation.pid) else "stopped unexpectedly"
        return "ready"

    def _ready(self, package_id: str) -> Installation:
        if package_id == SYSTEM_PACKAGE_ID:
            return self._system_installation()
        installation = self.database.get(package_id)
        if not installation or installation.state != InstallState.READY:
            raise RuntimeError(f"{package_id} is not ready")
        return installation

    @staticmethod
    def _free_port() -> int:
        with socket.socket() as sock:
            sock.bind(("127.0.0.1", 0))
            return int(sock.getsockname()[1])
