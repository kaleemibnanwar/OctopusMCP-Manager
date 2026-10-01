from __future__ import annotations

import json
import re
from pathlib import Path

from .paths import AppPaths


def generate_server(name: str, description: str, paths: AppPaths | None = None) -> Path:
    app_paths = (paths or AppPaths.discover()).ensure()
    package_id = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    if len(package_id) < 2:
        raise ValueError("Name must contain at least two letters or digits")
    target = app_paths.root / "generated" / package_id
    if target.exists():
        raise FileExistsError(f"Generated project already exists: {package_id}")
    package_name = package_id.replace("-", "_")
    source = target / "src" / package_name
    source.mkdir(parents=True)
    (target / "pyproject.toml").write_text(
        f'''[build-system]\nrequires = ["hatchling"]\nbuild-backend = "hatchling.build"\n\n'''
        f'''[project]\nname = "{package_id}"\nversion = "0.1.0"\n'''
        f'''description = {json.dumps(description)}\nrequires-python = ">=3.11"\n'''
        '''dependencies = ["mcp>=1.9,<2"]\n\n'''
        f'''[project.scripts]\n{package_id} = "{package_name}.server:main"\n\n'''
        f'''[tool.hatch.build.targets.wheel]\npackages = ["src/{package_name}"]\n''',
        encoding="utf-8",
    )
    (source / "__init__.py").write_text("", encoding="utf-8")
    (source / "server.py").write_text(
        f'''from mcp.server.fastmcp import FastMCP\n\n'''
        f'''mcp = FastMCP({name!r})\n\n'''
        '''@mcp.tool()\ndef hello(name: str = "world") -> str:\n'''
        '''    """Return a friendly greeting."""\n    return f"Hello, {name}!"\n\n'''
        '''def main() -> None:\n    mcp.run(transport="stdio")\n\n'''
        '''if __name__ == "__main__":\n    main()\n''',
        encoding="utf-8",
    )
    (target / "README.md").write_text(
        f"# {name}\n\n{description}\n\nRun with `{package_id}`.\n", encoding="utf-8"
    )
    return target

