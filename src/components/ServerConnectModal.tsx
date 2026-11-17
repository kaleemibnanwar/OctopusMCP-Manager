import { useState } from "react";
import { Terminal, FolderOpen, Braces } from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { CopyButton, SecretValue } from "@/components/ui/bits";
import { useStore } from "@/store/store";
import { mcpServerTypes, type InstalledServer } from "@/data/mock-data";
import { buildServerLaunch } from "@/data/manager-mcp";

/** The "easy configure" view: complete command, separate args, env, agent JSON */
export function ServerConnectModal({
  server,
  open,
  onClose,
}: {
  server: InstalledServer | null;
  open: boolean;
  onClose: () => void;
}) {
  const { settings } = useStore();
  const [tab, setTab] = useState<"command" | "json">("command");

  if (!server) return null;

  const type = mcpServerTypes.find((t) => t.id === server.typeId);
  const launch = buildServerLaunch(server, settings.dataDir);
  const secretKeys = new Set(
    (type?.formSchema ?? []).filter((f) => f.type === "password").map((f) => f.key.toUpperCase())
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${server.name} — launch configuration`}
      subtitle="Everything an agent or user needs to run this server"
      wide
    >
      {/* Folder */}
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-km-border bg-km-bg px-3 py-2">
        <FolderOpen className="h-3.5 w-3.5 shrink-0 text-km-faint" />
        <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-km-dim">{launch.dir}</code>
        <CopyButton text={launch.dir} />
      </div>

      {/* Tabs */}
      <div className="mb-4 flex rounded-xl border border-km-border bg-km-bg p-1">
        <button
          onClick={() => setTab("command")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors",
            tab === "command" ? "bg-km-raised text-km-text" : "text-km-dim hover:text-km-text"
          )}
        >
          <Terminal className="h-3.5 w-3.5" /> Command & env
        </button>
        <button
          onClick={() => setTab("json")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors",
            tab === "json" ? "bg-km-raised text-km-text" : "text-km-dim hover:text-km-text"
          )}
        >
          <Braces className="h-3.5 w-3.5" /> Agent config (JSON)
        </button>
      </div>

      {tab === "command" ? (
        <div className="space-y-4">
          {/* Complete command */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-km-faint">
                Complete command (env included)
              </span>
              <CopyButton text={launch.fullCommand} label="Copy" />
            </div>
            <pre className="km-scroll overflow-x-auto whitespace-pre-wrap break-all rounded-xl border border-km-border bg-km-bg p-3 font-mono text-[11.5px] leading-relaxed text-km-dim">
              {launch.fullCommand}
            </pre>
          </div>

          {/* Separate command + args */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-km-faint">Command</span>
                <CopyButton text={launch.command} />
              </div>
              <code className="block truncate rounded-lg border border-km-border bg-km-bg px-3 py-2 font-mono text-[11px] text-km-dim">
                {launch.command}
              </code>
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-km-faint">Args</span>
                <CopyButton text={launch.args.join(" ")} />
              </div>
              <div className="flex flex-wrap gap-1.5 rounded-lg border border-km-border bg-km-bg px-3 py-2">
                {launch.args.map((a) => (
                  <span key={a} className="rounded-md bg-km-raised px-2 py-0.5 font-mono text-[11px] text-km-dim">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Env table */}
          <div>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-km-faint">
              Environment ({Object.keys(launch.env).length})
            </div>
            <div className="overflow-hidden rounded-xl border border-km-border">
              {Object.entries(launch.env).length === 0 ? (
                <div className="bg-km-bg px-3 py-2 text-[11px] italic text-km-faint">No environment variables</div>
              ) : (
                Object.entries(launch.env).map(([k, v], i) => (
                  <div
                    key={k}
                    className={cn("flex items-center gap-3 bg-km-bg px-3 py-1.5", i > 0 && "border-t border-km-border")}
                  >
                    <span className="w-40 shrink-0 truncate font-mono text-[11px] text-km-text">{k}</span>
                    {secretKeys.has(k) ? (
                      <SecretValue value={v} className="flex-1" />
                    ) : (
                      <>
                        <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-km-dim">{v}</code>
                        <CopyButton text={v} />
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-km-faint">
              Paste into any MCP client (Claude, Cursor, OpenCode…)
            </span>
            <CopyButton text={launch.agentConfig} label="Copy" />
          </div>
          <pre className="km-scroll overflow-x-auto whitespace-pre rounded-xl border border-km-border bg-km-bg p-3 font-mono text-[11.5px] leading-relaxed text-km-dim">
            {launch.agentConfig}
          </pre>
        </div>
      )}

      <p className="mt-4 text-[11px] text-km-faint">
        The server's environment, files and downloads live entirely inside its folder — running this command never
        touches other servers.
      </p>
    </Modal>
  );
}