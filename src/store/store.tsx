import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  seedProviders,
  seedServers,
  seedProxy,
  seedSettings,
  mcpServerTypes,
  endpointOf,
  type AIProvider,
  type InstalledServer,
  type ProxyConfig,
  type AppSettings,
} from "@/data/mock-data";
import { cliTools, seedToolSyncs, type ToolSyncState } from "@/data/cli-tools";

const STORAGE_KEY = "soloman-manager-state-v1";

interface PersistedState {
  providers: AIProvider[];
  servers: InstalledServer[];
  proxy: ProxyConfig;
  settings: AppSettings;
  toolSyncs: Record<string, ToolSyncState>;
  syncViaProxy: boolean;
  managerMcpEnabled: boolean;
}

export interface Toast {
  id: number;
  message: string;
  kind: "success" | "error" | "info";
}

interface StoreValue extends PersistedState {
  toasts: Toast[];
  toast: (message: string, kind?: Toast["kind"]) => void;
  // providers
  addProvider: (p: Omit<AIProvider, "id" | "status" | "requestsToday">) => void;
  updateProvider: (id: string, patch: Partial<AIProvider>) => void;
  removeProvider: (id: string) => void;
  testProvider: (id: string) => Promise<boolean>;
  addModel: (providerId: string, model: string) => void;
  removeModel: (providerId: string, model: string) => void;
  setPrimary: (id: string) => void;
  // proxy
  updateProxy: (patch: Partial<ProxyConfig>) => void;
  toggleProxy: () => void;
  regenerateKey: () => void;
  // servers
  installServer: (typeId: string, name: string, config: InstalledServer["config"]) => string | null;
  updateServer: (id: string, patch: Partial<InstalledServer>) => void;
  removeServer: (id: string) => void;
  toggleServer: (id: string) => void;
  // cli sync
  syncTool: (toolId: string, providerId?: string, model?: string) => Promise<boolean>;
  syncAllTools: () => void;
  resetToolSync: (toolId: string) => void;
  setSyncRouting: (viaProxy: boolean) => void;
  setManagerMcpEnabled: (enabled: boolean) => void;
  // settings
  updateSettings: (patch: Partial<AppSettings>) => void;
  resetWorkspace: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function freshState(): PersistedState {
  return {
    providers: seedProviders,
    servers: seedServers,
    proxy: { ...seedProxy, startedAt: Date.now() - (3 * 24 * 60 + 14 * 60 + 22) * 60 * 1000 },
    settings: seedSettings,
    toolSyncs: structuredClone(seedToolSyncs),
    syncViaProxy: true,
    managerMcpEnabled: true,
  };
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw) as PersistedState;
    if (!parsed.providers || !parsed.servers || !parsed.proxy || !parsed.settings) return freshState();
    // Migrate states saved before CLI sync existed
    if (!parsed.toolSyncs) parsed.toolSyncs = structuredClone(seedToolSyncs);
    if (parsed.syncViaProxy === undefined) parsed.syncViaProxy = true;
    if (parsed.managerMcpEnabled === undefined) parsed.managerMcpEnabled = true;
    return parsed;
  } catch {
    return freshState();
  }
}

