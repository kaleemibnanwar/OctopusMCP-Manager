import { useState, type ReactNode } from "react";
import { Terminal, Cpu, Globe, Code2, Bot, RefreshCw, Eye, RotateCcw, ChevronDown, Zap, Cable, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/store";
import { cliTools, buildToolConfig, type CliTool } from "@/data/cli-tools";
import { ProviderMark, CopyButton, PageIntro } from "@/components/ui/bits";
import { Modal } from "@/components/ui/Modal";

const toolIcons: Record<CliTool["icon"], LucideIcon> = {
  terminal: Terminal,
  cpu: Cpu,
  globe: Globe,
  code: Code2,
  bot: Bot,
};

function timeAgo(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function SelectBox({
  value,
  onChange,
  disabled,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border border-km-border bg-km-bg px-3 py-2 pr-8 font-mono text-[11.5px] text-km-text outline-none transition-colors hover:border-km-muted focus:border-km-dim disabled:opacity-50"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-km-faint" />
    </div>
  );
}

function ToolCard({ tool, onViewConfig }: { tool: CliTool; onViewConfig: (tool: CliTool) => void }) {
  const { providers, toolSyncs, syncViaProxy, syncTool, resetToolSync } = useStore();
  const [syncing, setSyncing] = useState(false);
  const sync = toolSyncs[tool.id];
  const provider = providers.find((p) => p.id === sync.providerId);
  const Icon = toolIcons[tool.icon];

  const run = async (providerId?: string, model?: string) => {
    setSyncing(true);
    await syncTool(tool.id, providerId, model);
    setSyncing(false);
  };

  return (
    <div className="flex flex-col rounded-2xl border border-km-border bg-km-panel p-4 transition-colors hover:border-km-muted/60">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-km-border bg-gradient-to-br from-km-raised to-km-panel">
            <Icon className="h-5 w-5 text-km-text" />
          </div>
          <div>
            <div className="text-sm font-semibold text-km-text">{tool.name}</div>
            {tool.detectedVersion ? (
              <span className="mt-0.5 inline-flex rounded-md bg-km-raised px-1.5 py-0.5 font-mono text-[10px] text-km-dim">
                {tool.detectedVersion}
              </span>
            ) : (
              <span className="mt-0.5 inline-flex rounded-md bg-km-raised px-1.5 py-0.5 text-[10px] text-km-faint">
                Not detected
              </span>
            )}
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
            sync.synced ? "bg-km-success/10 text-km-success" : "bg-km-warning/10 text-km-warning"
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", sync.synced ? "bg-km-success" : "bg-km-warning")} />
          {sync.synced ? "Synced" : "Not synced"}
        </span>
      </div>

      {/* Current base URL */}
      <div className="mt-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-km-faint">Current base URL</div>
        <div className="mt-1.5 truncate rounded-lg border border-dashed border-km-border bg-km-bg px-3 py-2 font-mono text-[11.5px] text-km-dim">
          {sync.syncedBaseUrl ?? "---"}
        </div>
      </div>

      {/* One-click provider + model */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-km-faint">Provider</div>
          <SelectBox value={sync.providerId} disabled={syncing} onChange={(v) => run(v)}>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </SelectBox>
        </div>
        <div>
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-km-faint">Model</div>
          <SelectBox value={sync.model} disabled={syncing || !provider} onChange={(v) => run(undefined, v)}>
            {(provider?.models ?? []).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </SelectBox>
        </div>
      </div>
      <p className="mt-2 text-[10.5px] leading-relaxed text-km-faint">
        Changing provider or model syncs instantly
        {syncViaProxy ? " — requests route through your local proxy." : " — the tool connects directly to the provider."}
        {sync.syncedAt && <span className="text-km-dim"> Last sync {timeAgo(sync.syncedAt)}.</span>}
      </p>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-1.5 border-t border-km-border pt-3">
        <button
          onClick={() => onViewConfig(tool)}
          title="View generated config"
          className="rounded-lg border border-km-border p-2 text-km-dim transition-colors hover:border-km-muted hover:text-km-text"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => resetToolSync(tool.id)}
          disabled={!sync.synced || syncing}
          title="Reset to tool defaults"
          className="rounded-lg border border-km-border p-2 text-km-dim transition-colors hover:border-km-muted hover:text-km-text disabled:opacity-30"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => run()}
          disabled={syncing}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
            sync.synced
              ? "border border-km-border text-km-dim hover:border-km-muted hover:text-km-text"
              : "bg-km-text text-km-bg shadow-lg shadow-black/30 hover:opacity-90",
            syncing && "opacity-60"
          )}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} />
          {syncing ? "Syncing…" : "Sync Config Now"}
        </button>
      </div>
    </div>
  );
}

