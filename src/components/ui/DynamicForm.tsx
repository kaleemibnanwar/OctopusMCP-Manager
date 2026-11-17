import { useState } from "react";
import type { FormField } from "@/data/mock-data";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, HelpCircle } from "lucide-react";

interface DynamicFormProps {
  fields: FormField[];
  values: Record<string, string | boolean | number>;
  onChange: (key: string, value: string | boolean | number) => void;
  readOnly?: boolean;
}

export function DynamicForm({ fields, values, onChange, readOnly }: DynamicFormProps) {
  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <FormFieldRenderer
          key={field.key}
          field={field}
          value={values[field.key] ?? field.defaultValue ?? ""}
          onChange={(v) => onChange(field.key, v)}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}

function FormFieldRenderer({
  field,
  value,
  onChange,
  readOnly,
}: {
  field: FormField;
  value: string | boolean | number;
  onChange: (v: string | boolean | number) => void;
  readOnly?: boolean;
}) {
  switch (field.type) {
    case "text":
    case "email":
    case "number":
      return <TextInput field={field} value={value} onChange={onChange} readOnly={readOnly} />;
    case "password":
      return <PasswordInput field={field} value={value} onChange={onChange} readOnly={readOnly} />;
    case "textarea":
      return <TextAreaInput field={field} value={value} onChange={onChange} readOnly={readOnly} />;
    case "select":
      return <SelectInput field={field} value={value} onChange={onChange} readOnly={readOnly} />;
    case "toggle":
      return <ToggleInput field={field} value={value} onChange={onChange} readOnly={readOnly} />;
    default:
      return null;
  }
}

function FieldLabel({ field }: { field: FormField }) {
  return (
    <div className="mb-1.5 flex items-center gap-1.5">
      <label className="text-xs font-medium text-km-dim">
        {field.label}
        {field.required && <span className="ml-0.5 text-km-error">*</span>}
      </label>
      {field.helpText && (
        <div className="group relative">
          <HelpCircle className="h-3 w-3 text-km-faint" />
          <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-lg border border-km-border bg-km-panel px-3 py-2 text-[11px] text-km-dim opacity-0 shadow-lg transition-opacity group-hover:opacity-100 w-48">
            {field.helpText}
          </div>
        </div>
      )}
    </div>
  );
}

function TextInput({
  field,
  value,
  onChange,
  readOnly,
}: {
  field: FormField;
  value: string | boolean | number;
  onChange: (v: string | boolean | number) => void;
  readOnly?: boolean;
}) {
  return (
    <div>
      <FieldLabel field={field} />
      <input
        type={field.type}
        value={String(value)}
        onChange={(e) => onChange(field.type === "number" ? Number(e.target.value) : e.target.value)}
        placeholder={field.placeholder}
        readOnly={readOnly}
        className={cn(
          "w-full rounded-lg border border-km-border bg-km-bg px-3 py-2 text-sm text-km-text placeholder:text-km-faint focus:border-km-muted focus:outline-none",
          readOnly && "opacity-70"
        )}
      />
    </div>
  );
}

function PasswordInput({
  field,
  value,
  onChange,
  readOnly,
}: {
  field: FormField;
  value: string | boolean | number;
  onChange: (v: string | boolean | number) => void;
  readOnly?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <FieldLabel field={field} />
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          readOnly={readOnly}
          className="w-full rounded-lg border border-km-border bg-km-bg px-3 py-2 pr-10 font-mono text-sm text-km-text placeholder:text-km-faint focus:border-km-muted focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-km-faint hover:text-km-dim"
        >
          {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>
      {field.helpText && !readOnly && (
        <p className="mt-1 text-[11px] text-km-faint">{field.helpText}</p>
      )}
    </div>
  );
}

function TextAreaInput({
  field,
  value,
  onChange,
  readOnly,
}: {
  field: FormField;
  value: string | boolean | number;
  onChange: (v: string | boolean | number) => void;
  readOnly?: boolean;
}) {
  return (
    <div>
      <FieldLabel field={field} />
      <textarea
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        readOnly={readOnly}
        rows={3}
        className="w-full resize-none rounded-lg border border-km-border bg-km-bg px-3 py-2 text-sm text-km-text placeholder:text-km-faint focus:border-km-muted focus:outline-none"
      />
      {field.helpText && (
        <p className="mt-1 text-[11px] text-km-faint">{field.helpText}</p>
      )}
    </div>
  );
}

function SelectInput({
  field,
  value,
  onChange,
  readOnly,
}: {
  field: FormField;
  value: string | boolean | number;
  onChange: (v: string | boolean | number) => void;
  readOnly?: boolean;
}) {
  return (
    <div>
      <FieldLabel field={field} />
      <select
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        disabled={readOnly}
        className="w-full rounded-lg border border-km-border bg-km-bg px-3 py-2 text-sm text-km-text focus:border-km-muted focus:outline-none"
      >
        {field.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ToggleInput({
  field,
  value,
  onChange,
  readOnly,
}: {
  field: FormField;
  value: string | boolean | number;
  onChange: (v: string | boolean | number) => void;
  readOnly?: boolean;
}) {
  const checked = Boolean(value);

  return (
    <div className="flex items-center justify-between">
      <div>
        <label className="text-xs font-medium text-km-dim">{field.label}</label>
        {field.helpText && (
          <p className="text-[11px] text-km-faint">{field.helpText}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => !readOnly && onChange(!checked)}
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors",
          checked ? "bg-km-text" : "bg-km-raised",
          readOnly && "opacity-50"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-km-bg transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}
