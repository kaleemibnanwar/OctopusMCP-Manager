# OctopusMCP Manager

OctopusMCP is an Electron Forge desktop application backed by a private Python
sidecar process. It installs and runs MCP servers in separate Python
environments. Stdio is the default. Persistent HTTP is enabled per MCP only
when the user explicitly starts it.

## Current MVP

- Built-in catalog with OmniVoice MCP and the small Echo Lab test server.
- One versioned source checkout and virtual environment per MCP.
- Persistent models, data, output, configuration, and logs per installation.
- SQLite registry and activity log.
- Generic MCP client configuration generation.
- Electron desktop dashboard, CLI, and OctopusMCP's own stdio MCP server.
- Per-server localhost HTTP process supervision.
- Python MCP project generator.

## Development setup

```bash
cd "/home/kalim/octopusmcp manager"
python3 -m venv .venv
.venv/bin/python -m pip install -e '.[dev]'
npm install
npm start
```

The desktop UI is loaded directly from packaged files. It does not bind a web
port or run an HTTP server. Electron communicates with Python using JSON-line
messages over the child process's stdin and stdout.

Build an unpacked application or native installer with Electron Forge:

```bash
npm run package
npm run make
```

The build first freezes the Python sidecar with PyInstaller and includes it as
an Electron resource.

## Useful commands

```bash
octopusmcp catalog
octopusmcp install echo-lab
octopusmcp installed
octopusmcp connect echo-lab
octopusmcp http start echo-lab
octopusmcp http stop echo-lab
octopusmcp mcp
```

Set `OCTOPUSMCP_HOME` to override the managed data location. This is useful for
tests and portable development environments. The source repository is never
used for installed servers, downloaded models, generated output, or logs.

## Data isolation

Runtime data is stored under the operating system's application-data folder:

```text
OctopusMCP/
├── octopus.db
├── staging/
└── servers/
    └── <server-id>/
        ├── releases/<version>/{source,venv}/
        ├── config/
        ├── models/
        ├── data/
        ├── output/
        ├── logs/
        ├── runtime/
        └── backups/
```

Virtual environments isolate Python dependencies. They are not an operating
system security sandbox; catalog permissions still need to be reviewed before
installing third-party code.