let toastId = 0;

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(loadState);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Simulated live traffic while the proxy is running — keeps counters moving.
  useEffect(() => {
    const timer = setInterval(() => {
      setState((s) => {
        if (!s.proxy.running) return s;
        const inc = Math.floor(Math.random() * 3);
        if (inc === 0) return s;
        return {
          ...s,
          proxy: { ...s.proxy, totalRequests: s.proxy.totalRequests + inc },
          providers: s.providers.map((p) =>
            p.id === s.proxy.activeProvider
              ? { ...p, requestsToday: p.requestsToday + inc, lastUsed: "just now" }
              : p
          ),
        };
      });
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const value = useMemo<StoreValue>(() => {
    const toast = (message: string, kind: Toast["kind"] = "success") => {
      const id = ++toastId;
      setToasts((t) => [...t, { id, message, kind }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
    };

    return {
      ...state,
      toasts,
      toast,

      addProvider: (p) => {
        const id = `${p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now().toString(36)}`;
        setState((s) => ({
          ...s,
          providers: [...s.providers, { ...p, id, status: p.apiKey ? "connected" : "disconnected", requestsToday: 0 }],
        }));
        toast(`${p.name} added`);
      },

      updateProvider: (id, patch) => {
        setState((s) => ({
          ...s,
          providers: s.providers.map((p) => (p.id === id ? { ...p, ...patch } : p)),
          proxy:
            s.proxy.activeProvider === id && patch.activeModel
              ? { ...s.proxy, activeModel: patch.activeModel }
              : s.proxy,
        }));
      },

      removeProvider: (id) => {
        setState((s) => {
          const providers = s.providers.filter((p) => p.id !== id);
          const fallbackOrder = s.proxy.fallbackOrder.filter((f) => f !== id);
          let proxy = { ...s.proxy, fallbackOrder };
          if (proxy.activeProvider === id) {
            const next = providers.find((p) => p.status === "connected") ?? providers[0];
            proxy = { ...proxy, activeProvider: next?.id ?? "", activeModel: next?.activeModel ?? "" };
          }
          return { ...s, providers, proxy };
        });
        toast("Provider removed", "info");
      },

      testProvider: async (id) => {
        await new Promise((r) => setTimeout(r, 900));
        const provider = state.providers.find((p) => p.id === id);
        const ok = Boolean(provider?.apiKey);
        setState((s) => ({
          ...s,
          providers: s.providers.map((p) =>
            p.id === id ? { ...p, status: ok ? "connected" : "error" } : p
          ),
        }));
        toast(ok ? `${provider?.name}: connection OK` : `${provider?.name}: missing API key`, ok ? "success" : "error");
        return ok;
      },

      addModel: (providerId, model) => {
        const name = model.trim();
        const provider = state.providers.find((p) => p.id === providerId);
        if (!provider || !name) return;
        if (provider.models.includes(name)) {
          toast(`${name} already exists in ${provider.name}`, "info");
          return;
        }
        setState((s) => ({
          ...s,
          providers: s.providers.map((p) =>
            p.id === providerId
              ? { ...p, models: [...p.models, name], activeModel: p.activeModel || name }
              : p
          ),
          proxy:
            s.proxy.activeProvider === providerId && !s.proxy.activeModel
              ? { ...s.proxy, activeModel: name }
              : s.proxy,
        }));
        toast(`${name} added to ${provider.name}`);
      },

      removeModel: (providerId, model) => {
        const provider = state.providers.find((p) => p.id === providerId);
        if (!provider) return;
        if (provider.models.length <= 1) {
          toast("A provider needs at least one model", "error");
          return;
        }
        const models = provider.models.filter((m) => m !== model);
        const activeModel = provider.activeModel === model ? models[0] : provider.activeModel;
        setState((s) => ({
          ...s,
          providers: s.providers.map((p) => (p.id === providerId ? { ...p, models, activeModel } : p)),
          proxy:
            s.proxy.activeProvider === providerId && s.proxy.activeModel === model
              ? { ...s.proxy, activeModel }
              : s.proxy,
          toolSyncs: Object.fromEntries(
            Object.entries(s.toolSyncs).map(([id, t]) => [
              id,
              t.providerId === providerId && t.model === model ? { ...t, model: activeModel } : t,
            ])
          ),
        }));
        toast(`${model} removed from ${provider.name}`, "info");
      },

      setPrimary: (id) => {
        const provider = state.providers.find((p) => p.id === id);
        if (!provider) return;
        if (provider.models.length === 0) {
          toast(`Add a model to ${provider.name} first`, "error");
          return;
        }
        setState((s) => ({
          ...s,
          proxy: {
            ...s.proxy,
            activeProvider: id,
            activeModel: provider.activeModel,
            fallbackOrder: [id, ...s.proxy.fallbackOrder.filter((f) => f !== id)],
          },
        }));
        toast(`${provider.name} is now the primary route`);
      },

      updateProxy: (patch) => setState((s) => ({ ...s, proxy: { ...s.proxy, ...patch } })),

      toggleProxy: () => {
        setState((s) => {
          const running = !s.proxy.running;
          return { ...s, proxy: { ...s.proxy, running, startedAt: running ? Date.now() : null } };
        });
        toast(state.proxy.running ? "Proxy stopped" : `Proxy listening on :${state.proxy.port}`, state.proxy.running ? "info" : "success");
      },

      regenerateKey: () => {
        const hex = Array.from(crypto.getRandomValues(new Uint8Array(12)))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        setState((s) => ({ ...s, proxy: { ...s.proxy, localApiKey: `sm-key-${hex}` } }));
        toast("New local API key generated");
      },

      installServer: (typeId, name, config) => {
        const type = mcpServerTypes.find((t) => t.id === typeId);
        if (!type) return null;
        const id = `${typeId}-${Date.now().toString(36)}`;
        const server: InstalledServer = {
          id,
          typeId,
          name,
          status: "stopped",
          transport: type.transport,
          language: type.language,
          tools: type.toolNames.length,
          config,
          installedAt: new Date().toISOString().slice(0, 10),
        };
        setState((s) => ({ ...s, servers: [server, ...s.servers] }));
        toast(`${name} installed`);
        return id;
      },

      updateServer: (id, patch) => {
        setState((s) => ({
          ...s,
          servers: s.servers.map((sv) => (sv.id === id ? { ...sv, ...patch } : sv)),
        }));
      },

      removeServer: (id) => {
        setState((s) => ({ ...s, servers: s.servers.filter((sv) => sv.id !== id) }));
        toast("Server removed", "info");
      },

      toggleServer: (id) => {
        const server = state.servers.find((sv) => sv.id === id);
        if (!server) return;
        const next = server.status === "running" ? "stopped" : "running";
        setState((s) => ({
          ...s,
          servers: s.servers.map((sv) =>
            sv.id === id
              ? { ...sv, status: next, lastActive: next === "running" ? "just now" : sv.lastActive }
              : sv
          ),
        }));
        toast(next === "running" ? `${server.name} started` : `${server.name} stopped`, next === "running" ? "success" : "info");
      },

      syncTool: async (toolId, providerId, model) => {
        const tool = cliTools.find((t) => t.id === toolId);
        const current = state.toolSyncs[toolId];
        if (!tool || !current) return false;
        const pid = providerId ?? current.providerId;
        const provider = state.providers.find((p) => p.id === pid);
        if (!provider) {
          toast("Provider no longer exists — pick another one", "error");
          return false;
        }
        if (provider.models.length === 0) {
          toast(`${provider.name} has no models — add one in Models first`, "error");
          return false;
        }
        const requested = model ?? (pid !== current.providerId ? provider.activeModel : current.model);
        const finalModel = provider.models.includes(requested) ? requested : provider.activeModel;
        if (!state.syncViaProxy && !provider.apiKey) {
          toast(`${provider.name} has no API key — add one in Models or route via the proxy`, "error");
          return false;
        }
        await new Promise((r) => setTimeout(r, 550));
        const baseUrl = state.syncViaProxy ? `http://localhost:${state.proxy.port}/v1` : provider.baseUrl;
        setState((s) => ({
          ...s,
          toolSyncs: {
            ...s.toolSyncs,
            [toolId]: { providerId: pid, model: finalModel, synced: true, syncedAt: Date.now(), syncedBaseUrl: baseUrl },
          },
        }));
        toast(`${tool.name} → ${provider.name} · ${finalModel}`);
        return true;
      },

      syncAllTools: () => {
        const entries: Record<string, ToolSyncState> = {};
        let skipped = 0;
        for (const tool of cliTools) {
          const cur = state.toolSyncs[tool.id];
          const provider =
            state.providers.find((p) => p.id === cur.providerId) ??
            state.providers.find((p) => p.id === state.proxy.activeProvider);
          if (!provider || provider.models.length === 0 || (!state.syncViaProxy && !provider.apiKey)) {
            skipped++;
            entries[tool.id] = cur;
            continue;
          }
          const model = provider.models.includes(cur.model) ? cur.model : provider.activeModel;
          entries[tool.id] = {
            providerId: provider.id,
            model,
            synced: true,
            syncedAt: Date.now(),
            syncedBaseUrl: state.syncViaProxy ? `http://localhost:${state.proxy.port}/v1` : provider.baseUrl,
          };
        }
        setState((s) => ({ ...s, toolSyncs: { ...s.toolSyncs, ...entries } }));
        toast(
          skipped
            ? `Synced ${cliTools.length - skipped} tools · ${skipped} skipped (missing provider or key)`
            : `All ${cliTools.length} CLI tools synced`,
          skipped ? "info" : "success"
        );
      },

      resetToolSync: (toolId) => {
        const tool = cliTools.find((t) => t.id === toolId);
        setState((s) => ({
          ...s,
          toolSyncs: {
            ...s.toolSyncs,
            [toolId]: { ...s.toolSyncs[toolId], synced: false, syncedAt: null, syncedBaseUrl: null },
          },
        }));
        toast(`${tool?.name ?? "Tool"} config reset to defaults`, "info");
      },

      setSyncRouting: (viaProxy) => {
        setState((s) => {
          const toolSyncs = { ...s.toolSyncs };
          for (const tool of cliTools) {
            const cur = toolSyncs[tool.id];
            if (!cur.synced) continue;
            const provider = s.providers.find((p) => p.id === cur.providerId);
            toolSyncs[tool.id] = {
              ...cur,
              syncedBaseUrl: viaProxy ? `http://localhost:${s.proxy.port}/v1` : provider?.baseUrl ?? cur.syncedBaseUrl,
              syncedAt: Date.now(),
            };
          }
          return { ...s, syncViaProxy: viaProxy, toolSyncs };
        });
        toast(viaProxy ? "Tools now route through the local proxy" : "Tools now connect directly to providers", "info");
      },

      setManagerMcpEnabled: (enabled) => {
        setState((s) => ({ ...s, managerMcpEnabled: enabled }));
        toast(enabled ? "Manager MCP enabled — agents can connect" : "Manager MCP disabled — agent connections refused", "info");
      },

      updateSettings: (patch) => setState((s) => ({ ...s, settings: { ...s.settings, ...patch } })),

      resetWorkspace: () => {
        setState(freshState());
        toast("Workspace reset to defaults", "info");
      },
    };
  }, [state, toasts]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside AppStoreProvider");
  return ctx;
}

export function useStats() {
  const { providers, servers, proxy, toolSyncs } = useStore();
  return {
    syncedTools: Object.values(toolSyncs).filter((t) => t.synced).length,
    totalProviders: providers.length,
    connectedProviders: providers.filter((p) => p.status === "connected").length,
    totalModels: providers.reduce((acc, p) => acc + p.models.length, 0),
    totalServers: servers.length,
    runningServers: servers.filter((s) => s.status === "running").length,
    errorServers: servers.filter((s) => s.status === "error").length,
    totalTools: servers.reduce((acc, s) => acc + s.tools, 0),
    catalogTotal: mcpServerTypes.length,
    proxyRunning: proxy.running,
    proxyRequests: proxy.totalRequests,
  };
}

export function formatUptime(startedAt: number | null): string {
  if (!startedAt) return "—";
  const mins = Math.floor((Date.now() - startedAt) / 60000);
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function proxyEndpoint(port: number) {
  return endpointOf(port);
}
