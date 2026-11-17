// ─── AI Providers ────────────────────────────────────────────────────────────

export type ProviderStatus = "connected" | "disconnected" | "rate_limited" | "error";

export interface AIProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  status: ProviderStatus;
  models: string[];
  activeModel: string;
  lastUsed?: string;
  requestsToday: number;
  rateLimit?: number;
}

/** Brand accent gradients for provider marks */
export const providerBrands: Record<string, { from: string; to: string }> = {
  openai: { from: "#10a37f", to: "#0b7a5e" },
  anthropic: { from: "#d97757", to: "#b85c3e" },
  deepseek: { from: "#4d6bfe", to: "#3a4fd0" },
  qwen: { from: "#8b5cf6", to: "#6d3fd6" },
  kimi: { from: "#525866", to: "#2b2f38" },
};

export const providerPresets = [
  { id: "openai", name: "OpenAI", baseUrl: "https://api.openai.com/v1", models: "gpt-4o, gpt-4o-mini, gpt-4-turbo, o1-preview, o1-mini" },
  { id: "anthropic", name: "Anthropic", baseUrl: "https://api.anthropic.com/v1", models: "claude-4-sonnet, claude-4-opus, claude-3.5-haiku" },
  { id: "deepseek", name: "DeepSeek", baseUrl: "https://api.deepseek.com/v1", models: "deepseek-chat, deepseek-coder, deepseek-reasoner" },
  { id: "qwen", name: "Qwen (Alibaba)", baseUrl: "https://dashscope.aliyuncs.com/api/v1", models: "qwen-max, qwen-plus, qwen-turbo, qwen-long" },
  { id: "kimi", name: "Kimi (Moonshot)", baseUrl: "https://api.moonshot.cn/v1", models: "moonshot-v1-128k, moonshot-v1-32k, moonshot-v1-8k" },
  { id: "custom", name: "Custom / OpenAI-compatible", baseUrl: "", models: "" },
];

export const seedProviders: AIProvider[] = [
  {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    apiKey: "sk-proj-4f8a2b6c9d1e7f3a5b8c2d6e9f1a3xYz",
    status: "connected",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "o1-preview", "o1-mini"],
    activeModel: "gpt-4o",
    lastUsed: "2 min ago",
    requestsToday: 342,
    rateLimit: 10000,
  },
  {
    id: "anthropic",
    name: "Anthropic",
    baseUrl: "https://api.anthropic.com/v1",
    apiKey: "sk-ant-api03-7c2d9e4f1a8b3c6d5e2f9a4b7c1dQ7mN",
    status: "connected",
    models: ["claude-4-sonnet", "claude-4-opus", "claude-3.5-haiku"],
    activeModel: "claude-4-sonnet",
    lastUsed: "5 min ago",
    requestsToday: 128,
    rateLimit: 5000,
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    apiKey: "sk-9e3f7a1b5c8d2e6f4a9b3c7d1e5f8pLq",
    status: "connected",
    models: ["deepseek-chat", "deepseek-coder", "deepseek-reasoner"],
    activeModel: "deepseek-chat",
    lastUsed: "1 hr ago",
    requestsToday: 56,
    rateLimit: 1000,
  },
  {
    id: "qwen",
    name: "Qwen (Alibaba)",
    baseUrl: "https://dashscope.aliyuncs.com/api/v1",
    apiKey: "",
    status: "disconnected",
    models: ["qwen-max", "qwen-plus", "qwen-turbo", "qwen-long"],
    activeModel: "qwen-max",
    requestsToday: 0,
    rateLimit: 2000,
  },
  {
    id: "kimi",
    name: "Kimi (Moonshot)",
    baseUrl: "https://api.moonshot.cn/v1",
    apiKey: "sk-moon-2b6c9d3e7f1a5b8c4d2e6f9a1b3cH9nP",
    status: "rate_limited",
    models: ["moonshot-v1-128k", "moonshot-v1-32k", "moonshot-v1-8k"],
    activeModel: "moonshot-v1-128k",
    lastUsed: "30 min ago",
    requestsToday: 998,
    rateLimit: 1000,
  },
];

// ─── Proxy Server ────────────────────────────────────────────────────────────

export interface ProxyConfig {
  running: boolean;
  port: number;
  localApiKey: string;
  activeProvider: string;
  activeModel: string;
  fallbackEnabled: boolean;
  fallbackOrder: string[];
  totalRequests: number;
  startedAt: number | null;
}

export const endpointOf = (port: number) => `http://localhost:${port}/v1/chat/completions`;

export const seedProxy: ProxyConfig = {
  running: true,
  port: 8787,
  localApiKey: "sm-key-a1b2c3d4e5f6g7h8i9j0k1l2",
  activeProvider: "openai",
  activeModel: "gpt-4o",
  fallbackEnabled: true,
  fallbackOrder: ["openai", "anthropic", "deepseek"],
  totalRequests: 12847,
  startedAt: Date.now() - (3 * 24 * 60 + 14 * 60 + 22) * 60 * 1000,
};

