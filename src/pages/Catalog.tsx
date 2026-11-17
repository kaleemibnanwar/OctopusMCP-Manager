import { useState } from "react";
import { Download, Search, Check, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/store";
import { mcpServerTypes, type MCPServerType } from "@/data/mock-data";
import { TypeIcon, MonoChip, PageIntro, EmptyState } from "@/components/ui/bits";
import { InstallServerModal } from "@/components/ServerModals";
import { Store } from "lucide-react";

const categories = ["All", ...Array.from(new Set(mcpServerTypes.map((t) => t.category)))];

export function Catalog() {
  const { servers } = useStore();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [installing, setInstalling] = useState<MCPServerType | null>(null);

  const filtered = mcpServerTypes.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.tags.some((t) => t.includes(q));
    return matchesSearch && (category === "All" || item.category === category);
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 animate-fade-in">
      <PageIntro
        title="Server Catalog"
        description="Ready-made MCP server templates. Install one, fill in its credentials form, and it becomes an isolated local server your agents can use."
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-km-faint" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, description or tag…"
          className="w-full rounded-xl border border-km-border bg-km-panel py-2.5 pl-9 pr-3 text-sm text-km-text placeholder:text-km-faint focus:border-km-muted focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              category === cat
                ? "border-km-text bg-km-text text-km-bg"
                : "border-km-border bg-km-panel text-km-dim hover:border-km-muted hover:text-km-text"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Store} title="No templates found" hint="Try a different search or category" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const installedCount = servers.filter((s) => s.typeId === item.id).length;
            return (
              <div
                key={item.id}
                className="group flex flex-col rounded-2xl border border-km-border bg-km-panel p-4 transition-all hover:border-km-muted hover:shadow-lg hover:shadow-black/20"
              >
                <div className="flex items-start justify-between">
                  <TypeIcon icon={item.icon} />
                  {installedCount > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-km-success/10 px-2 py-0.5 text-[10px] font-medium text-km-success">
                      <Check className="h-3 w-3" />
                      {installedCount} installed
                    </span>
                  )}
                </div>

                <h3 className="mt-3 text-sm font-semibold text-km-text">{item.name}</h3>
                <p className="mt-1 flex-1 text-xs leading-relaxed text-km-dim">{item.description}</p>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <MonoChip>{item.language}</MonoChip>
                  <MonoChip>{item.transport}</MonoChip>
                  <span className="flex items-center gap-1 text-[10px] text-km-faint">
                    <Wrench className="h-3 w-3" /> {item.toolNames.length} tools
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <span key={tag} className="rounded bg-km-raised px-1.5 py-0.5 text-[10px] text-km-faint">
                      #{tag}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => setInstalling(item)}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-km-border py-2 text-xs font-medium text-km-dim transition-colors group-hover:border-km-text/40 hover:bg-km-text hover:text-km-bg"
                >
                  <Download className="h-3.5 w-3.5" />
                  {installedCount > 0 ? "Install another instance" : "Install"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <InstallServerModal type={installing} open={installing !== null} onClose={() => setInstalling(null)} />
    </div>
  );
}
