from pathlib import Path
from io import StringIO

import pytest

from octopusmcp.catalog import Catalog
from octopusmcp.bridge import Bridge, serve
from octopusmcp.database import Database
from octopusmcp.generator import generate_server
from octopusmcp.models import CatalogPackage, Installation, InstallState
from octopusmcp.paths import AppPaths
from octopusmcp.services import Manager


def test_paths_create_separate_managed_directories(tmp_path: Path):
    paths = AppPaths(tmp_path / "data").ensure()
    assert paths.servers.is_dir()
    assert paths.staging.is_dir()
    assert paths.catalog_cache.is_dir()


def test_invalid_package_identifier_is_rejected():
    with pytest.raises(ValueError):
        CatalogPackage.model_validate(
            {
                "id": "../escape",
                "name": "Bad",
                "version": "1",
                "publisher": "test",
                "description": "bad path",
                "source": {"type": "local", "path": "."},
                "runtime": {"module": "bad"},
            }
        )


def test_database_round_trip(tmp_path: Path):
    package = CatalogPackage.model_validate(
        {
            "id": "test-server",
            "name": "Test Server",
            "version": "1.0.0",
            "publisher": "test",
            "description": "fixture",
            "source": {"type": "local", "path": "."},
            "runtime": {"module": "fixture.server"},
        }
    )
    database = Database(tmp_path / "octopus.db")
    installation = Installation.new(package).touch(state=InstallState.READY)
    database.save(installation)
    assert database.get("test-server") == installation


def test_stdio_config_uses_release_virtual_environment(tmp_path: Path):
    paths = AppPaths(tmp_path / "data").ensure()
    catalog_dir = tmp_path / "catalog"
    catalog_dir.mkdir()
    (catalog_dir / "test-server.json").write_text(
        '{"id":"test-server","name":"Test","version":"1.0.0",'
        '"publisher":"test","description":"fixture",'
        '"source":{"type":"local","path":"."},'
        '"runtime":{"module":"fixture.server"}}',
        encoding="utf-8",
    )
    manager = Manager(paths=paths, catalog=Catalog(catalog_dir))
    package = manager.catalog.get("test-server")
    installation = Installation.new(package).touch(state=InstallState.READY)
    manager.database.save(installation)
    config = manager.connection_config("test-server")
    assert "servers/test-server/releases/1.0.0/venv" in config["command"]
    assert config["args"] == ["-m", "fixture.server"]


def test_generator_creates_runnable_shape(tmp_path: Path):
    target = generate_server("Research Notes", "Local notes", AppPaths(tmp_path).ensure())
    assert (target / "pyproject.toml").exists()
    assert (target / "src" / "research_notes" / "server.py").exists()


def test_system_mcp_is_enlisted_and_non_deletable(tmp_path: Path):
    paths = AppPaths(tmp_path / "data").ensure()
    manager = Manager(paths=paths)
    installations = manager.installations()
    assert any(item.id == "octopusmcp-manager" and item.is_system for item in installations)
    
    config = manager.connection_config("octopusmcp-manager")
    assert config["type"] == "stdio"
    assert "octopusmcp" in " ".join(config["args"]) or "mcp" in " ".join(config["args"])
    
    with pytest.raises(ValueError, match="cannot be deleted"):
        manager.remove("octopusmcp-manager")


def test_bridge_uses_one_json_response_per_request():
    class StubBridge:
        def dispatch(self, method, params=None):
            assert method == "catalog.list"
            return [{"id": "fixture"}]

    output = StringIO()
    serve(StringIO('{"id":7,"method":"catalog.list","params":{}}\n'), output, StubBridge())
    assert output.getvalue() == '{"id": 7, "ok": true, "result": [{"id": "fixture"}]}\n'