// ─── MCP Server Types & Form Schemas ────────────────────────────────────────

export type FieldType = "text" | "password" | "email" | "number" | "select" | "toggle" | "textarea";

export interface FormField {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  options?: { label: string; value: string }[];
  defaultValue?: string | boolean | number;
}

export interface MCPServerType {
  id: string;
  name: string;
  description: string;
  category: string;
  language: "python" | "javascript";
  transport: "stdio" | "http";
  tags: string[];
  icon: string;
  toolNames: string[];
  formSchema: FormField[];
}

export const mcpServerTypes: MCPServerType[] = [
  {
    id: "smtp-mail",
    name: "SMTP Mail",
    description: "Send emails through any SMTP server with TLS support",
    category: "Communication",
    language: "python",
    transport: "stdio",
    tags: ["email", "smtp", "mail"],
    icon: "Mail",
    toolNames: ["send_email", "send_bulk", "verify_connection"],
    formSchema: [
      { key: "smtp_host", label: "SMTP Host", type: "text", placeholder: "smtp.gmail.com", required: true },
      { key: "smtp_port", label: "SMTP Port", type: "number", placeholder: "587", required: true, defaultValue: 587 },
      { key: "smtp_user", label: "Username / Email", type: "email", placeholder: "you@example.com", required: true },
      { key: "smtp_pass", label: "Password / App Password", type: "password", placeholder: "••••••••••••", required: true, helpText: "Use an app-specific password for Gmail" },
      { key: "use_tls", label: "Use TLS", type: "toggle", defaultValue: true },
      { key: "from_name", label: "From Name", type: "text", placeholder: "My App" },
    ],
  },
  {
    id: "linkedin-post",
    name: "LinkedIn Post",
    description: "Create, schedule and manage LinkedIn posts via the API",
    category: "Social",
    language: "python",
    transport: "stdio",
    tags: ["linkedin", "social", "api"],
    icon: "Linkedin",
    toolNames: ["create_post", "list_posts", "delete_post", "get_profile"],
    formSchema: [
      { key: "access_token", label: "LinkedIn API Token", type: "password", placeholder: "Enter your OAuth token", required: true, helpText: "Generate from LinkedIn Developer Portal → OAuth 2.0" },
      { key: "person_urn", label: "Person URN", type: "text", placeholder: "urn:li:person:xxxxx", required: true },
      { key: "visibility", label: "Default Visibility", type: "select", options: [{ label: "Public", value: "PUBLIC" }, { label: "Connections Only", value: "CONNECTIONS" }], defaultValue: "PUBLIC" },
    ],
  },
  {
    id: "github-ops",
    name: "GitHub Operations",
    description: "Manage repos, issues, pull requests and actions",
    category: "Development",
    language: "javascript",
    transport: "stdio",
    tags: ["github", "git", "repos"],
    icon: "Github",
    toolNames: ["list_repos", "create_issue", "list_issues", "create_pr", "merge_pr", "list_actions", "get_file", "push_file"],
    formSchema: [
      { key: "github_token", label: "GitHub Personal Access Token", type: "password", placeholder: "ghp_xxxxxxxxxxxx", required: true, helpText: "Needs repo, read:org, and workflow scopes" },
      { key: "default_owner", label: "Default Repository Owner", type: "text", placeholder: "username or org" },
      { key: "api_base", label: "API Base URL", type: "text", placeholder: "https://api.github.com", defaultValue: "https://api.github.com" },
    ],
  },
  {
    id: "slack-bot",
    name: "Slack Bot",
    description: "Send messages and manage Slack channels",
    category: "Communication",
    language: "javascript",
    transport: "stdio",
    tags: ["slack", "chat", "messaging"],
    icon: "MessageSquare",
    toolNames: ["send_message", "list_channels", "upload_file"],
    formSchema: [
      { key: "bot_token", label: "Bot Token", type: "password", placeholder: "xoxb-xxxxxxxxxxxx", required: true },
      { key: "default_channel", label: "Default Channel", type: "text", placeholder: "#general" },
      { key: "sign_as", label: "Sign messages as", type: "text", placeholder: "Soloman Bot" },
    ],
  },
  {
    id: "notion-db",
    name: "Notion Database",
    description: "Read and write Notion databases and pages",
    category: "Productivity",
    language: "javascript",
    transport: "stdio",
    tags: ["notion", "database", "notes"],
    icon: "FileText",
    toolNames: ["query_database", "create_page", "update_page", "append_blocks"],
    formSchema: [
      { key: "notion_token", label: "Notion Integration Token", type: "password", placeholder: "secret_xxxxxxxxxxxx", required: true, helpText: "Create at notion.so/my-integrations" },
      { key: "default_database_id", label: "Default Database ID", type: "text", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
    ],
  },
  {
    id: "web-scraper",
    name: "Web Scraper",
    description: "Extract structured data from web pages",
    category: "Data",
    language: "python",
    transport: "stdio",
    tags: ["scrape", "web", "extract"],
    icon: "Globe",
    toolNames: ["fetch_page", "extract_links", "extract_table", "screenshot"],
    formSchema: [
      { key: "max_pages", label: "Max Pages per Request", type: "number", placeholder: "10", defaultValue: 10 },
      { key: "respect_robots", label: "Respect robots.txt", type: "toggle", defaultValue: true },
      { key: "proxy_url", label: "Proxy URL (optional)", type: "text", placeholder: "http://proxy:8080" },
      { key: "user_agent", label: "User Agent", type: "text", placeholder: "SolomanScraper/1.0", defaultValue: "SolomanScraper/1.0" },
    ],
  },
  {
    id: "file-manager",
    name: "File Manager",
    description: "Secure file operations within sandboxed directories",
    category: "System",
    language: "python",
    transport: "stdio",
    tags: ["files", "read", "write"],
    icon: "Folder",
    toolNames: ["read_file", "write_file", "list_dir", "search_files", "delete_file"],
    formSchema: [
      { key: "allowed_dirs", label: "Allowed Directories", type: "textarea", placeholder: "/home/user/documents\n/home/user/projects", required: true, helpText: "One directory per line" },
      { key: "max_file_size", label: "Max File Size (MB)", type: "number", placeholder: "50", defaultValue: 50 },
      { key: "allow_write", label: "Allow Write Operations", type: "toggle", defaultValue: false },
      { key: "allow_delete", label: "Allow Delete Operations", type: "toggle", defaultValue: false },
    ],
  },
  {
    id: "discord-bot",
    name: "Discord Bot",
    description: "Send messages and manage Discord servers",
    category: "Communication",
    language: "javascript",
    transport: "stdio",
    tags: ["discord", "chat", "bot"],
    icon: "Hash",
    toolNames: ["send_message", "list_channels", "list_members"],
    formSchema: [
      { key: "bot_token", label: "Bot Token", type: "password", placeholder: "Enter Discord bot token", required: true },
      { key: "guild_id", label: "Default Server ID", type: "text", placeholder: "Guild / Server ID" },
      { key: "default_channel", label: "Default Channel ID", type: "text", placeholder: "Channel ID" },
    ],
  },
];

// ─── Installed MCP Servers ──────────────────────────────────────────────────

export type ServerStatus = "running" | "stopped" | "error";

export interface InstalledServer {
  id: string;
  typeId: string;
  name: string;
  status: ServerStatus;
  transport: "stdio" | "http";
  language: "python" | "javascript";
  tools: number;
  config: Record<string, string | boolean | number>;
  installedAt: string;
  lastActive?: string;
}

export const seedServers: InstalledServer[] = [
  {
    id: "smtp-mail-1",
    typeId: "smtp-mail",
    name: "Gmail SMTP",
    status: "running",
    transport: "stdio",
    language: "python",
    tools: 3,
    config: { smtp_host: "smtp.gmail.com", smtp_port: 587, smtp_user: "user@gmail.com", smtp_pass: "app-pass-xxxx", use_tls: true },
    installedAt: "2024-01-15",
    lastActive: "2 min ago",
  },
  {
    id: "github-ops-1",
    typeId: "github-ops",
    name: "GitHub — Personal",
    status: "running",
    transport: "stdio",
    language: "javascript",
    tools: 8,
    config: { github_token: "ghp_xxxxxxxxxxxxxxxxxxxx", default_owner: "kaleemibnanwar", api_base: "https://api.github.com" },
    installedAt: "2024-01-12",
    lastActive: "5 min ago",
  },
  {
    id: "linkedin-post-1",
    typeId: "linkedin-post",
    name: "LinkedIn — Work",
    status: "stopped",
    transport: "stdio",
    language: "python",
    tools: 4,
    config: { visibility: "PUBLIC" },
    installedAt: "2024-01-10",
  },
  {
    id: "file-manager-1",
    typeId: "file-manager",
    name: "File Manager — Projects",
    status: "running",
    transport: "stdio",
    language: "python",
    tools: 5,
    config: { allowed_dirs: "/home/user/projects", max_file_size: 50, allow_write: true, allow_delete: false },
    installedAt: "2024-01-08",
    lastActive: "10 min ago",
  },
  {
    id: "web-scraper-1",
    typeId: "web-scraper",
    name: "Web Scraper",
    status: "error",
    transport: "stdio",
    language: "python",
    tools: 4,
    config: { max_pages: 10, respect_robots: true },
    installedAt: "2024-01-05",
  },
];

// ─── App Settings ────────────────────────────────────────────────────────────

export interface AppSettings {
  dataDir: string;
  autoUpdate: boolean;
  notifications: boolean;
}

export const seedSettings: AppSettings = {
  dataDir: "~/.local/share/SolomanManager",
  autoUpdate: true,
  notifications: true,
};
