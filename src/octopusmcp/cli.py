from __future__ import annotations

import json

import typer

from .generator import generate_server
from .services import Manager

app = typer.Typer(help="Install and manage isolated local MCP servers.", no_args_is_help=True)
http_app = typer.Typer(help="Manage persistent MCP HTTP services.")
app.add_typer(http_app, name="http")


@app.command("catalog")
def catalog_list(as_json: bool = typer.Option(False, "--json")) -> None:
    packages = Manager().packages()
    if as_json:
        typer.echo(json.dumps([item.model_dump() for item in packages], indent=2))
        return
    for package in packages:
        typer.echo(f"{package.id:20} {package.version:10} {package.name}")


@app.command()
def installed(as_json: bool = typer.Option(False, "--json")) -> None:
    manager = Manager()
    items = manager.installations()
    if as_json:
        typer.echo(json.dumps([item.model_dump() for item in items], indent=2))
        return
    if not items:
        typer.echo("No MCP servers installed.")
    for item in items:
        typer.echo(f"{item.id:20} {item.version:10} {manager.status(item)}")


@app.command()
def install(package_id: str) -> None:
    installation = Manager().install(package_id)
    typer.echo(f"Installed {installation.name} {installation.version}. Ready for stdio.")


@app.command()
def connect(package_id: str) -> None:
    typer.echo(json.dumps({"mcpServers": {package_id: Manager().connection_config(package_id)}}, indent=2))


@app.command()
def remove(
    package_id: str,
    purge_data: bool = typer.Option(False, help="Also delete models, output, and user data."),
) -> None:
    Manager().remove(package_id, purge_data=purge_data)
    typer.echo(f"Removed {package_id}." + (" Data deleted." if purge_data else " Data preserved."))


@http_app.command("start")
def http_start(package_id: str, port: int | None = None) -> None:
    installation = Manager().start_http(package_id, port)
    typer.echo(f"http://127.0.0.1:{installation.http_port}/mcp")


@http_app.command("stop")
def http_stop(package_id: str) -> None:
    Manager().stop_http(package_id)
    typer.echo(f"Stopped {package_id} HTTP service.")


@app.command()
def generate(name: str, description: str = "A locally generated MCP server") -> None:
    typer.echo(str(generate_server(name, description)))


@app.command("mcp")
def run_mcp() -> None:
    from .mcp_server import mcp

    mcp.run(transport="stdio")


if __name__ == "__main__":
    app()
