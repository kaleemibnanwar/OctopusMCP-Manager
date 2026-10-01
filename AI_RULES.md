# AI Development Rules & Project Context

## Tech Stack
- **Electron Desktop Framework:** Electron (v39+) with Electron Forge for desktop application lifecycle, window management, and native packaging.
- **Python Sidecar Backend:** Python (>=3.11) with Hatchling build backend and virtual environment management per MCP server.
- **IPC Stdio Bridge:** Inter-process communication between Electron Main and Python using newline-delimited JSON messages over `stdin`/`stdout`.
- **Model Context Protocol (MCP):** Official `mcp` library (v1.9+) for stdio and HTTP MCP server implementations and client integrations.
- **Data Validation & Schemas:** Pydantic (v2.10+) for type-safe data models, catalog definitions, and backend message contracts.
- **CLI Interface:** Typer (v0.15+) for terminal commands, status reporting, and server management workflows.
- **Process & System Supervision:** `psutil` (v6+) for process lifecycle management, port inspection, and resource monitoring.
- **Storage & State:** SQLite via Python's standard `sqlite3` for local metadata, activity logs, and server registry.
- **Filesystem & Paths:** `platformdirs` for OS-native isolated data directory resolution (`~/.local/share/OctopusMCP`, `%LOCALAPPDATA%/OctopusMCP`, etc.).
- **Lightweight Renderer UI:** Native HTML5, CSS3, and modern JavaScript (ES Modules) without heavy frontend bundlers for minimal overhead and instant loading.

---

## Library & Module Usage Rules

### 1. Python Backend (`src/octopusmcp/`)
- **`mcp` (`mcp.server`, `mcp.types`)**:
  - Use exclusively for implementing MCP servers, defining tools, resources, and stdio/SSE/HTTP transports.
- **`pydantic` (`BaseModel`, `Field`)**:
  - Use for all domain models, catalog item definitions, configuration schemas, and bridge request/response validation.
  - Do not use raw untyped dicts for cross-process or persisted data contracts.
- **`typer`**:
  - Use for CLI command definitions, argument parsing, interactive prompts, and terminal styling.
- **`platformdirs`**:
  - Use for resolving all user data, configuration, cache, and runtime directories across operating systems. Never hardcode absolute home or temporary paths.
- **`psutil`**:
  - Use for checking running processes, verifying active TCP ports for HTTP MCP servers, memory tracking, and process tree termination.
- **`packaging.version`**:
  - Use for version parsing, comparison, and compatibility checks for MCP packages.
- **`sqlite3` (Standard Library)**:
  - Use for local relational data storage (`octopus.db`), installation records, and operational logs.
- **`subprocess` & `venv` (Standard Library)**:
  - Use for creating per-server isolated virtual environments and launching MCP server subprocesses.

### 2. Electron Application (`electron/`)
- **`electron` Main Process (`electron/main.js`)**:
  - Responsible for app lifecycle, spawning the Python sidecar process, routing IPC requests from the renderer to Python, and opening external URLs safely via `shell.openExternal`.
- **Preload Script (`electron/preload.js`)**:
  - Expose only explicit, secure bridge APIs via `contextBridge.exposeInMainWorld('octopus', ...)`.
  - Never enable `nodeIntegration: true` or expose raw Node.js primitives (`child_process`, `fs`, etc.) directly to the renderer.
- **Renderer (`electron/renderer/`)**:
  - Pure HTML/CSS/JS client. All backend operations must be dispatched through `window.octopus` methods.

### 3. Build, Packaging & Testing
- **`PyInstaller` (`scripts/build-python.mjs`)**:
  - Used during packaging to bundle the Python sidecar binary (`octopusmcp-backend`) into Electron's resources directory.
- **`@electron-forge/cli` & makers**:
  - Used for building and making distribution packages (ZIP, DEB, RPM, Squirrel).
- **`pytest` & `pytest-cov`**:
  - Use for Python test suites (unit, integration, CLI, and bridge tests in `tests/`).
- **`node:test`**:
  - Use for Electron security, bridge, and frontend verification tests in `tests/js/`.

---

## Architectural Principles
- **Isolation First:** Each installed MCP server receives its own independent virtual environment, configuration, models, data, output, and logs directory under `servers/<server-id>/`.
- **Local-First & Offline Capable:** All database and configuration files reside on the user's machine; no telemetry or remote database dependencies.
- **Standardized MCP Transports:** Default to stdio transport for local tool integration; support explicit user-initiated localhost HTTP/SSE endpoints with port conflict checks.
