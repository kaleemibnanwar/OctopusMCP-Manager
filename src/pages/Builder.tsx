import { useState } from "react";
import { Link } from "react-router-dom";
import { Wrench, Check, ChevronRight, Play, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/store";
import { mcpServerTypes, type MCPServerType } from "@/data/mock-data";
import { DynamicForm } from "@/components/ui/DynamicForm";
import { TypeIcon, MonoChip, PageIntro } from "@/components/ui/bits";

type ConfigValues = Record<string, string | boolean | number>;

export function Builder() {
  const { installServer, toggleServer, toast } = useStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selected, setSelected] = useState<MCPServerType | null>(null);
  const [name, setName] = useState("");
  const [values, setValues] = useState<ConfigValues>({});
  const [createdId, setCreatedId] = useState<string | null>(null);

  const selectType = (type: MCPServerType) => {
    const defaults: ConfigValues = {};
    for (const f of type.formSchema) defaults[f.key] = f.defaultValue ?? (f.type === "toggle" ? false : "");
    setSelected(type);
    setName(type.name);
    setValues(defaults);
    setStep(2);
  };

  const create = () => {
    if (!selected) return;
    if (!name.trim()) {
      toast("Give this server instance a name", "error");
      return;
    }
    const missing = selected.formSchema
      .filter((f) => f.required && (values[f.key] === "" || values[f.key] === undefined))
      .map((f) => f.label);
    if (missing.length > 0) {
      toast(`Required: ${missing.join(", ")}`, "error");
      return;
    }
    const id = installServer(selected.id, name.trim(), values);
    setCreatedId(id);
    setStep(3);
  };

  const steps = ["Select template", "Configure", "Launch"];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 animate-fade-in">
      <PageIntro
        title="Server Builder"
        description="Create a new isolated MCP server in three steps — pick a template, fill in its credentials, launch it."
      />

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3;
          const state = step === n ? "current" : step > n ? "done" : "todo";
          return (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && <div className={cn("h-px w-8", step > i ? "bg-km-text/40" : "bg-km-border")} />}
              <div
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors",
                  state === "current" && "border-km-text/40 bg-km-raised text-km-text",
                  state === "done" && "border-km-success/30 bg-km-success/5 text-km-success",
                  state === "todo" && "border-km-border text-km-faint"
                )}
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-km-border/60 font-mono text-[10px]">
                  {state === "done" ? <Check className="h-2.5 w-2.5" /> : n}
                </span>
                {label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {mcpServerTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => selectType(type)}
              className="group flex items-center gap-3 rounded-2xl border border-km-border bg-km-panel p-3.5 text-left transition-all hover:border-km-muted hover:shadow-lg hover:shadow-black/20"
            >
              <TypeIcon icon={type.icon} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-km-text">{type.name}</div>
                <div className="truncate text-[11px] text-km-dim">{type.description}</div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-km-faint transition-transform group-hover:translate-x-0.5 group-hover:text-km-text" />
            </button>
          ))}
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && selected && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-2xl border border-km-border bg-km-panel p-4">
            <TypeIcon icon={selected.icon} />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-km-text">{selected.name}</h3>
              <p className="text-xs text-km-dim">{selected.description}</p>
            </div>
            <MonoChip>{selected.language}</MonoChip>
            <MonoChip>{selected.transport}</MonoChip>
          </div>

          <div className="rounded-2xl border border-km-border bg-km-panel p-5">
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-km-dim">Instance name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-km-border bg-km-bg px-3 py-2 text-sm text-km-text focus:border-km-muted focus:outline-none"
              />
            </div>
            <DynamicForm fields={selected.formSchema} values={values} onChange={(k, v) => setValues((prev) => ({ ...prev, [k]: v }))} />
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="rounded-xl border border-km-border px-4 py-2.5 text-xs text-km-dim hover:text-km-text">
              Back
            </button>
            <button
              onClick={create}
              className="flex items-center gap-1.5 rounded-xl bg-km-text px-5 py-2.5 text-xs font-semibold text-km-bg shadow-lg shadow-black/30 transition-opacity hover:opacity-90"
            >
              <Wrench className="h-3.5 w-3.5" /> Create server
            </button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && selected && (
        <div className="studio-dots flex flex-col items-center rounded-2xl border border-km-border bg-km-panel p-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-km-success/30 bg-km-success/10">
            <Check className="h-6 w-6 text-km-success" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-km-text">{name} is ready</h2>
          <p className="mt-1 text-xs text-km-dim">
            Installed as an isolated {selected.language} server with {selected.toolNames.length} tools.
          </p>
          <div className="mt-4 w-full rounded-xl border border-km-border bg-km-bg p-4 text-left font-mono text-[11px] leading-relaxed">
            <div className="text-km-faint"># isolated environment</div>
            <div className="text-km-text">~/.local/share/SolomanManager/servers/{createdId}/</div>
            <div className="mt-2 text-km-faint"># exposed tools</div>
            <div className="text-km-dim">{selected.toolNames.join(", ")}</div>
          </div>
          <div className="mt-5 flex gap-2">
            <button
              onClick={() => {
                if (createdId) toggleServer(createdId);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-km-text px-4 py-2.5 text-xs font-semibold text-km-bg transition-opacity hover:opacity-90"
            >
              <Play className="h-3.5 w-3.5" /> Start now
            </button>
            <Link
              to="/servers"
              className="flex items-center gap-1.5 rounded-xl border border-km-border px-4 py-2.5 text-xs text-km-dim transition-colors hover:text-km-text"
            >
              View servers <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={() => {
                setStep(1);
                setSelected(null);
                setCreatedId(null);
              }}
              className="rounded-xl border border-km-border px-4 py-2.5 text-xs text-km-dim transition-colors hover:text-km-text"
            >
              Build another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
