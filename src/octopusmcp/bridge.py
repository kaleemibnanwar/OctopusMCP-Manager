from __future__ import annotations

import json
import sys
import traceback
from collections.abc import Callable
from typing import Any

from .generator import generate_server
from .services import Manager


class Bridge:
    """Small request dispatcher used by Electron over stdin/stdout."""

    def __init__(self, manager_factory: Callable[[], Manager] = Manager):
        self.manager_factory = manager_factory

    def dispatch(self, method: str, params: dict[str, Any] | None = None) -> Any:
        params = params or {}
        manager = self.manager_factory()
        handlers: dict[str, Callable[..., Any]] = {
            "overview": lambda: self._overview(manager),
            "catalog.list": lambda: [item.model_dump() for item in manager.packages()],
            "servers.list": lambda: self._servers(manager),
            "servers.get": lambda package_id: self._server(manager, package_id),
            "servers.install": lambda package_id: manager.install(package_id).model_dump(),
            "servers.install.cancel": lambda package_id: manager.cancel_install(package_id),
            "servers.connection": lambda package_id: manager.connection_config(package_id),
            "servers.http.start": lambda package_id, port=None: manager.start_http(
                package_id, port
            ).model_dump(),
            "servers.http.stop": lambda package_id: manager.stop_http(package_id).model_dump(),
            "servers.remove": lambda package_id, purge_data=False: self._remove(
                manager, package_id, purge_data
            ),
            "builder.generate": lambda name, description: {
                "path": str(generate_server(name, description, manager.paths))
            },
        }
        handler = handlers.get(method)
        if not handler:
            raise ValueError(f"Unknown bridge method: {method}")
        return handler(**params)

    @staticmethod
    def _servers(manager: Manager) -> list[dict[str, Any]]:
        return [
            {**item.model_dump(), "runtime_status": manager.status(item)}
            for item in manager.installations()
        ]

    def _overview(self, manager: Manager) -> dict[str, Any]:
        servers = self._servers(manager)
        return {
            "servers": servers,
            "catalog_count": len(manager.packages()),
            "running_count": sum(item["runtime_status"] == "running" for item in servers),
            "events": manager.database.events(),
            "data_root": str(manager.paths.root),
        }

    @staticmethod
    def _server(manager: Manager, package_id: str) -> dict[str, Any]:
        package = manager.catalog.get(package_id)
        installation = manager.get_installation(package_id)
        return {
            "package": package.model_dump(),
            "installation": installation.model_dump() if installation else None,
            "runtime_status": manager.status(installation) if installation else "not installed",
            "connection": manager.connection_config(package_id)
            if installation and installation.state.value == "ready"
            else None,
        }

    @staticmethod
    def _remove(manager: Manager, package_id: str, purge_data: bool) -> dict[str, bool]:
        manager.remove(package_id, purge_data=purge_data)
        return {"removed": True, "data_purged": purge_data}


def serve(input_stream=sys.stdin, output_stream=sys.stdout, bridge: Bridge | None = None) -> None:
    dispatcher = bridge or Bridge()
    for line in input_stream:
        try:
            request = json.loads(line)
            request_id = request.get("id")
            result = dispatcher.dispatch(request["method"], request.get("params"))
            response = {"id": request_id, "ok": True, "result": result}
        except Exception as exc:  # The bridge must stay alive after individual failures.
            response = {
                "id": locals().get("request_id"),
                "ok": False,
                "error": {"type": type(exc).__name__, "message": str(exc)},
            }
            traceback.print_exc(file=sys.stderr)
        output_stream.write(json.dumps(response, default=str) + "\n")
        output_stream.flush()


def main() -> None:
    serve()


if __name__ == "__main__":
    main()
