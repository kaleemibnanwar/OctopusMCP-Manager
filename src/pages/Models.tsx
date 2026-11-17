import { useState } from "react";
import { Plus, RefreshCw, Pencil, Trash2, Star, Clock, Zap, X, Eye, EyeOff, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/store";
import { providerPresets, type AIProvider } from "@/data/mock-data";
import { ProviderMark, StatusPill, PageIntro, EmptyState, SecretValue, CopyButton } from "@/components/ui/bits";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Brain } from "lucide-react";

// ─── Add / Edit provider form ────────────────────────────────────────────────

interface ProviderForm {
  name: string;
  baseUrl: string;
  apiKey: string;
  models: string;
  activeModel: string;
  rateLimit: string;
}

const emptyForm: ProviderForm = { name: "", baseUrl: "", apiKey: "", models: "", activeModel: "", rateLimit: "" };

function ProviderModal({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: AIProvider | null;
}) {
  const { addProvider, updateProvider, toast } = useStore();
  const [form, setForm] = useState<ProviderForm>(emptyForm);
  const [presetId, setPresetId] = useState<string>("");
  const [showKey, setShowKey] = useState(false);
  const [initializedFor, setInitializedFor] = useState<string | null>(null);

  // Sync form when the modal target changes
  const targetKey = editing ? editing.id : "new";
  if (open && initializedFor !== targetKey) {
    setInitializedFor(targetKey);
    setPresetId("");
    setShowKey(false);
    setForm(
      editing
        ? {
            name: editing.name,
            baseUrl: editing.baseUrl,
            apiKey: editing.apiKey,
            models: editing.models.join(", "),
            activeModel: editing.activeModel,
            rateLimit: editing.rateLimit ? String(editing.rateLimit) : "",
          }
        : emptyForm
    );
  }
  if (!open && initializedFor !== null) setInitializedFor(null);

  const modelList = form.models.split(",").map((m) => m.trim()).filter(Boolean);
  const valid = form.name.trim() && form.baseUrl.trim();

  const applyPreset = (id: string) => {
    setPresetId(id);
    const preset = providerPresets.find((p) => p.id === id);
    if (!preset || preset.id === "custom") {
      setForm((f) => ({ ...f, name: "", baseUrl: "", models: "", activeModel: "" }));
      return;
    }
    setForm((f) => ({
      ...f,
      name: preset.name,
      baseUrl: preset.baseUrl,
      models: preset.models,
      activeModel: preset.models.split(",")[0].trim(),
    }));
  };

  const save = () => {
    if (!valid) {
      toast("Name and base URL are required", "error");
      return;
    }
    const active = modelList.includes(form.activeModel) ? form.activeModel : modelList[0] ?? "";
    const payload = {
      name: form.name.trim(),
      baseUrl: form.baseUrl.trim(),
      apiKey: form.apiKey.trim(),
      models: modelList,
      activeModel: active,
      rateLimit: form.rateLimit ? Number(form.rateLimit) : undefined,
    };
    if (editing) {
      updateProvider(editing.id, payload);
      toast(`${payload.name} updated`);
    } else {
      addProvider(payload);
    }
    onClose();
  };

  const inputCls =
    "w-full rounded-lg border border-km-border bg-km-bg px-3 py-2 text-sm text-km-text placeholder:text-km-faint focus:border-km-muted focus:outline-none";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? `Edit ${editing.name}` : "Add AI Provider"}
      subtitle="Connect any OpenAI-compatible API endpoint"
      wide
    >
      {!editing && (
        <div className="mb-5">
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-km-faint">Start from a preset</label>
          <div className="flex flex-wrap gap-2">
            {providerPresets.map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors",
                  presetId === p.id
                    ? "border-km-text/40 bg-km-raised text-km-text"
                    : "border-km-border text-km-dim hover:border-km-muted hover:text-km-text"
                )}
              >
                {p.id !== "custom" && <ProviderMark id={p.id} name={p.name} size="sm" />}
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-km-dim">Display name *</label>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. OpenAI" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-km-dim">Daily request limit</label>
            <input className={inputCls} type="number" value={form.rateLimit} onChange={(e) => setForm({ ...form, rateLimit: e.target.value })} placeholder="Optional, e.g. 10000" />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-km-dim">Base URL *</label>
          <input className={cn(inputCls, "font-mono text-xs")} value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} placeholder="https://api.example.com/v1" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-km-dim">Secret key</label>
          <div className="relative">
            <input
              className={cn(inputCls, "pr-20 font-mono text-xs")}
              type={showKey ? "text" : "password"}
              value={form.apiKey}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              placeholder="sk-..."
            />
            <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                title={showKey ? "Hide key" : "Show key"}
                className="rounded p-1.5 text-km-faint transition-colors hover:text-km-text"
              >
                {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
              {form.apiKey && <CopyButton text={form.apiKey} />}
            </div>
          </div>
          <p className="mt-1 text-[11px] text-km-faint">Stored locally only. Leave empty to configure later.</p>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-km-dim">Models <span className="font-normal text-km-faint">(optional, comma-separated — you can add more on the provider card)</span></label>
          <textarea className={cn(inputCls, "resize-none font-mono text-xs")} rows={2} value={form.models} onChange={(e) => setForm({ ...form, models: e.target.value })} placeholder="model-a, model-b, model-c" />
        </div>
        {modelList.length > 0 && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-km-dim">Default model</label>
            <div className="flex flex-wrap gap-1.5">
              {modelList.map((m) => (
                <button
                  key={m}
                  onClick={() => setForm({ ...form, activeModel: m })}
                  className={cn(
                    "rounded-md px-2.5 py-1 font-mono text-[11px] transition-colors",
                    (form.activeModel || modelList[0]) === m ? "bg-km-text text-km-bg" : "bg-km-raised text-km-dim hover:text-km-text"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg border border-km-border px-4 py-2 text-xs text-km-dim hover:text-km-text">
          Cancel
        </button>
        <button onClick={save} className="rounded-lg bg-km-text px-4 py-2 text-xs font-medium text-km-bg transition-opacity hover:opacity-90">
          {editing ? "Save changes" : "Add provider"}
        </button>
      </div>
    </Modal>
  );
}

// ─── Provider card ───────────────────────────────────────────────────────────

function ProviderCard({ provider, onEdit, onDelete }: { provider: AIProvider; onEdit: () => void; onDelete: () => void }) {
  const { proxy, updateProvider, testProvider, setPrimary, addModel, removeModel, toast } = useStore();
  const [testing, setTesting] = useState(false);
  const [addingModel, setAddingModel] = useState(false);
  const [newModel, setNewModel] = useState("");
  const isPrimary = proxy.activeProvider === provider.id;

  const submitModel = () => {
    if (!newModel.trim()) {
      setAddingModel(false);
      return;
    }
    addModel(provider.id, newModel);
    setNewModel("");
  };

  const usage = provider.rateLimit ? Math.min(Math.round((provider.requestsToday / provider.rateLimit) * 100), 100) : null;

  const runTest = async () => {
    setTesting(true);
    await testProvider(provider.id);
    setTesting(false);
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-km-panel transition-all",
        isPrimary ? "border-km-text/30 shadow-lg shadow-black/30" : "border-km-border hover:border-km-muted"
      )}
    >
      {isPrimary && (
        <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-km-text px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-km-bg">
          <Star className="h-2.5 w-2.5" /> Primary
        </div>
      )}

      <div className="p-5">
        <div className="flex items-center gap-3.5">
          <ProviderMark id={provider.id} name={provider.name} size="lg" />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-km-text">{provider.name}</h3>
            <p className="mt-0.5 truncate font-mono text-[11px] text-km-faint">{provider.baseUrl}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <StatusPill status={provider.status} pulse />
          {provider.lastUsed && (
            <span className="flex items-center gap-1 text-[11px] text-km-faint">
              <Clock className="h-3 w-3" /> {provider.lastUsed}
            </span>
          )}
        </div>

        {/* API key — reveal with eye, copy */}
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-km-border bg-km-bg px-3 py-1.5">
          <KeyRound className="h-3.5 w-3.5 shrink-0 text-km-faint" />
          <SecretValue value={provider.apiKey} className="flex-1" />
        </div>

        {/* Model chips — click to activate, × to remove, + to add */}
        <div className="mt-4">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-km-faint">
            Models · click to activate
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {provider.models.map((m) => (
              <span
                key={m}
                className={cn(
                  "group/chip inline-flex items-center rounded-md font-mono text-[11px] transition-colors",
                  m === provider.activeModel ? "bg-km-text text-km-bg" : "bg-km-raised text-km-dim"
                )}
              >
                <button
                  onClick={() => {
                    if (m !== provider.activeModel) {
                      updateProvider(provider.id, { activeModel: m });
                      toast(`${provider.name} → ${m}`);
                    }
                  }}
                  className={cn("py-1 pl-2 pr-1 transition-colors", m !== provider.activeModel && "hover:text-km-text")}
                >
                  {m}
                </button>
                <button
                  onClick={() => removeModel(provider.id, m)}
                  title={`Remove ${m}`}
                  className="py-1 pl-0.5 pr-1.5 opacity-0 transition-opacity hover:opacity-100 group-hover/chip:opacity-50"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {addingModel ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitModel();
                }}
                className="inline-flex items-center gap-1"
              >
                <input
                  autoFocus
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && (setAddingModel(false), setNewModel(""))}
                  placeholder="model-id"
                  className="w-36 rounded-md border border-km-muted bg-km-bg px-2 py-1 font-mono text-[11px] text-km-text outline-none placeholder:text-km-faint"
                />
                <button type="submit" className="rounded-md bg-km-text px-2 py-1 text-[11px] font-semibold text-km-bg">
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddingModel(false);
                    setNewModel("");
                  }}
                  className="rounded-md p-1 text-km-faint hover:text-km-text"
                >
                  <X className="h-3 w-3" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setAddingModel(true)}
                className="inline-flex items-center gap-1 rounded-md border border-dashed border-km-border px-2 py-1 text-[11px] text-km-faint transition-colors hover:border-km-muted hover:text-km-text"
              >
                <Plus className="h-3 w-3" /> Add model
              </button>
            )}
          </div>
          {provider.models.length === 0 && (
            <p className="mt-2 text-[11px] text-km-warning">No models yet — add one to route traffic through this provider.</p>
          )}
        </div>

        {/* Usage */}
        {usage !== null && (
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[11px]">
              <span className="text-km-faint">Daily usage</span>
              <span className="font-mono tabular-nums text-km-dim">
                {provider.requestsToday.toLocaleString()} / {provider.rateLimit!.toLocaleString()}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-km-raised">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  usage > 90 ? "bg-km-error" : usage > 70 ? "bg-km-warning" : "bg-km-success"
                )}
                style={{ width: `${usage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-auto flex items-center gap-1.5 border-t border-km-border bg-km-bg/40 px-4 py-3">
        <button
          onClick={runTest}
          disabled={testing}
          className="flex items-center gap-1.5 rounded-lg border border-km-border px-2.5 py-1.5 text-[11px] text-km-dim transition-colors hover:border-km-muted hover:text-km-text disabled:opacity-60"
        >
          <RefreshCw className={cn("h-3 w-3", testing && "animate-spin")} />
          {testing ? "Testing…" : "Test"}
        </button>
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 rounded-lg border border-km-border px-2.5 py-1.5 text-[11px] text-km-dim transition-colors hover:border-km-muted hover:text-km-text"
        >
          <Pencil className="h-3 w-3" /> Edit
        </button>
        {!isPrimary && (
          <button
            onClick={() => setPrimary(provider.id)}
            className="flex items-center gap-1.5 rounded-lg border border-km-border px-2.5 py-1.5 text-[11px] text-km-dim transition-colors hover:border-km-muted hover:text-km-text"
          >
            <Zap className="h-3 w-3" /> Set primary
          </button>
        )}
        <button
          onClick={onDelete}
          className="ml-auto rounded-lg p-1.5 text-km-faint transition-colors hover:bg-km-error/10 hover:text-km-error"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function Models() {
  const { providers, removeProvider } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AIProvider | null>(null);
  const [deleting, setDeleting] = useState<AIProvider | null>(null);

  const connected = providers.filter((p) => p.status === "connected").length;
  const totalModels = providers.reduce((a, p) => a + p.models.length, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 animate-fade-in">
      <PageIntro
        title="AI Providers"
        description={`${providers.length} providers · ${connected} connected · ${totalModels} models. Every provider routes through your local proxy — switch models or fail over without touching your tools.`}
        action={
          <button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-km-text px-4 py-2.5 text-xs font-semibold text-km-bg shadow-lg shadow-black/30 transition-opacity hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> Add provider
          </button>
        }
      />

      {providers.length === 0 ? (
        <EmptyState
          icon={Brain}
          title="No providers yet"
          hint="Connect OpenAI, Anthropic, DeepSeek or any compatible API"
          action={
            <button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-km-text px-4 py-2 text-xs font-semibold text-km-bg"
            >
              <Plus className="h-3.5 w-3.5" /> Add provider
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {providers.map((p) => (
            <ProviderCard
              key={p.id}
              provider={p}
              onEdit={() => {
                setEditing(p);
                setModalOpen(true);
              }}
              onDelete={() => setDeleting(p)}
            />
          ))}
        </div>
      )}

      <ProviderModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} />
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && removeProvider(deleting.id)}
        title="Remove provider"
        message={`Remove ${deleting?.name}? It will also be removed from the proxy fallback chain.`}
        confirmLabel="Remove"
      />
    </div>
  );
}
