import { useState } from "react";
import { Folder, Database, Bell, Radio, RotateCcw } from "lucide-react";
import { useStore } from "@/store/store";
import { PageIntro } from "@/components/ui/bits";
import { ConfirmDialog } from "@/components/ui/Modal";

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <div className="text-sm text-km-text">{label}</div>
        <div className="text-xs text-km-dim">{description}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-km-text" : "bg-km-raised"}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-km-bg transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

function Section({ icon: Icon, title, subtitle, children }: { icon: React.ElementType; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-km-border bg-km-panel p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-km-border bg-gradient-to-br from-km-raised to-km-panel">
          <Icon className="h-4 w-4 text-km-text" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-km-text">{title}</h3>
          <p className="text-xs text-km-dim">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export function Settings() {
  const { settings, proxy, updateSettings, updateProxy, resetWorkspace, toast } = useStore();
  const [confirmReset, setConfirmReset] = useState(false);

  const inputCls =
    "w-full rounded-lg border border-km-border bg-km-bg px-3 py-2 font-mono text-xs text-km-text focus:border-km-muted focus:outline-none";

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-6 animate-fade-in">
      <PageIntro title="Settings" description="Workspace preferences. Everything is stored locally on this machine." />

      <Section icon={Folder} title="Data directory" subtitle="Where servers, configs and data are stored">
        <input
          value={settings.dataDir}
          onChange={(e) => updateSettings({ dataDir: e.target.value })}
          className={inputCls}
        />
      </Section>

      <Section icon={Radio} title="Proxy server" subtitle="Local unified API endpoint">
        <label className="mb-1.5 block text-xs font-medium text-km-dim">Port</label>
        <input
          type="number"
          value={proxy.port}
          onChange={(e) => {
            const port = Number(e.target.value);
            if (port > 0 && port < 65536) updateProxy({ port });
          }}
          className={inputCls}
        />
        <p className="mt-1.5 text-[11px] text-km-faint">
          Endpoint becomes <span className="font-mono">http://localhost:{proxy.port}/v1/chat/completions</span>
        </p>
      </Section>

      <Section icon={Database} title="Database" subtitle="Local SQLite database for metadata and logs">
        <div className="rounded-lg border border-km-border bg-km-bg px-3 py-2 font-mono text-xs text-km-dim">
          {settings.dataDir}/soloman.db
        </div>
      </Section>

      <Section icon={Bell} title="Preferences" subtitle="Application behavior">
        <div className="space-y-2">
          <ToggleRow
            label="Auto-update servers"
            description="Automatically check for MCP server updates"
            checked={settings.autoUpdate}
            onChange={(v) => {
              updateSettings({ autoUpdate: v });
              toast(v ? "Auto-update enabled" : "Auto-update disabled", "info");
            }}
          />
          <ToggleRow
            label="Notifications"
            description="Show desktop notifications for events"
            checked={settings.notifications}
            onChange={(v) => {
              updateSettings({ notifications: v });
              toast(v ? "Notifications enabled" : "Notifications disabled", "info");
            }}
          />
        </div>
      </Section>

      <Section icon={RotateCcw} title="Workspace" subtitle="Reset all providers, servers and proxy settings">
        <button
          onClick={() => setConfirmReset(true)}
          className="rounded-lg border border-km-error/30 px-4 py-2 text-xs text-km-error transition-colors hover:bg-km-error/10"
        >
          Reset to defaults
        </button>
      </Section>

      <div className="flex items-center justify-between rounded-2xl border border-km-border bg-km-panel p-5">
        <div className="flex items-center gap-3">
          <img src="/assets/logo.png" alt="Soloman Manager" className="h-10 w-10 rounded-xl" />
          <div>
            <h3 className="text-sm font-semibold text-km-text">Soloman Manager</h3>
            <p className="text-xs text-km-dim">Version 0.1.0</p>
          </div>
        </div>
        <div className="flex gap-2">
          <span className="rounded-full bg-km-raised px-2.5 py-1 text-[10px] font-medium text-km-dim">Local-first</span>
          <span className="rounded-full bg-km-raised px-2.5 py-1 text-[10px] font-medium text-km-dim">Offline capable</span>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={resetWorkspace}
        title="Reset workspace"
        message="This restores the default providers, servers and proxy configuration. Your current setup will be lost."
        confirmLabel="Reset everything"
      />
    </div>
  );
}
