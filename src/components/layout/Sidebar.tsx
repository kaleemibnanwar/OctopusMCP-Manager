import { NavLink } from "react-router-dom";
import { LayoutDashboard, Brain, Radio, Terminal, Server, Store, Wrench, Settings, Boxes } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore, useStats } from "@/store/store";

export function Sidebar() {
  const stats = useStats();
  const { proxy } = useStore();

  const sections = [
    {
      label: null,
      items: [{ to: "/", icon: LayoutDashboard, label: "Overview" }],
    },
    {
      label: "Intelligence",
      items: [
        { to: "/models", icon: Brain, label: "Models", badge: stats.connectedProviders },
        { to: "/proxy", icon: Radio, label: "Proxy", live: stats.proxyRunning },
        { to: "/sync", icon: Terminal, label: "CLI Sync", badge: stats.syncedTools },
      ],
    },
    {
      label: "Tooling",
      items: [
        { to: "/servers", icon: Server, label: "Servers", badge: stats.runningServers },
        { to: "/manager-mcp", icon: Boxes, label: "Manager MCP" },
        { to: "/catalog", icon: Store, label: "Catalog", badge: stats.catalogTotal },
        { to: "/builder", icon: Wrench, label: "Builder" },
      ],
    },
  ];

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-km-border bg-km-panel">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-km-border px-5">
        <img src="/assets/logo.png" alt="Soloman Manager" className="h-9 w-9 rounded-xl shadow-lg shadow-black/40" />
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight text-km-text">Soloman</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-km-faint">Manager</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="km-scroll flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section, i) => (
          <div key={i} className={cn(i > 0 && "mt-5")}>
            {section.label && (
              <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-km-faint">
                {section.label}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors",
                      isActive
                        ? "bg-km-raised text-km-text"
                        : "text-km-dim hover:bg-km-raised/50 hover:text-km-text"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-km-text" />}
                      <item.icon className="h-4 w-4" />
                      <span className="flex-1">{item.label}</span>
                      {"badge" in item && item.badge !== undefined && (
                        <span className="rounded-md bg-km-border/70 px-1.5 py-0.5 font-mono text-[10px] text-km-dim">
                          {item.badge}
                        </span>
                      )}
                      {"live" in item && (
                        <span className="relative flex h-2 w-2">
                          {item.live && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-km-success opacity-60" />}
                          <span className={cn("relative inline-flex h-2 w-2 rounded-full", item.live ? "bg-km-success" : "bg-km-muted")} />
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom: settings + proxy status */}
      <div className="space-y-2 border-t border-km-border p-3">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors",
              isActive ? "bg-km-raised text-km-text" : "text-km-dim hover:bg-km-raised/50 hover:text-km-text"
            )
          }
        >
          <Settings className="h-4 w-4" />
          Settings
        </NavLink>

        <NavLink to="/proxy" className="studio-dots block rounded-xl border border-km-border bg-km-bg p-3 transition-colors hover:border-km-muted">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-km-faint">Local proxy</span>
            <span className="relative flex h-2 w-2">
              {proxy.running && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-km-success opacity-60" />}
              <span className={cn("relative inline-flex h-2 w-2 rounded-full", proxy.running ? "bg-km-success" : "bg-km-muted")} />
            </span>
          </div>
          <div className="mt-1.5 font-mono text-xs text-km-text">:{proxy.port}</div>
          <div className="mt-0.5 text-[10px] text-km-dim">
            {proxy.running ? `${proxy.totalRequests.toLocaleString()} requests routed` : "Stopped"}
          </div>
        </NavLink>
      </div>
    </aside>
  );
}
