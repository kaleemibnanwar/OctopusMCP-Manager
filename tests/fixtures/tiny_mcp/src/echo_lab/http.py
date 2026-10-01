import os

from mcp.server.fastmcp import FastMCP

mcp = FastMCP(
    "Echo Lab",
    host=os.environ.get("OCTOPUSMCP_HOST", "127.0.0.1"),
    port=int(os.environ.get("OCTOPUSMCP_PORT", "8766")),
)


@mcp.tool()
def echo(message: str) -> str:
    """Return a message unchanged."""
    return message


if __name__ == "__main__":
    mcp.run(transport="streamable-http")

