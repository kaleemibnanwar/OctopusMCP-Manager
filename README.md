<div align="center">

# 🐙 OctopusMCP Manager

### **The Control Center & Package Manager for Model Context Protocol (MCP) Servers**

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=for-the-badge)](https://opensource.org/licenses/Apache-2.0)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Electron](https://img.shields.io/badge/Electron-39+-47848F.svg?style=for-the-badge&logo=electron&logoColor=white)](https://electronjs.org)
[![MCP](https://img.shields.io/badge/MCP-v1.9+-8A2BE2.svg?style=for-the-badge)](https://modelcontextprotocol.io)
[![Platform](https://img.shields.io/badge/Platform-Linux%20|%20macOS%20|%20Windows-brightgreen.svg?style=for-the-badge)](https://github.com)
[![Status](https://img.shields.io/badge/Status-Production_Ready-success.svg?style=for-the-badge)](#)

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-why-octopusmcp">Why OctopusMCP?</a> •
  <a href="#-features">Features</a> •
  <a href="#-client-integrations">Client Configs</a> •
  <a href="#-cli-reference">CLI Reference</a> •
  <a href="#-meta-mcp-server">Meta-MCP</a> •
  <a href="#-architecture">Architecture</a>
</p>

```
  🐙 OctopusMCP Dashboard (Fluent UI) ─┐
  💻 Terminal CLI (`octopusmcp`)      ──┼──▶ 🔒 JSON-RPC Bridge ──▶ 🐍 Isolated Python Venvs
  🤖 Meta-MCP Server (`mcp.run`)      ─┘                               (Stdio & HTTP Supervised)
```

</div>

---

## 💡 What is OctopusMCP?

**OctopusMCP** is the unified runtime manager, package installer, and lifecycle controller for [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) tools.

Think of it as **"Docker Desktop + Homebrew for MCP Servers"**:
- 🛡️ **Zero Dependency Hell**: Every MCP server runs in its own isolated Python virtual environment with sandboxed storage, models, logs, and configs.
- ⚡ **Instant Client Configs**: 1-click JSON snippet generator for **Claude Desktop, Cursor, Claude Code, Zed, Windsurf, LibreChat, and Cline**.
- 🚀 **Dual Transport (Stdio + Supervised HTTP/SSE)**: Run servers with native high-speed stdio or spin up background HTTP microservices with automated port checking.
- 🖥️ **Desktop App + CLI + Meta-MCP**: Use the modern Fluent UI dashboard, power-user terminal CLI, or let your AI agent manage its own MCP toolset via the built-in OctopusMCP Meta-Server!

---

## ⚡ Quick Start

### 1. Prerequisites
- **Python >= 3.11**
- **Node.js >= 20** & **npm**

### 2. Clone & Run Desktop App

```bash
# Clone the repository
git clone https://github.com/yourusername/octopusmcp-manager.git
cd "octopusmcp manager"

# Setup Python backend virtual environment
python3 -m venv .venv
.venv/bin/python -m pip install -e '.[dev]'

# Install Electron dependencies & launch
npm install
npm start
```

### 3. Or Use Directly from Terminal (CLI)

Activate your virtual environment and manage MCP servers instantly:

```bash
# Browse the curated catalog
octopusmcp catalog

# Install an MCP server into an isolated sandbox
octopusmcp install echo-lab

# Inspect installed servers & status
octopusmcp installed

# Generate 1-click configuration for Claude / Cursor
octopusmcp connect echo-lab

# Start a background HTTP/SSE endpoint with port management
octopusmcp http start echo-lab --port 8765

# Stop the HTTP service
octopusmcp http stop echo-lab
```

---

## 🌟 Superpowers & Key Features

### 📦 1. Curated Catalog & 1-Click Installation
Install rich MCP tools like **OmniVoice** (Voice AI / Speech synthesis), **Echo Lab** (test suite), and custom community packages with zero global package collisions.

### 🛡️ 2. Absolute Isolation Architecture
Every installed MCP server gets a dedicated directory structure under your OS application directory:

```text
~/.local/share/OctopusMCP/          # (or %LOCALAPPDATA%/OctopusMCP on Windows)
├── octopus.db                     # SQLite registry & operational audit logs
├── staging/                       # Atomic installation sandbox
└── servers/
    └── <server-id>/
        ├── releases/<version>/
        │   ├── source/            # Isolated package code
        │   └── venv/              # Dedicated Python virtual environment
        ├── config/                # Environment variables & JSON settings
        ├── models/                # Local ML weights (Whisper, Kokoro, etc.)
        ├── data/                  # Local persistence & SQLite stores
        ├── output/                # Generated audio, charts, artifacts
        ├── logs/                  # Per-server execution logs
        └── runtime/               # Process state & HTTP lockfiles
```

### 🔌 3. Universal Client Integration Generator
Never handcraft brittle JSON configuration files again. OctopusMCP exports validated schemas for:
- 🟣 **Claude Desktop** (`claude_desktop_config.json`)
- ⚡ **Cursor IDE** (`Settings > MCP`)
- 🤖 **Claude Code CLI** (`claude mcp add`)
- 🪁 **Zed Editor**, **Windsurf**, **Cline**, **Roo Code**, and **LibreChat**

### 🌐 4. Process Supervision & Dual Transports
- **Default Stdio**: Zero-latency, spawned on-demand by host LLM clients.
- **Persistent HTTP / SSE**: Spin up long-running daemon servers with automatic `psutil` port discovery, health-checking, and graceful teardown.

### 🛠️ 5. Instant MCP Project Scaffolding
Need to build a brand-new MCP server?
```bash
octopusmcp generate my-custom-tool --description "Supercharged DB query MCP tool"
```
OctopusMCP creates a production-ready FastMCP project skeleton with dependencies, entrypoints, and packaging ready to test immediately.

---

## 🤖 Meta-MCP Server: Let AI Manage its Tools

OctopusMCP exposes its own **MCP Server** via `octopusmcp mcp`. Plug it into Claude or Cursor, and your AI assistant can dynamically discover, install, and start MCP servers on demand!

### Add OctopusMCP to Claude Desktop:

Add this to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "octopusmcp-manager": {
      "command": "/path/to/octopusmcp-manager/.venv/bin/octopusmcp",
      "args": ["mcp"]
    }
  }
}
```

### 🧰 Available Meta-Tools Exposed to AI:
| Tool Name | Description |
| :--- | :--- |
| `list_catalog_packages` | Discover all available servers ready to be installed |
| `list_installed_servers` | Query status, versions, ports, and runtimes of installed MCPs |
| `install_server` | Safe sandboxed installation with explicit user confirmation guard |
| `get_connection_config` | Fetch client config JSON for any installed tool |
| `start_http_server` | Spin up HTTP daemon for an installed MCP with dynamic port selection |
| `stop_http_server` | Safely terminate running HTTP MCP processes |
| `generate_mcp_project` | Scaffold brand-new Python MCP servers programmatically |

---

## 💻 CLI Reference Cheatsheet

```text
Usage: octopusmcp [OPTIONS] COMMAND [ARGS]...

  Install and manage isolated local MCP servers.

Commands:
  catalog    List available MCP servers in the catalog (--json for raw output)
  install    Install an MCP package into its own virtual environment
  installed  List all installed MCP servers and their current status
  connect    Print connection JSON config for Claude Desktop / Cursor
  remove     Uninstall a package (--purge-data to remove local weights/data)
  generate   Scaffold a new FastMCP server project
  http       Manage persistent HTTP background services (start / stop)
  mcp        Run the OctopusMCP Meta-Server over stdio
```

---

## 🔌 Client Connection Recipes

### Claude Desktop
```json
{
  "mcpServers": {
    "echo-lab": {
      "command": "/home/user/.local/share/OctopusMCP/servers/echo-lab/releases/0.1.0/venv/bin/python",
      "args": ["-m", "echo_lab"]
    }
  }
}
```

### Cursor IDE
Navigate to **Cursor Settings → MCP → Add New MCP Server**:
- **Name**: `echo-lab`
- **Type**: `command`
- **Command**: `~/.local/share/OctopusMCP/servers/echo-lab/releases/0.1.0/venv/bin/python -m echo_lab`

### HTTP Transport (Remote / Shared Agent)
```json
{
  "mcpServers": {
    "echo-lab-http": {
      "url": "http://127.0.0.1:8765/mcp"
    }
  }
}
```

---

## 🏗️ Architecture & Security Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      OctopusMCP Desktop Frontend                        │
│             (Frameless Fluent UI, Command Palette, Dark/Light)          │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ ContextBridge (IPC JSON-Lines)
┌────────────────────────────────────▼────────────────────────────────────┐
│                    Electron Main Supervisor (Node.js)                   │
│         - Process lifecycle, strict CSP, native window controls         │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Stdio JSON-RPC Bridge
┌────────────────────────────────────▼────────────────────────────────────┐
│                     Python Sidecar Engine (FastMCP)                     │
│  - Catalog Manager  - Environment Isolation Engine  - SQLite Registry   │
│  - Process Monitor  - Dynamic Port Broker          - Code Scaffolder    │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Spawns & Supervises
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                       ▼
┌───────────────────────────────┐               ┌───────────────────────────────┐
│       MCP Server #1           │               │       MCP Server #2           │
│  (Isolated Venv + Stdio)      │               │  (Supervised HTTP Daemon)     │
└───────────────────────────────┘               └───────────────────────────────┘
```

### Security & Privacy First
- **Zero Cloud Telemetry**: 100% offline-first; all configurations and data stay on your local disk.
- **Strict Chromium Sandbox**: Content Security Policy (`default-src 'self'`), context isolation enabled, node integration strictly disabled.
- **Confirmation Guards**: Mutating actions triggered via AI Meta-MCP require explicit confirmation flags (`confirm=true`).

---

## 📦 Building Distribution Packages

Package standalone native desktop binaries for Linux, Windows, and macOS:

```bash
# Freeze the Python sidecar backend with PyInstaller
npm run build:python

# Package Electron desktop application
npm run package

# Build native installers (.deb, .rpm, .zip, .exe)
npm run make
```

---

## 🧪 Testing Suite

OctopusMCP is tested across Python backend and Electron frontend layers:

```bash
# Run Python backend unit and integration tests
npm run test:python

# Run Electron security and preload bridge tests
npm run test
```

---

## 🤝 Contributing & Adding Catalog Packages

We love community contributions! To add a new server to the official catalog:
1. Create a manifest JSON under `catalog/packages/<your-server-id>.json`.
2. Define package metadata, required Python dependencies, entrypoint, and default environment variables.
3. Submit a Pull Request!

---

## 📄 License

Distributed under the **Apache 2.0 License**. See [LICENSE](LICENSE) for details.

<div align="center">
  <sub>Built with ❤️ for the AI & MCP Developer Ecosystem.</sub>
</div>
