import { Link } from "react-router-dom";
import { Brain, Radio, Server, Wrench, ArrowRight, Plus, Download, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore, useStats, proxyEndpoint } from "@/store/store";
import { mcpServerTypes } from "@/data/mock-data";
import { ProviderMark, StatusPill, TypeIcon, CopyButton, MonoChip } from "@/components/ui/bits";

function StatCard({ icon: Icon, label, value, sub, to }: { icon: React.ElementType; label: string; value: string | number; sub: string; to: string }) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-km-border bg-km-panel p-4 transition-all hover:border-km-muted hover:shadow-lg hover:shadow-black/20"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-km-border bg-gradient-to-br from-km-raised to-km-panel">
          <Icon className="h-4 w-4 text-km-text" />
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-km-faint opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-km-text">{value}</div>
      <div className="mt-0.5 text-xs text-km-dim">{label}</div>
      <div className="text-[10px] text-km-faint">{sub}</div>
    </Link>
  );
}

export function Overview() {
  const { providers, servers, proxy } = useStore();
  const stats = useStats();
  const active = providers.find((p) => p.id === proxy.activeProvider);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 animate-fade-in">
      {/* Routing pipeline hero */}
      <div className="studio-dots relative overflow-hidden rounded-2xl border border-km-border bg-km-panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-km-text">One endpoint. Every model. All your tools.</h2>
            <p className="mt-1 text-xs text-km-dim">
              {stats.connectedProviders} providers connected · {stats.runningServers} MCP servers running · {stats.totalTools} tools available
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/models" className="flex items-center gap-1.5 rounded-xl bg-km-text px-3.5 py-2 text-xs font-semibold text-km-bg shadow-lg shadow-black/30 transition-opacity hover:opacity-90">
              <Plus className="h-3.5 w-3.5" /> Provider
            </Link>
            <Link to="/catalog" className="flex items-center gap-1.5 rounded-xl border border-km-border bg-km-panel px-3.5 py-2 text-xs font-medium text-km-dim transition-colors hover:border-km-muted hover:text-km-text">
              <Download className="h-3.5 w-3.5" /> Install server
            </Link>
          </div>
        </div>

        {/* Pipeline */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {active ? (
            <div className="flex items-center gap-2.5 rounded-xl border border-km-border bg-km-bg/70 px-3.5 py-2.5">
              <ProviderMark id={active.id} name={active.name} size="sm" />
              <div>
                <div className="text-xs font-medium text-km-text">{active.name}</div>
                <div className="font-mono text-[10px] text-km-faint">{proxy.activeModel}</div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-km-border px-3.5 py-2.5 text-xs text-km-faint">No provider</div>
          )}
          <ChevronRight className="h-4 w-4 text-km-faint" />
          <div className={cn("flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5", proxy.running ? "border-km-success/25 bg-km-success/5" : "border-km-border bg-km-bg/70")}>
            <span className="relative flex h-2 w-2">
              {proxy.running && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-km-success opacity-60" />}
              <span className={cn("relative inline-flex h-2 w-2 rounded-full", proxy.running ? "bg-km-success" : "bg-km-muted")} />
            </span>
            <div>
              <div className="text-xs font-medium text-km-text">Local proxy</div>
              <div className="font-mono text-[10px] text-km-faint">:{proxy.port}</div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-km-faint" />
          <div className="rounded-xl border border-km-border bg-km-bg/70 px-3.5 py-2.5">
            <div className="text-xs font-medium text-km-text">Your agentic tools</div>
            <div className="text-[10px] text-km-faint">Cursor · Claude Code · custom agents</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <code className="hidden rounded-lg border border-km-border bg-km-bg px-3 py-2 font-mono text-[11px] text-km-dim lg:block">
              {proxyEndpoint(proxy.port)}
            </code>
            <CopyButton text={proxyEndpoint(proxy.port)} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Brain} label="AI providers" value={stats.connectedProviders} sub={`of ${stats.totalProviders} connected · ${stats.totalModels} models`} to="/models" />
        <StatCard icon={Radio} label="Requests routed" value={stats.proxyRequests.toLocaleString()} sub={stats.proxyRunning ? "proxy is live" : "proxy stopped"} to="/proxy" />
        <StatCard icon={Server} label="MCP servers" value={stats.runningServers} sub={`of ${stats.totalServers} running${stats.errorServers ? ` · ${stats.errorServers} error` : ""}`} to="/servers" />
        <StatCard icon={Wrench} label="Agent tools" value={stats.totalTools} sub={`across ${stats.totalServers} servers`} to="/servers" />
      </div>

      {/* Two columns */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-km-text">Providers</h2>
            <Link to="/models" className="flex items-center gap-1 text-xs text-km-dim transition-colors hover:text-km-text">
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {providers.slice(0, 5).map((p) => {
              const usage = p.rateLimit ? Math.min(Math.round((p.requestsToday / p.rateLimit) * 100), 100) : 0;
              return (
                <Link key={p.id} to="/models" className="flex items-center gap-3 rounded-xl border border-km-border bg-km-panel p-3 transition-colors hover:border-km-muted">
                  <ProviderMark id={p.id} name={p.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm text-km-text">{p.name}</span>
                      {proxy.activeProvider === p.id && (
                        <span className="rounded bg-km-text px-1.5 py-px text-[9px] font-bold uppercase text-km-bg">Primary</span>
                      )}
                    </div>
                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-km-raised">
                      <div
                        className={cn("h-full rounded-full", usage > 90 ? "bg-km-error" : usage > 70 ? "bg-km-warning" : "bg-km-success")}
                        style={{ width: `${usage}%` }}
                      />
                    </div>
                  </div>
                  <MonoChip>{p.activeModel}</MonoChip>
                  <StatusPill status={p.status} />
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-km-text">MCP servers</h2>
            <Link to="/servers" className="flex items-center gap-1 text-xs text-km-dim transition-colors hover:text-km-text">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {servers.slice(0, 5).map((s) => {
              const type = mcpServerTypes.find((t) => t.id === s.typeId);
              return (
                <Link key={s.id} to="/servers" className="flex items-center gap-3 rounded-xl border border-km-border bg-km-panel p-3 transition-colors hover:border-km-muted">
                  <TypeIcon icon={type?.icon ?? "Terminal"} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-km-text">{s.name}</div>
                    <div className="text-[10px] text-km-faint">
                      {s.language} · {s.tools} tools
                    </div>
                  </div>
                  <MonoChip>{s.transport}</MonoChip>
                  <StatusPill status={s.status} />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
