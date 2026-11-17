import { useEffect, useState } from "react";
import { Play, Square, Shield, Zap, Activity, Clock, RefreshCw, ArrowUp, ArrowDown, X, Plus, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore, formatUptime, proxyEndpoint } from "@/store/store";
import { ProviderMark, CopyButton, PageIntro } from "@/components/ui/bits";

// ─── Code snippets ───────────────────────────────────────────────────────────

function Snippets({ endpoint, apiKey, model }: { endpoint: string; apiKey: string; model: string }) {
  const [tab, setTab] = useState<"curl" | "python" | "env">("curl");

  const snippets = {
    curl: `curl ${endpoint} \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"model": "${model}", "messages": [{"role": "user", "content": "Hello"}]}'`,
    python: `from openai import OpenAI

client = OpenAI(
    base_url="${endpoint.replace("/chat/completions", "")}",
    api_key="${apiKey}",
)

resp = client.chat.completions.create(
    model="${model}",
    messages=[{"role": "user", "content": "Hello"}],
)`,
    env: `# Cursor / Claude Code / any OpenAI-compatible tool
OPENAI_BASE_URL=${endpoint.replace("/chat/completions", "")}
OPENAI_API_KEY=${apiKey}
MODEL=${model}`,
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-km-border bg-km-panel">
      <div className="flex items-center justify-between border-b border-km-border px-4 py-2.5">
        <div className="flex gap-1">
          {(["curl", "python", "env"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-md px-3 py-1 font-mono text-[11px] transition-colors",
                tab === t ? "bg-km-raised text-km-text" : "text-km-dim hover:text-km-text"
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <CopyButton text={snippets[tab]} label="Copy" />
      </div>
      <pre className="km-scroll overflow-x-auto whitespace-pre p-4 font-mono text-[11.5px] leading-relaxed text-km-dim">
        {snippets[tab]}
      </pre>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function Proxy() {
  const { proxy, providers, updateProxy, toggleProxy, regenerateKey, toast } = useStore();
  const [, tick] = useState(0);
  const [addingFallback, setAddingFallback] = useState(false);

  // Live uptime ticker
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const endpoint = proxyEndpoint(proxy.port);
  const active = providers.find((p) => p.id === proxy.activeProvider);
  const fallbackCandidates = providers.filter((p) => !proxy.fallbackOrder.includes(p.id));

  const move = (id: string, dir: -1 | 1) => {
    const order = [...proxy.fallbackOrder];
    const i = order.indexOf(id);
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    updateProxy({ fallbackOrder: order, activeProvider: order[0], activeModel: providers.find((p) => p.id === order[0])?.activeModel ?? proxy.activeModel });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 animate-fade-in">
      <PageIntro
        title="Local Proxy"
        description="One OpenAI-compatible endpoint for all your providers. Point every agentic tool here — switch models and providers without reconfiguring anything."
      />

      {/* Hero: endpoint + power */}
      <div className="studio-dots relative overflow-hidden rounded-2xl border border-km-border bg-km-panel p-6">
        <div
          className={cn(
            "pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full blur-3xl transition-opacity duration-700",
            proxy.running ? "bg-km-success/10 opacity-100" : "opacity-0"
          )}
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                {proxy.running && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-km-success opacity-60" />}
                <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", proxy.running ? "bg-km-success" : "bg-km-muted")} />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-km-faint">
                {proxy.running ? "Listening" : "Offline"}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <code className="min-w-0 truncate rounded-xl border border-km-border bg-km-bg px-4 py-2.5 font-mono text-sm text-km-text">
                {endpoint}
              </code>
              <CopyButton text={endpoint} />
            </div>
            <p className="mt-2 text-[11px] text-km-faint">
              Drop-in replacement for <span className="font-mono">api.openai.com</span> — works with Cursor, Claude Code, LangChain and more.
            </p>
          </div>
          <button
            onClick={toggleProxy}
            className={cn(
              "flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all",
              proxy.running
                ? "border border-km-border text-km-dim hover:border-km-error/50 hover:text-km-error"
                : "bg-km-text text-km-bg shadow-lg shadow-black/30 hover:opacity-90"
            )}
          >
            {proxy.running ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {proxy.running ? "Stop proxy" : "Start proxy"}
          </button>
        </div>

        {/* Key + stats strip */}
        <div className="relative mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-km-border bg-km-bg/70 p-3.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-km-faint">
                <Shield className="h-3 w-3" /> Local API key
              </span>
              <button onClick={regenerateKey} title="Regenerate key" className="rounded p-1 text-km-faint transition-colors hover:text-km-text">
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-km-text">{proxy.localApiKey}</code>
              <CopyButton text={proxy.localApiKey} />
            </div>
          </div>
          <div className="rounded-xl border border-km-border bg-km-bg/70 p-3.5">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-km-faint">
              <Activity className="h-3 w-3" /> Requests routed
            </span>
            <div className="mt-1.5 font-mono text-xl font-semibold tabular-nums text-km-text">
              {proxy.totalRequests.toLocaleString()}
            </div>
          </div>
          <div className="rounded-xl border border-km-border bg-km-bg/70 p-3.5">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-km-faint">
              <Clock className="h-3 w-3" /> Uptime
            </span>
            <div className="mt-1.5 font-mono text-xl font-semibold text-km-text">{formatUptime(proxy.startedAt)}</div>
          </div>
          <div className="rounded-xl border border-km-border bg-km-bg/70 p-3.5">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-km-faint">
              <Zap className="h-3 w-3" /> Port
            </span>
            <input
              type="number"
              value={proxy.port}
              onChange={(e) => {
                const port = Number(e.target.value);
                if (port > 0 && port < 65536) updateProxy({ port });
              }}
              className="mt-1 w-24 border-none bg-transparent font-mono text-xl font-semibold text-km-text focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Routing */}
      <div className="rounded-2xl border border-km-border bg-km-panel p-5">
        <h3 className="text-sm font-semibold text-km-text">Active route</h3>
        <p className="mt-0.5 text-xs text-km-dim">Requests hitting the proxy are forwarded to this provider and model.</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {active && <ProviderMark id={active.id} name={active.name} />}
          <select
            value={proxy.activeProvider}
            onChange={(e) => {
              const p = providers.find((x) => x.id === e.target.value);
              if (p) {
                updateProxy({ activeProvider: p.id, activeModel: p.activeModel });
                toast(`Routing via ${p.name}`);
              }
            }}
            className="rounded-lg border border-km-border bg-km-bg px-3 py-2 text-sm text-km-text focus:border-km-muted focus:outline-none"
          >
            {providers.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <ChevronRight className="h-4 w-4 text-km-faint" />
          <select
            value={proxy.activeModel}
            onChange={(e) => updateProxy({ activeModel: e.target.value })}
            className="rounded-lg border border-km-border bg-km-bg px-3 py-2 font-mono text-xs text-km-text focus:border-km-muted focus:outline-none"
          >
            {(active?.models ?? []).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <ChevronRight className="h-4 w-4 text-km-faint" />
          <div className="rounded-lg border border-km-border bg-km-bg px-3 py-2 text-xs text-km-dim">
            Your tools <span className="ml-1 font-mono text-km-text">:{proxy.port}</span>
          </div>
        </div>
      </div>

      {/* Fallback chain */}
      <div className="rounded-2xl border border-km-border bg-km-panel p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-km-text">Fallback chain</h3>
            <p className="mt-0.5 text-xs text-km-dim">When a provider hits its limit, requests automatically route to the next one.</p>
          </div>
          <button
            onClick={() => updateProxy({ fallbackEnabled: !proxy.fallbackEnabled })}
            className={cn("relative h-5 w-9 rounded-full transition-colors", proxy.fallbackEnabled ? "bg-km-text" : "bg-km-raised")}
          >
            <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-km-bg transition-transform", proxy.fallbackEnabled ? "translate-x-4" : "translate-x-0.5")} />
          </button>
        </div>

        {proxy.fallbackEnabled && (
          <div className="mt-4 space-y-2">
            {proxy.fallbackOrder.map((id, i) => {
              const p = providers.find((x) => x.id === id);
              if (!p) return null;
              return (
                <div key={id} className="flex items-center gap-3 rounded-xl border border-km-border bg-km-bg/60 px-3.5 py-2.5">
                  <span className="w-5 text-center font-mono text-xs text-km-faint">{i + 1}</span>
                  <ProviderMark id={p.id} name={p.name} size="sm" />
                  <span className="text-sm text-km-text">{p.name}</span>
                  <span className="font-mono text-[11px] text-km-faint">{p.activeModel}</span>
                  {i === 0 && (
                    <span className="rounded bg-km-text px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-km-bg">Primary</span>
                  )}
                  <div className="ml-auto flex items-center gap-0.5">
                    <button onClick={() => move(id, -1)} disabled={i === 0} className="rounded p-1 text-km-faint transition-colors hover:text-km-text disabled:opacity-30">
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => move(id, 1)} disabled={i === proxy.fallbackOrder.length - 1} className="rounded p-1 text-km-faint transition-colors hover:text-km-text disabled:opacity-30">
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        const order = proxy.fallbackOrder.filter((f) => f !== id);
                        updateProxy({
                          fallbackOrder: order,
                          activeProvider: order[0] ?? proxy.activeProvider,
                          activeModel: providers.find((x) => x.id === order[0])?.activeModel ?? proxy.activeModel,
                        });
                      }}
                      disabled={proxy.fallbackOrder.length <= 1}
                      className="rounded p-1 text-km-faint transition-colors hover:text-km-error disabled:opacity-30"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {fallbackCandidates.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setAddingFallback(!addingFallback)}
                  className="flex items-center gap-1.5 rounded-lg border border-dashed border-km-border px-3 py-2 text-xs text-km-dim transition-colors hover:border-km-muted hover:text-km-text"
                >
                  <Plus className="h-3.5 w-3.5" /> Add provider to chain
                </button>
                {addingFallback && (
                  <div className="absolute z-10 mt-1 w-64 overflow-hidden rounded-xl border border-km-border bg-km-panel shadow-xl shadow-black/40">
                    {fallbackCandidates.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          updateProxy({ fallbackOrder: [...proxy.fallbackOrder, p.id] });
                          setAddingFallback(false);
                          toast(`${p.name} added to fallback chain`);
                        }}
                        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-km-dim transition-colors hover:bg-km-raised hover:text-km-text"
                      >
                        <ProviderMark id={p.id} name={p.name} size="sm" />
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Snippets */}
      <Snippets endpoint={endpoint} apiKey={proxy.localApiKey} model={proxy.activeModel} />
    </div>
  );
}
