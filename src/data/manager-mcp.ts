import type { InstalledServer } from "@/data/mock-data";

// ─── Soloman Manager's own MCP server ────────────────────────────────────────
// Agents connect to this MCP to create, modify, test and destroy MCP servers
// managed by Soloman — and to discover extended servers they don't have yet.

export interface ManagerMcpTool {
  name: string;
  title: string;
  description: string;
  safety: string[];
  inputSchema: Record<string, unknown>;
  exampleResult: Record<string, unknown>;
  /** Result can be computed live from the current workspace state */
  live?: boolean;
}

export const managerMcpTools: ManagerMcpTool[] = [
  {
    name: "mcp_creation_guide",
    title: "Creation Guide",
    description:
      "Returns the full guide any agent must follow before creating or touching MCP servers: folder layout, isolated environments, stdio testing and safe registration.",
    safety: ["Read-only — never changes workspace state"],
    inputSchema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: "Optional section to focus on: layout | environment | testing | registration | safety",
        },
      },
    },
    exampleResult: { content: [{ type: "text", text: "# Soloman Manager — MCP Creation Guide …" }] },
    live: true,
  },
  {
    name: "mcp_creator",
    title: "Create MCP",
    description:
      "Creates a new MCP server inside mcp_servers/<server_folder> with its own environment, files and model downloads. Runs a stdio smoke test (initialize + tools/list) and only registers it with the manager if the test returns tools.",
    safety: [
      "All files, venv/node_modules and model downloads stay inside the server's own folder",
      "Never touches other servers, the registry DB or manager settings",
      "Registration happens only after the stdio test passes — a failed build leaves zero trace in the registry",
    ],
    inputSchema: {
      type: "object",
      required: ["name", "language", "tools"],
      properties: {
        name: { type: "string", description: "Human-readable server name" },
        language: { type: "string", enum: ["python", "javascript"] },
        transport: { type: "string", enum: ["stdio", "http"], default: "stdio" },
        tools: {
          type: "array",
          description: "Tools the server exposes — fetched via tools/list after the test run",
          items: {
            type: "object",
            required: ["name", "description"],
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              input_schema: { type: "object", description: "JSON Schema for the tool's arguments" },
            },
          },
        },
        config_schema: { type: "object", description: "JSON Schema of user-facing configuration fields (credentials, options)" },
        dependencies: { type: "array", items: { type: "string" }, description: "pip / npm packages installed into the server's own environment" },
      },
    },
    exampleResult: {
      server_id: "weather-lookup-m3x8k2",
      folder: "<data_dir>/mcp_servers/weather-lookup-m3x8k2",
      environment: ".venv created in-folder · 2 dependencies installed",
      stdio_test: { initialize: "ok", tools_listed: ["get_weather", "get_forecast"], duration_ms: 840 },
      registered: true,
    },
  },
  {
    name: "mcp_modifier",
    title: "Modify MCP",
    description:
      "Modifies an existing managed server: config values, tools, dependencies or name. Takes a backup first, applies the patch inside the server's folder, re-runs the stdio test and auto-rolls back if anything fails.",
    safety: [
      "Backup snapshot written to <server_folder>/.backups/<timestamp> before any change",
      "Patch is applied in-place inside the server's own folder only",
      "Automatic rollback to the backup if the post-change stdio test fails — the running config never breaks",
    ],
    inputSchema: {
      type: "object",
      required: ["server_id", "patch"],
      properties: {
        server_id: { type: "string", description: "Id from extended_mcp_servers" },
        patch: {
          type: "object",
          properties: {
            name: { type: "string" },
            config: { type: "object", description: "Config keys to merge (validated against the server's config schema)" },
            tools: { type: "array", items: { type: "object" } },
            dependencies: { type: "array", items: { type: "string" } },
          },
        },
        dry_run: { type: "boolean", default: false, description: "Validate + test without persisting anything" },
      },
    },
    exampleResult: {
      server_id: "smtp-mail-1",
      backup: "<server_folder>/.backups/2025-11-17T04-40-12",
      applied: { config: { smtp_port: 465 } },
      stdio_test: { initialize: "ok", tools_listed: 3 },
      rolled_back: false,
    },
  },
  {
    name: "mcp_destroyer",
    title: "Destroy MCP",
    description:
      "Safely removes a managed server: stops the process, unregisters it, and archives its folder to mcp_servers/.trash instead of hard-deleting. Requires explicit confirmation.",
    safety: [
      "Refuses to run unless confirm = true",
      "Stops the server gracefully before touching anything",
      "Folder is moved to mcp_servers/.trash/<id>-<timestamp> — recoverable, never rm -rf",
      "Other servers, providers and proxy routing are never affected",
    ],
    inputSchema: {
      type: "object",
      required: ["server_id", "confirm"],
      properties: {
        server_id: { type: "string" },
        confirm: { type: "boolean", description: "Must be true — the tool rejects anything else" },
        keep_backup: { type: "boolean", default: true, description: "Archive the folder to .trash (recommended)" },
      },
    },
    exampleResult: {
      server_id: "web-scraper-1",
      stopped: true,
      unregistered: true,
      archived_to: "<data_dir>/mcp_servers/.trash/web-scraper-1-2025-11-17T04-42-03",
    },
  },
  {
    name: "extended_mcp_servers",
    title: "Extended Servers",
    description:
      "Lists every MCP server installed in the manager with its complete launch configuration — command, args, env and working directory. An agent missing a capability finds it here and configures it into its own MCP client, or the user configures it manually.",
    safety: ["Read-only discovery — configuration is applied by the agent or user, never silently"],
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Filter by name, tag or tool name" },
        include_config: { type: "boolean", default: true, description: "Include full command / args / env for each server" },
      },
    },
    exampleResult: {
      servers: [
        {
          id: "github-ops-1",
          name: "GitHub — Personal",
          tools: ["list_repos", "create_issue", "create_pr"],
          config: { command: "node", args: ["index.js"], env: { GITHUB_TOKEN: "ghp_…" }, cwd: "<data_dir>/mcp_servers/github-ops-1" },
        },
      ],
    },
    live: true,
  },
];

