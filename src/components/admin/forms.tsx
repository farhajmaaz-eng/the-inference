"use client";
import { useActionState } from "react";
import type { ActionState } from "@/app/admin/actions";
export function Field({
  label,
  name,
  value = "",
  type = "text",
  required = false,
  hint,
  wide = false,
  rows,
  min,
  max,
  step,
}: {
  label: string;
  name: string;
  value?: string | number | null;
  type?: string;
  required?: boolean;
  hint?: string;
  wide?: boolean;
  rows?: number;
  min?: number;
  max?: number;
  step?: string;
}) {
  return (
    <label className={`field ${wide ? "wide" : ""}`}>
      {label}
      {rows ? (
        <textarea
          name={name}
          defaultValue={value ?? ""}
          required={required}
          rows={rows}
        />
      ) : (
        <input
          type={type}
          name={name}
          defaultValue={value ?? ""}
          required={required}
          min={min}
          max={max}
          step={step}
        />
      )}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function SelectField({
  label,
  name,
  value = "",
  children,
}: {
  label: string;
  name: string;
  value?: string | null;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      {label}
      <select name={name} defaultValue={value ?? ""}>
        {children}
      </select>
    </label>
  );
}
export function StatusSelect({
  value = "draft",
  entity = false,
}: {
  value?: string;
  entity?: boolean;
}) {
  return (
    <SelectField label="Editorial status" name="status" value={value}>
      <option value="draft">Draft — private</option>
      {!entity && <option value="review">Review — private</option>}
      <option value="published">Published — public</option>
      <option value="archived">Archived — private</option>
    </SelectField>
  );
}
export function ManagedForm({
  action,
  children,
  label = "Save changes",
}: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  label?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="admin-form">
      {children}
      <div className="form-actions">
        <button className="button" disabled={pending}>
          {pending ? "Saving…" : label}
        </button>
        {state.error && (
          <p className="notice error-notice" role="alert">
            {state.error}
          </p>
        )}
        {state.success && (
          <p className="notice" role="status">
            {state.success}
          </p>
        )}
      </div>
    </form>
  );
}
