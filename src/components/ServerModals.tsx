import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { DynamicForm } from "@/components/ui/DynamicForm";
import { TypeIcon } from "@/components/ui/bits";
import { useStore } from "@/store/store";
import { mcpServerTypes, type InstalledServer, type MCPServerType } from "@/data/mock-data";

type ConfigValues = Record<string, string | boolean | number>;

function defaultsFor(type: MCPServerType): ConfigValues {
  const values: ConfigValues = {};
  for (const f of type.formSchema) values[f.key] = f.defaultValue ?? (f.type === "toggle" ? false : "");
  return values;
}

function missingRequired(type: MCPServerType, values: ConfigValues): string[] {
  return type.formSchema
    .filter((f) => f.required && (values[f.key] === "" || values[f.key] === undefined))
    .map((f) => f.label);
}

/** Install a new instance of a server type — flexible per-type credential form */
export function InstallServerModal({ type, open, onClose }: { type: MCPServerType | null; open: boolean; onClose: () => void }) {
  const { installServer, toast } = useStore();
  const [name, setName] = useState("");
  const [values, setValues] = useState<ConfigValues>({});
  const [initFor, setInitFor] = useState<string | null>(null);

  if (open && type && initFor !== type.id) {
    setInitFor(type.id);
    setName(type.name);
    setValues(defaultsFor(type));
  }
  if (!open && initFor !== null) setInitFor(null);

  if (!type) return null;

  const save = () => {
    const missing = missingRequired(type, values);
    if (!name.trim()) {
      toast("Give this server instance a name", "error");
      return;
    }
    if (missing.length > 0) {
      toast(`Required: ${missing.join(", ")}`, "error");
      return;
    }
    installServer(type.id, name.trim(), values);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Install ${type.name}`} subtitle={type.description} wide>
      <div className="mb-5 flex items-center gap-3 rounded-xl border border-km-border bg-km-bg/60 p-3">
        <TypeIcon icon={type.icon} />
        <div className="text-xs text-km-dim">
          <span className="font-mono">{type.language}</span> · <span className="font-mono">{type.transport}</span> ·{" "}
          {type.toolNames.length} tools
        </div>
      </div>

      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-medium text-km-dim">Instance name *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`e.g. ${type.name} — Work`}
          className="w-full rounded-lg border border-km-border bg-km-bg px-3 py-2 text-sm text-km-text placeholder:text-km-faint focus:border-km-muted focus:outline-none"
        />
      </div>

      <DynamicForm fields={type.formSchema} values={values} onChange={(k, v) => setValues((prev) => ({ ...prev, [k]: v }))} />

      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg border border-km-border px-4 py-2 text-xs text-km-dim hover:text-km-text">
          Cancel
        </button>
        <button onClick={save} className="rounded-lg bg-km-text px-4 py-2 text-xs font-medium text-km-bg transition-opacity hover:opacity-90">
          Install server
        </button>
      </div>
    </Modal>
  );
}

/** Edit an installed server's name + credentials */
export function ConfigureServerModal({ server, open, onClose }: { server: InstalledServer | null; open: boolean; onClose: () => void }) {
  const { updateServer, toast } = useStore();
  const [name, setName] = useState("");
  const [values, setValues] = useState<ConfigValues>({});
  const [initFor, setInitFor] = useState<string | null>(null);

  const type = server ? mcpServerTypes.find((t) => t.id === server.typeId) : null;

  if (open && server && initFor !== server.id) {
    setInitFor(server.id);
    setName(server.name);
    setValues({ ...(type ? defaultsFor(type) : {}), ...server.config });
  }
  if (!open && initFor !== null) setInitFor(null);

  if (!server || !type) return null;

  const save = () => {
    const missing = missingRequired(type, values);
    if (!name.trim()) {
      toast("Instance name cannot be empty", "error");
      return;
    }
    if (missing.length > 0) {
      toast(`Required: ${missing.join(", ")}`, "error");
      return;
    }
    updateServer(server.id, { name: name.trim(), config: values });
    toast(`${name.trim()} configuration saved`);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Configure ${server.name}`} subtitle={`${type.name} · ${type.language} · ${type.transport}`} wide>
      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-medium text-km-dim">Instance name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-km-border bg-km-bg px-3 py-2 text-sm text-km-text focus:border-km-muted focus:outline-none"
        />
      </div>

      <DynamicForm fields={type.formSchema} values={values} onChange={(k, v) => setValues((prev) => ({ ...prev, [k]: v }))} />

      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg border border-km-border px-4 py-2 text-xs text-km-dim hover:text-km-text">
          Cancel
        </button>
        <button onClick={save} className="rounded-lg bg-km-text px-4 py-2 text-xs font-medium text-km-bg transition-opacity hover:opacity-90">
          Save configuration
        </button>
      </div>
    </Modal>
  );
}