// ─── The guide every connected agent receives ────────────────────────────────

export function buildCreationGuide(dataDir: string): string {
  return `# Soloman Manager — MCP Creation Guide

Every agent connected to this MCP MUST follow this guide. It guarantees that
creating, modifying or destroying servers never breaks anything else.

## 1. Folder layout
Keep every MCP server inside the manager's user data folder:

    ${dataDir}/mcp_servers/<server_folder>/
    ├── server.py | index.js      # entrypoint
    ├── .venv/ | node_modules/    # its OWN environment, created in-folder
    ├── models/                   # any AI model downloads go here
    ├── config.json               # user configuration
    ├── .backups/                 # snapshots taken before every modify
    └── logs/                     # stdout/stderr of test runs

Never write outside <server_folder>. Never share environments between servers.

## 2. Environment
- Python: create a venv INSIDE the folder (.venv), install dependencies there.
- JavaScript: npm install INSIDE the folder (local node_modules).
- Model weights / downloads: store under <server_folder>/models, never in
  global caches.

## 3. Test via stdio before registering
Run the server as a subprocess and speak MCP over stdin/stdout:

    cd <server_folder>
    .venv/bin/python server.py        # or: node index.js

1. Send "initialize" → expect a valid handshake.
2. Send "tools/list" → expect the declared tools back.
3. Only if BOTH succeed, register the server with the manager.
A failed test must leave no registry entry — clean up or keep the folder
for debugging, but never register a broken server.

## 4. Registration
Register with the manager using the MCP configuration schema (see the
Manager MCP page). The manager then exposes the server through
extended_mcp_servers so other agents can discover and configure it.

## 5. Safety contract
- mcp_creator: builds + tests in isolation, registers only on success.
- mcp_modifier: backup → patch → re-test → auto-rollback on failure.
- mcp_destroyer: requires confirm=true, stops gracefully, archives the
  folder to mcp_servers/.trash (recoverable). Never hard-deletes.
- No tool ever touches other servers, providers, proxy routing or the
  manager's own settings.`;
}

