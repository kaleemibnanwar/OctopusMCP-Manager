import { useState, type ReactNode } from "react";
import {
  Copy,
  Check,
  Eye,
  EyeOff,
  Mail,
  Linkedin,
  Github,
  MessageSquare,
  FileText,
  Globe,
  Folder,
  Hash,
  Terminal,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { providerBrands, type ProviderStatus, type ServerStatus } from "@/data/mock-data";
import { useStore } from "@/store/store";

/** Gradient monogram tile for an AI provider */
export function ProviderMark({ id, name, size = "md" }: { id: string; name: string; size?: "sm" | "md" | "lg" }) {
  const brand = providerBrands[id] ?? { from: "#8a8f98", to: "#4a4e56" };
  const sizes = { sm: "h-7 w-7 text-[11px] rounded-lg", md: "h-10 w-10 text-sm rounded-xl", lg: "h-12 w-12 text-base rounded-xl" };
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center font-bold text-white shadow-lg", sizes[size])}
      style={{
        background: `linear-gradient(135deg, ${brand.from}, ${brand.to})`,
        boxShadow: `0 4px 14px -4px ${brand.from}55`,
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

const providerStatusMeta: Record<ProviderStatus, { label: string; dot: string; text: string; bg: string }> = {
  connected: { label: "Connected", dot: "bg-km-success", text: "text-km-success", bg: "bg-km-success/10" },
  disconnected: { label: "Disconnected", dot: "bg-km-muted", text: "text-km-dim", bg: "bg-km-raised" },
  rate_limited: { label: "Rate limited", dot: "bg-km-warning", text: "text-km-warning", bg: "bg-km-warning/10" },
  error: { label: "Error", dot: "bg-km-error", text: "text-km-error", bg: "bg-km-error/10" },
};

const serverStatusMeta: Record<ServerStatus, { label: string; dot: string; text: string; bg: string }> = {
  running: { label: "Running", dot: "bg-km-success", text: "text-km-success", bg: "bg-km-success/10" },
  stopped: { label: "Stopped", dot: "bg-km-muted", text: "text-km-dim", bg: "bg-km-raised" },
  error: { label: "Error", dot: "bg-km-error", text: "text-km-error", bg: "bg-km-error/10" },
};

export function StatusPill({ status, pulse }: { status: ProviderStatus | ServerStatus; pulse?: boolean }) {
  const meta = (providerStatusMeta as Record<string, typeof providerStatusMeta.connected>)[status] ?? serverStatusMeta[status as ServerStatus];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium", meta.bg, meta.text)}>
      <span className="relative flex h-1.5 w-1.5">
        {pulse && status !== "disconnected" && status !== "stopped" && (
          <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", meta.dot)} />
        )}
        <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", meta.dot)} />
      </span>
      {meta.label}
    </span>
  );
}

export function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useStore();
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast("Copied to clipboard", "info");
        setTimeout(() => setCopied(false), 1800);
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-km-border px-2.5 py-1.5 text-[11px] transition-colors",
        copied ? "text-km-success" : "text-km-dim hover:border-km-muted hover:text-km-text"
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {label && <span>{copied ? "Copied" : label}</span>}
    </button>
  );
}

/** Masked secret with eye reveal + copy */
export function SecretValue({ value, className }: { value: string; className?: string }) {
  const [visible, setVisible] = useState(false);
  if (!value) {
    return <span className={cn("font-mono text-[11px] italic text-km-faint", className)}>Not set</span>;
  }
  const masked = `${value.slice(0, 6)}${"•".repeat(12)}`;
  return (
    <div className={cn("flex min-w-0 items-center gap-1", className)}>
      <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-km-dim" title={visible ? value : undefined}>
        {visible ? value : masked}
      </code>
      <button
        onClick={() => setVisible((v) => !v)}
        title={visible ? "Hide key" : "Show key"}
        className="shrink-0 rounded p-1 text-km-faint transition-colors hover:text-km-text"
      >
        {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
      <CopyButton text={value} />
    </div>
  );
}

const typeIcons: Record<string, LucideIcon> = {
  Mail,
  Linkedin,
  Github,
  MessageSquare,
  FileText,
  Globe,
  Folder,
  Hash,
};

export function TypeIcon({ icon, size = "md" }: { icon: string; size?: "sm" | "md" }) {
  const Icon = typeIcons[icon] ?? Terminal;
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl border border-km-border bg-gradient-to-br from-km-raised to-km-panel",
        size === "sm" ? "h-8 w-8" : "h-10 w-10"
      )}
    >
      <Icon className={cn("text-km-text", size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5")} />
    </div>
  );
}

export function MonoChip({ children, active }: { children: ReactNode; active?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[11px]",
        active ? "bg-km-text text-km-bg" : "bg-km-raised text-km-dim"
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, hint, action }: { icon: LucideIcon; title: string; hint: string; action?: ReactNode }) {
  return (
    <div className="studio-dots flex flex-col items-center justify-center rounded-2xl border border-dashed border-km-border py-16">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-km-border bg-km-panel">
        <Icon className="h-5 w-5 text-km-faint" />
      </div>
      <p className="mt-4 text-sm font-medium text-km-text">{title}</p>
      <p className="mt-1 text-xs text-km-dim">{hint}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PageIntro({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-km-text">{title}</h2>
        <p className="mt-1 max-w-xl text-xs leading-relaxed text-km-dim">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function Toaster() {
  const { toasts } = useStore();
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-xs shadow-xl shadow-black/40 backdrop-blur animate-slide-in",
            t.kind === "success" && "border-km-success/30 bg-km-panel/95 text-km-text",
            t.kind === "error" && "border-km-error/40 bg-km-panel/95 text-km-text",
            t.kind === "info" && "border-km-border bg-km-panel/95 text-km-text"
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              t.kind === "success" && "bg-km-success",
              t.kind === "error" && "bg-km-error",
              t.kind === "info" && "bg-km-dim"
            )}
          />
          {t.message}
        </div>
      ))}
    </div>
  );
}
