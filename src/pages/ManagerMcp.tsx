import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Hammer,
  Pencil,
  Trash2,
  Boxes,
  Shield,
  Terminal,
  Radio,
  ChevronDown,
  ChevronUp,
  Play,
  Search,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/store";
import { CopyButton, PageIntro, SecretValue } from "@/components/ui/bits";
import {
  managerMcpTools,
  buildCreationGuide,
  mcpConfigSchema,
  managerStdioCommand,
  managerHttpEndpoint,
  managerAgentConfig,
  extendedServersResult,
  type ManagerMcpTool,
} from "@/data/manager-mcp";

const toolIcons: Record<string, LucideIcon> = {
  mcp_creation_guide: BookOpen,
  mcp_creator: Hammer,
  mcp_modifier: Pencil,
  mcp_destroyer: Trash2,
  extended_mcp_servers: Boxes,
};

function CodeBlock({ label, text, copy = true }: { label: string; text: string; copy?: boolean }) {
  return (
    <div className="overflow-hidden rounded-xl border border-km-border bg-km-bg">
      <div className="flex items-center justify-between border-b border-km-border px-3 py-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-km-faint">{label}</span>
        {copy && <CopyButton text={text} />}
      </div>
      <pre className="km-scroll max-h-80 overflow-auto whitespace-pre p-3 font-mono text-[11px] leading-relaxed text-km-dim">
        {text}
      </pre>
    </div>
  );
}