// ─── MCP server configuration schema (used by mcp_creator / registration) ───

export const mcpConfigSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Soloman MCP Server Configuration",
  type: "object",
  required: ["id", "name", "language", "transport", "command", "args"],
  properties: {
    id: { type: "string", description: "Unique folder-safe id — also the folder name under mcp_servers/" },
    name: { type: "string" },
    language: { type: "string", enum: ["python", "javascript"] },
    transport: { type: "string", enum: ["stdio", "http"], default: "stdio" },
    command: { type: "string", description: "Executable, resolved inside the server folder (e.g. .venv/bin/python)" },
    args: { type: "array", items: { type: "string" } },
    env: { type: "object", additionalProperties: { type: "string" }, description: "Environment variables passed to the process" },
    cwd: { type: "string", description: "Always <data_dir>/mcp_servers/<id>" },
    config_schema: { type: "object", description: "JSON Schema of user-facing fields rendered by the manager UI" },
    tools: { type: "array", items: { type: "object" }, description: "Fetched via tools/list after a successful stdio test" },
  },
};

// ─── Per-server launch configuration (the "easy configure" view) ─────────────

export interface ServerLaunch {
  dir: string;
  command: string;
  args: string[];
  env: Record<string, string>;
  fullCommand: string;
  agentConfig: string;
}

export function serverFolder(dataDir: string, serverId: string): string {
  return `${dataDir}/mcp_servers/${serverId}`;
}

export function buildServerLaunch(server: InstalledServer, dataDir: string): ServerLaunch {
  const dir = serverFolder(dataDir, server.id);
  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(server.config)) env[k.toUpperCase()] = String(v);
  const command = server.language === "python" ? `${dir}/.venv/bin/python` : "node";
  const args = [server.language === "python" ? "server.py" : "index.js"];
  const envPrefix = Object.entries(env)
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ");
  const fullCommand = `cd "${dir}" && ${envPrefix ? envPrefix + " " : ""}${command} ${args.join(" ")}`;
  const agentConfig = JSON.stringify(
    { mcpServers: { [server.id]: { command, args, env, cwd: dir } } },
    null,
    2
  );
  return { dir, command, args, env, fullCommand, agentConfig };
}

/** Live result of the extended_mcp_servers tool, computed from the workspace */
export function extendedServersResult(servers: InstalledServer[], dataDir: string, query?: string) {
  const q = query?.trim().toLowerCase();
  const matched = q
    ? servers.filter((s) => s.name.toLowerCase().includes(q) || s.id.includes(q) || s.typeId.includes(q))
    : servers;
  return {
    count: matched.length,
    servers: matched.map((s) => {
      const launch = buildServerLaunch(s, dataDir);
      return {
        id: s.id,
        name: s.name,
        status: s.status,
        transport: s.transport,
        config: { command: launch.command, args: launch.args, env: launch.env, cwd: launch.dir },
      };
    }),
  };
}

// ─── Manager MCP connection snippets ─────────────────────────────────────────

export const managerStdioCommand = "soloman-manager mcp serve";

export function managerHttpEndpoint(proxyPort: number): string {
  return `http://localhost:${proxyPort}/mcp`;
}

export function managerAgentConfig(proxyPort: number, localApiKey: string, mode: "stdio" | "http"): string {
  return JSON.stringify(
    {
      mcpServers: {
        "soloman-manager":
          mode === "stdio"
            ? { command: "soloman-manager", args: ["mcp", "serve"] }
            : { url: managerHttpEndpoint(proxyPort), headers: { Authorization: `Bearer ${localApiKey}` } },
      },
    },
    null,
    2
  );
}