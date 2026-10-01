from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Echo Lab")


@mcp.tool()
def echo(message: str) -> str:
    """Return a message unchanged."""
    return message


@mcp.tool()
def environment_identity() -> str:
    """Return the interpreter used by this isolated server."""
    import sys

    return sys.executable


def main() -> None:
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()

