import { Link, useLocation } from "react-router-dom";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/store";

const pageTitles: Record<string, string> = {
  "/": "Overview",
  "/models": "AI Models",
  "/proxy": "Local Proxy",
  "/sync": "CLI Sync",
  "/servers": "MCP Servers",
  "/manager-mcp": "Manager MCP",
  "/catalog": "Server Catalog",
  "/builder": "Server Builder",
  "/settings": "Settings",
};

export function Header() {
  const location = useLocation();
  const title = pageTitles[location.pathname] ?? "Overview";
  const { proxy } = useStore();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-km-border bg-km-panel/80 px-6 backdrop-blur">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-km-faint">Soloman</span>
        <span className="text-km-faint">/</span>
        <h1 className="font-medium text-km-text">{title}</h1>
      </div>

      <Link
        to="/proxy"
        className={cn(
          "flex items-center gap-2.5 rounded-full border px-3.5 py-1.5 text-xs transition-colors",
          proxy.running
            ? "border-km-success/25 bg-km-success/5 text-km-dim hover:border-km-success/50"
            : "border-km-border bg-km-raised/40 text-km-dim hover:border-km-muted"
        )}
      >
        <span className="relative flex h-2 w-2">
          {proxy.running && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-km-success opacity-60" />}
          <span className={cn("relative inline-flex h-2 w-2 rounded-full", proxy.running ? "bg-km-success" : "bg-km-muted")} />
        </span>
        <span className="font-mono">:{proxy.port}</span>
        <span className="h-3 w-px bg-km-border" />
        <Activity className="h-3 w-3" />
        <span className="font-mono tabular-nums">{proxy.totalRequests.toLocaleString()}</span>
      </Link>
    </header>
  );
}
