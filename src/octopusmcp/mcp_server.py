from __future__ import annotations

import json

from mcp.server.fastmcp import FastMCP

from .generator import generate_server
from .services import Manager

mcp = FastMCP("OctopusMCP Manager")


@mcp.tool()
def list_catalog_packages() -> str:
    """List MCP servers available to install."""
    return json.dumps([item.model_dump() for item in Manager().packages()], indent=2)


@mcp.tool()
def list_installed_servers() -> str:
    """List locally installed MCP servers and their states."""
    manager = Manager()
    result = [{**item.model_dump(), "runtime_status": manager.status(item)} for item in manager.installations()]
    return json.dumps(result, indent=2)


@mcp.tool()
def get_connection_config(package_id: str) -> str:
    """Return the stdio or HTTP client configuration for an installed server."""
    return json.dumps({"mcpServers": {package_id: Manager().connection_config(package_id)}}, indent=2)


@mcp.tool()
def install_server(package_id: str, confirm: bool = False) -> str:
    """Install a catalog MCP into an isolated environment. Requires confirm=true."""
    if not confirm:
        return "Installation not started. Call again with confirm=true after user approval."
    return Manager().install(package_id).model_dump_json(indent=2)


@mcp.tool()
def start_http_server(package_id: str, confirm: bool = False, port: int | None = None) -> str:
    """Start an installed MCP as a local HTTP service. Requires confirm=true."""
    if not confirm:
        return "HTTP service not started. Call again with confirm=true after user approval."
    return Manager().start_http(package_id, port).model_dump_json(indent=2)


@mcp.tool()
def stop_http_server(package_id: str) -> str:
    """Stop a persistent local HTTP MCP process."""
    return Manager().stop_http(package_id).model_dump_json(indent=2)


@mcp.tool()
def generate_mcp_project(name: str, description: str) -> str:
    """Generate a small Python MCP project in OctopusMCP's managed workspace."""
    return str(generate_server(name, description))

