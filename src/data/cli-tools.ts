// ─── Agentic CLI tools & one-click config sync ──────────────────────────────

export interface CliTool {
  id: string;
  name: string;
  icon: "terminal" | "cpu" | "globe" | "code" | "bot";
  configPath: string;
  detectedVersion: string | null;
}

export const cliTools: CliTool[] = [
  { id: "claude-code", name: "Claude Code", icon: "terminal", configPath: "~/.claude/settings.json", detectedVersion: "v2.1.312" },
  { id: "codex", name: "Codex CLI", icon: "cpu", configPath: "~/.codex/config.toml", detectedVersion: "v0.167.1" },
  { id: "gemini-cli", name: "Gemini CLI", icon: "globe", configPath: "~/.config/gemini/.env", detectedVersion: null },
  { id: "opencode", name: "OpenCode", icon: "code", configPath: "~/.config/opencode/opencode.json", detectedVersion: null },
  { id: "droid", name: "Droid (Factory)", icon: "bot", configPath: "~/.factory/settings.json", detectedVersion: null },
];

export interface ToolSyncState {
  providerId: string;
  model: string;
  synced: boolean;
  syncedAt: number | null;
  syncedBaseUrl: string | null;
}

export const seedToolSyncs: Record<string, ToolSyncState> = Object.fromEntries(
  cliTools.map((t) => [
    t.id,
    { providerId: "openai", model: "gpt-4o", synced: false, syncedAt: null, syncedBaseUrl: null },
  ])
);

export interface SyncTarget {
  baseUrl: string;
  apiKey: string;
  model: string;
}

/** Render the exact config file a sync writes for each tool. */
export function buildToolConfig(toolId: string, { baseUrl, apiKey, model }: SyncTarget): string {
  switch (toolId) {
    case "claude-code":
      return JSON.stringify(
        {
          env: {
            ANTHROPIC_BASE_URL: baseUrl,
            ANTHROPIC_AUTH_TOKEN: apiKey,
            ANTHROPIC_MODEL: model,
            ANTHROPIC_SMALL_FAST_MODEL: model,
          },
        },
        null,
        2
      );
    case "codex":
      return `model = "${model}"
model_provider = "soloman"

[model_providers.soloman]
name = "Soloman Manager"
base_url = "${baseUrl}"
env_key = "OPENAI_API_KEY"
wire_api = "chat"

# export OPENAI_API_KEY=${apiKey}`;
    case "gemini-cli":
      return `GEMINI_API_KEY=${apiKey}
GOOGLE_GEMINI_BASE_URL=${baseUrl}
GEMINI_MODEL=${model}`;
    case "opencode":
      return JSON.stringify(
        {
          $schema: "https://opencode.ai/config.json",
          provider: {
            soloman: {
              npm: "@ai-sdk/openai-compatible",
              name: "Soloman Manager",
              options: { baseURL: baseUrl, apiKey },
              models: { [model]: {} },
            },
          },
          model: `soloman/${model}`,
        },
        null,
        2
      );
    case "droid":
      return JSON.stringify(
        {
          customModels: [
            { model, baseUrl, apiKey, provider: "generic-chat-completion-api" },
          ],
        },
        null,
        2
      );
    default:
      return "";
  }
}