function ToolCard({ tool }: { tool: ManagerMcpTool }) {
  const { servers, settings } = useStore();
  const [expanded, setExpanded] = useState(false);
  const [liveResult, setLiveResult] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const Icon = toolIcons[tool.name] ?? Terminal;

  const runLive = (q?: string) => {
    if (tool.name === "mcp_creation_guide") {
      setLiveResult(buildCreationGuide(settings.dataDir));
    } else if (tool.name === "extended_mcp_servers") {
      setLiveResult(JSON.stringify(extendedServersResult(servers, settings.dataDir, q ?? query), null, 2));
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-km-border bg-km-panel transition-colors hover:border-km-muted">
      <button onClick={() => setExpanded(!expanded)} className="flex w-full items-center gap-3.5 p-4 text-left">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-km-border bg-gradient-to-br from-km-raised to-km-panel">
          <Icon className="h-5 w-5 text-km-text" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[13px] font-semibold text-km-text">{tool.name}</span>
            {tool.live && (
              <span className="rounded-md bg-km-success/10 px-1.5 py-0.5 text-[10px] font-medium text-km-success">
                live preview
              </span>
            )}
          </div>
          <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-relaxed text-km-faint">{tool.description}</p>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 shrink-0 text-km-faint" /> : <ChevronDown className="h-4 w-4 shrink-0 text-km-faint" />}
      </button>

      {expanded && (
        <div className="animate-fade-in space-y-4 border-t border-km-border bg-km-bg/40 p-4">
          {/* Safety contract */}
          <div className="rounded-xl border border-km-success/20 bg-km-success/5 p-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-km-success">
              <Shield className="h-3 w-3" /> Safety contract
            </div>
            <ul className="space-y-1">
              {tool.safety.map((s) => (
                <li key={s} className="flex gap-2 text-[11px] leading-relaxed text-km-dim">
                  <span className="text-km-success">·</span> {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <CodeBlock label="Input schema" text={JSON.stringify(tool.inputSchema, null, 2)} />
            <CodeBlock label="Example result" text={JSON.stringify(tool.exampleResult, null, 2)} />
          </div>

          {tool.live && (
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => runLive()}
                  className="flex items-center gap-1.5 rounded-lg bg-km-text px-3 py-1.5 text-[11px] font-semibold text-km-bg transition-opacity hover:opacity-90"
                >
                  <Play className="h-3 w-3" /> Run against this workspace
                </button>
                {tool.name === "extended_mcp_servers" && (
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-km-faint" />
                    <input
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        if (liveResult) runLive(e.target.value);
                      }}
                      placeholder="query filter…"
                      className="w-44 rounded-lg border border-km-border bg-km-bg py-1.5 pl-7 pr-2 font-mono text-[11px] text-km-text placeholder:text-km-faint focus:border-km-muted focus:outline-none"
                    />
                  </div>
                )}
                {tool.name === "extended_mcp_servers" && (
                  <Link to="/servers" className="text-[11px] text-km-dim underline-offset-2 hover:text-km-text hover:underline">
                    Per-server command view →
                  </Link>
                )}
              </div>
              {liveResult && <CodeBlock label="Live result" text={liveResult} />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ManagerMcp() {
  const { proxy, settings, managerMcpEnabled, setManagerMcpEnabled } = useStore();
  const [mode, setMode] = useState<"stdio" | "http">("stdio");
  const [showGuide, setShowGuide] = useState(false);
  const [showSchema, setShowSchema] = useState(false);

  const guide = buildCreationGuide(settings.dataDir);
  const agentConfig = managerAgentConfig(proxy.port, proxy.localApiKey, mode);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 animate-fade-in">
      <PageIntro
        title="Manager MCP"
        description="Soloman exposes its own MCP server. Any agent that connects gets the creation guide plus tools to create, modify, test and destroy MCP servers safely — and to discover extended servers it doesn't have yet."
        action={
          <button
            onClick={() => setManagerMcpEnabled(!managerMcpEnabled)}
            className={cn(
              "flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-colors",
              managerMcpEnabled
                ? "border-km-success/30 bg-km-success/10 text-km-success"
                : "border-km-border bg-km-panel text-km-dim hover:text-km-text"
            )}
          >
            <span className={cn("relative h-4 w-7 rounded-full transition-colors", managerMcpEnabled ? "bg-km-success/40" : "bg-km-raised")}>
              <span
                className={cn(
                  "absolute top-0.5 h-3 w-3 rounded-full bg-km-text transition-all",
                  managerMcpEnabled ? "left-3.5" : "left-0.5"
                )}
              />
            </span>
            {managerMcpEnabled ? "Enabled" : "Disabled"}
          </button>
        }
      />

      {!managerMcpEnabled && (
        <div className="rounded-xl border border-km-warning/25 bg-km-warning/5 px-4 py-3 text-[12px] text-km-warning">
          Manager MCP is disabled — agent connections are refused. Existing servers keep running untouched.
        </div>
      )}

      {/* Connection */}
      <div className="studio-dots rounded-2xl border border-km-border bg-km-panel p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-km-faint">Connect an agent</span>
          <div className="flex rounded-lg border border-km-border bg-km-bg p-0.5">
            {(["stdio", "http"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-medium transition-colors",
                  mode === m ? "bg-km-raised text-km-text" : "text-km-dim hover:text-km-text"
                )}
              >
                {m === "stdio" ? <Terminal className="h-3 w-3" /> : <Radio className="h-3 w-3" />}
                {m.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {mode === "stdio" ? (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-km-border bg-km-bg px-3 py-2">
            <Terminal className="h-3.5 w-3.5 shrink-0 text-km-faint" />
            <code className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-km-text">{managerStdioCommand}</code>
            <CopyButton text={managerStdioCommand} label="Copy" />
          </div>
        ) : (
          <div className="mb-3 grid gap-2 sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-lg border border-km-border bg-km-bg px-3 py-2">
              <Radio className="h-3.5 w-3.5 shrink-0 text-km-faint" />
              <code className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-km-text">
                {managerHttpEndpoint(proxy.port)}
              </code>
              <CopyButton text={managerHttpEndpoint(proxy.port)} />
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-km-border bg-km-bg px-3 py-1.5">
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-km-faint">Key</span>
              <SecretValue value={proxy.localApiKey} className="flex-1" />
            </div>
          </div>
        )}

        <CodeBlock label="Agent config — paste into mcpServers" text={agentConfig} />
      </div>

      {/* Tools */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-km-text">Tools exposed to agents</h2>
          <span className="font-mono text-[11px] text-km-faint">{managerMcpTools.length} tools</span>
        </div>
        <div className="space-y-3">
          {managerMcpTools.map((tool) => (
            <ToolCard key={tool.name} tool={tool} />
          ))}
        </div>
      </div>

      {/* Guide */}
      <div className="overflow-hidden rounded-2xl border border-km-border bg-km-panel">
        <div
          onClick={() => setShowGuide(!showGuide)}
          className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left"
        >
          <div className="flex items-center gap-2.5">
            <BookOpen className="h-4 w-4 text-km-dim" />
            <div>
              <div className="text-sm font-semibold text-km-text">MCP Creation Guide</div>
              <div className="text-[11px] text-km-faint">
                Served by mcp_creation_guide — folder layout, isolated environments, stdio testing, safe registration
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <CopyButton text={guide} label="Copy" />
            {showGuide ? <ChevronUp className="h-4 w-4 text-km-faint" /> : <ChevronDown className="h-4 w-4 text-km-faint" />}
          </div>
        </div>
        {showGuide && (
          <pre className="km-scroll animate-fade-in max-h-[480px] overflow-auto whitespace-pre-wrap border-t border-km-border bg-km-bg/60 p-4 font-mono text-[11.5px] leading-relaxed text-km-dim">
            {guide}
          </pre>
        )}
      </div>

      {/* Configuration schema */}
      <div className="overflow-hidden rounded-2xl border border-km-border bg-km-panel">
        <div
          onClick={() => setShowSchema(!showSchema)}
          className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left"
        >
          <div className="flex items-center gap-2.5">
            <Shield className="h-4 w-4 text-km-dim" />
            <div>
              <div className="text-sm font-semibold text-km-text">MCP configuration schema</div>
              <div className="text-[11px] text-km-faint">
                JSON Schema agents follow when creating a server — the manager renders its config UI from it
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <CopyButton text={JSON.stringify(mcpConfigSchema, null, 2)} label="Copy" />
            {showSchema ? <ChevronUp className="h-4 w-4 text-km-faint" /> : <ChevronDown className="h-4 w-4 text-km-faint" />}
          </div>
        </div>
        {showSchema && (
          <pre className="km-scroll animate-fade-in max-h-[480px] overflow-auto whitespace-pre border-t border-km-border bg-km-bg/60 p-4 font-mono text-[11.5px] leading-relaxed text-km-dim">
            {JSON.stringify(mcpConfigSchema, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}