export function CliSync() {
  const { providers, proxy, toolSyncs, syncViaProxy, setSyncRouting, syncAllTools } = useStore();
  const [viewing, setViewing] = useState<CliTool | null>(null);

  const syncedCount = Object.values(toolSyncs).filter((t) => t.synced).length;

  const viewSync = viewing ? toolSyncs[viewing.id] : null;
  const viewProvider = viewSync ? providers.find((p) => p.id === viewSync.providerId) : null;
  const configText =
    viewing && viewSync
      ? buildToolConfig(viewing.id, {
          baseUrl: syncViaProxy ? `http://localhost:${proxy.port}/v1` : viewProvider?.baseUrl ?? "",
          apiKey: syncViaProxy ? proxy.localApiKey : viewProvider?.apiKey ?? "",
          model: viewSync.model,
        })
      : "";

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 animate-fade-in">
      <PageIntro
        title="One-Click CLI Sync"
        description="Point every agentic CLI at any provider and model with a single click. Soloman writes the tool's config file for you — no manual env vars, no editing JSON."
        action={
          <button
            onClick={syncAllTools}
            className="flex items-center gap-2 rounded-xl bg-km-text px-4 py-2.5 text-xs font-semibold text-km-bg shadow-lg shadow-black/30 transition-opacity hover:opacity-90"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Sync all tools
          </button>
        }
      />

      {/* Routing mode */}
      <div className="studio-dots flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-km-border bg-km-panel px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl border border-km-border bg-km-bg p-1">
            <button
              onClick={() => setSyncRouting(true)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors",
                syncViaProxy ? "bg-km-raised text-km-text" : "text-km-dim hover:text-km-text"
              )}
            >
              <Zap className="h-3.5 w-3.5" /> Via local proxy
            </button>
            <button
              onClick={() => setSyncRouting(false)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors",
                !syncViaProxy ? "bg-km-raised text-km-text" : "text-km-dim hover:text-km-text"
              )}
            >
              <Cable className="h-3.5 w-3.5" /> Direct API
            </button>
          </div>
          <p className="hidden text-[11px] text-km-faint sm:block">
            {syncViaProxy
              ? `Tools use http://localhost:${proxy.port}/v1 + your local key — fallback & rate-limit protection included.`
              : "Tools use each provider's real endpoint and API key."}
          </p>
        </div>
        <span className="font-mono text-[11px] text-km-dim">
          {syncedCount}/{cliTools.length} synced
        </span>
      </div>

      {/* Tool cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cliTools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} onViewConfig={setViewing} />
        ))}
      </div>

      {/* Config preview */}
      <Modal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={viewing ? `${viewing.name} — generated config` : ""}
        subtitle={viewing?.configPath}
        wide
      >
        {viewing && viewSync && (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-km-dim">
              {viewProvider && <ProviderMark id={viewProvider.id} name={viewProvider.name} size="sm" />}
              <span>{viewProvider?.name ?? "Unknown provider"}</span>
              <span className="text-km-faint">·</span>
              <span className="font-mono">{viewSync.model}</span>
              <span className="text-km-faint">·</span>
              <span>{syncViaProxy ? "via local proxy" : "direct API"}</span>
              {!viewSync.synced && <span className="rounded-md bg-km-warning/10 px-1.5 py-0.5 text-km-warning">preview — not synced yet</span>}
            </div>
            <div className="overflow-hidden rounded-xl border border-km-border bg-km-bg">
              <div className="flex items-center justify-between border-b border-km-border px-3 py-2">
                <span className="font-mono text-[11px] text-km-faint">{viewing.configPath}</span>
                <CopyButton text={configText} label="Copy" />
              </div>
              <pre className="km-scroll overflow-x-auto whitespace-pre p-4 font-mono text-[11.5px] leading-relaxed text-km-dim">
                {configText}
              </pre>
            </div>
            <p className="mt-3 text-[11px] text-km-faint">
              Pressing <span className="text-km-dim">Sync Config Now</span> writes this file to disk. Restart the CLI session to pick up changes.
            </p>
          </>
        )}
      </Modal>
    </div>
  );
}
