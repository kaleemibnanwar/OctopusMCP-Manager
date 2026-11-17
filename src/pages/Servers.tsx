import { useState } from "react";
import { Link } from "react-router-dom";
import { Play, Square, Trash2, Settings2, Search, ChevronDown, ChevronUp, Plus, Server as ServerIcon, AlertTriangle, Wrench, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/store";
import { mcpServerTypes, type InstalledServer } from "@/data/mock-data";
import { StatusPill, TypeIcon, MonoChip, PageIntro, EmptyState } from "@/components/ui/bits";
import { ConfirmDialog } from "@/components/ui/Modal";
import { ConfigureServerModal } from "@/components/ServerModals";
import { ServerConnectModal } from "@/components/ServerConnectModal";
import { serverFolder } from "@/data/manager-mcp";

function ServerCard({
  server,
  onConfigure,
  onConnect,
  onDelete,
}: {
  server: InstalledServer;
  onConfigure: () => void;
  onConnect: () => void;
  onDelete: () => void;
}) {
  const { toggleServer, settings } = useStore();
  const [expanded, setExpanded] = useState(false);
  const type = mcpServerTypes.find((t) => t.id === server.typeId);
  const running = server.status === "running";

  return (
    <div className="overflow-hidden rounded-2xl border border-km-border bg-km-panel transition-colors hover:border-km-muted">
      <div className="flex items-center gap-3.5 p-4">
        <TypeIcon icon={type?.icon ?? "Terminal"} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-km-text">{server.name}</h3>
            <StatusPill status={server.status} pulse />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-km-faint">
            <span>{type?.name ?? server.typeId}</span>
            <span>·</span>
            <MonoChip>{server.language}</MonoChip>
            <MonoChip>{server.transport}</MonoChip>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Wrench className="h-3 w-3" /> {server.tools} tools
            </span>
            {server.lastActive && running && (
              <>
                <span>·</span>
                <span>active {server.lastActive}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleServer(server.id)}
            title={running ? "Stop" : "Start"}
            className={cn(
              "rounded-lg border p-2 transition-colors",
              running
                ? "border-km-border text-km-dim hover:border-km-warning/50 hover:text-km-warning"
                : "border-km-border text-km-dim hover:border-km-success/50 hover:text-km-success"
            )}
          >
            {running ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={onConnect}
            title="Launch command & agent config"
            className="rounded-lg border border-km-border p-2 text-km-dim transition-colors hover:border-km-muted hover:text-km-text"
          >
            <Terminal className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onConfigure}
            title="Configure"
            className="rounded-lg border border-km-border p-2 text-km-dim transition-colors hover:border-km-muted hover:text-km-text"
          >
            <Settings2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            title="Remove"
            className="rounded-lg border border-km-border p-2 text-km-dim transition-colors hover:border-km-error/50 hover:text-km-error"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {server.status === "error" && (
        <div className="mx-4 mb-3 flex items-center gap-2 rounded-lg border border-km-error/25 bg-km-error/5 px-3 py-2 text-[11px] text-km-error">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Server exited unexpectedly. Check the configuration, then press play to restart.
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between border-t border-km-border px-4 py-2 text-[11px] text-km-faint transition-colors hover:text-km-text"
      >
        <span>Tools & details</span>
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {expanded && (
        <div className="animate-fade-in border-t border-km-border bg-km-bg/40 p-4">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {(type?.toolNames ?? []).map((tool) => (
              <span key={tool} className="rounded-md border border-km-border bg-km-panel px-2 py-1 font-mono text-[11px] text-km-dim">
                {tool}
              </span>
            ))}
          </div>
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-km-border bg-km-panel px-3 py-1.5">
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-km-faint">Folder</span>
            <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-km-dim">
              {serverFolder(settings.dataDir, server.id)}
            </code>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
            <div>
              <span className="text-km-faint">Installed</span>
              <div className="mt-0.5 font-mono text-km-dim">{server.installedAt}</div>
            </div>
            <div>
              <span className="text-km-faint">Transport</span>
              <div className="mt-0.5 font-mono text-km-dim">{server.transport}</div>
            </div>
            <div>
              <span className="text-km-faint">Runtime</span>
              <div className="mt-0.5 font-mono text-km-dim">{server.language}</div>
            </div>
            <div>
              <span className="text-km-faint">Last active</span>
              <div className="mt-0.5 font-mono text-km-dim">{server.lastActive ?? "—"}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Servers() {
  const { servers, removeServer } = useStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "running" | "stopped" | "error">("all");
  const [configuring, setConfiguring] = useState<InstalledServer | null>(null);
  const [connecting, setConnecting] = useState<InstalledServer | null>(null);
  const [deleting, setDeleting] = useState<InstalledServer | null>(null);

  const filtered = servers.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch = s.name.toLowerCase().includes(q) || s.typeId.toLowerCase().includes(q);
    return matchesSearch && (filter === "all" || s.status === filter);
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 animate-fade-in">
      <PageIntro
        title="MCP Servers"
        description="Local stdio MCP servers that give your agents tools. Each instance is isolated with its own credentials and configuration."
        action={
          <Link
            to="/catalog"
            className="flex items-center gap-1.5 rounded-xl bg-km-text px-4 py-2.5 text-xs font-semibold text-km-bg shadow-lg shadow-black/30 transition-opacity hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> New server
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-km-faint" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search servers…"
            className="w-full rounded-xl border border-km-border bg-km-panel py-2.5 pl-9 pr-3 text-sm text-km-text placeholder:text-km-faint focus:border-km-muted focus:outline-none"
          />
        </div>
        <div className="flex rounded-xl border border-km-border bg-km-panel p-1">
          {(["all", "running", "stopped", "error"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                filter === f ? "bg-km-raised text-km-text" : "text-km-dim hover:text-km-text"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ServerIcon}
          title={servers.length === 0 ? "No servers installed" : "Nothing matches"}
          hint={servers.length === 0 ? "Browse the catalog to install your first MCP server" : "Try a different search or filter"}
          action={
            servers.length === 0 ? (
              <Link to="/catalog" className="rounded-xl bg-km-text px-4 py-2 text-xs font-semibold text-km-bg">
                Browse catalog
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <ServerCard
              key={s.id}
              server={s}
              onConfigure={() => setConfiguring(s)}
              onConnect={() => setConnecting(s)}
              onDelete={() => setDeleting(s)}
            />
          ))}
        </div>
      )}

      <ConfigureServerModal server={configuring} open={configuring !== null} onClose={() => setConfiguring(null)} />
      <ServerConnectModal server={connecting} open={connecting !== null} onClose={() => setConnecting(null)} />
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && removeServer(deleting.id)}
        title="Remove server"
        message={`Remove ${deleting?.name}? Its isolated environment and configuration will be deleted.`}
        confirmLabel="Remove"
      />
    </div>
  );
}
