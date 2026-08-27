"use client";

import { useState } from "react";
import type { Education } from "./ContentTabs";
import { ActionChip } from "@/components/ActionChip";

interface Props {
  initialItems: Education[];
}

const EMPTY_FORM = {
  institution: "",
  degree: "",
  field: "",
  startDate: "",
  endDate: "",
  current: false,
  description: "",
};

type FormState = typeof EMPTY_FORM;

function EducationForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: FormState;
  submitLabel: string;
  onSubmit: (data: FormState) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Field label="Institution *" value={form.institution} onChange={(v) => set("institution", v)} placeholder="MIT, Uppsala University…" required />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Degree" value={form.degree} onChange={(v) => set("degree", v)} placeholder="B.Sc., M.Sc., PhD…" />
        <Field label="Field of study" value={form.field} onChange={(v) => set("field", v)} placeholder="Computer Science" />
        <Field label="Start date" value={form.startDate} onChange={(v) => set("startDate", v)} placeholder="2018 or 2018-09" />
        <Field label="End date" value={form.endDate} onChange={(v) => set("endDate", v)} placeholder="2022 or 2022-06" disabled={form.current} />
      </div>
      <label className="flex items-center gap-2 text-sm text-(--cl-muted) cursor-pointer">
        <input type="checkbox" checked={form.current} onChange={(e) => set("current", e.target.checked)} className="rounded accent-(--cl-accent)" />
        Currently studying
      </label>
      <Field label="Description" value={form.description} onChange={(v) => set("description", v)} multiline placeholder="Relevant coursework, thesis, activities…" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-2 pt-1">
        <button type="submit" disabled={saving} className="bg-(--cl-accent) text-white rounded-lg px-4 py-1.5 text-sm font-medium disabled:opacity-50 hover:bg-(--cl-accent-hov) transition-colors">
          {saving ? "Saving…" : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-(--cl-border) px-4 py-1.5 text-sm text-(--cl-muted) hover:border-(--cl-accent) hover:text-(--cl-accent) transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

function itemToForm(item: Education): FormState {
  return {
    institution: item.institution ?? "",
    degree: item.degree ?? "",
    field: item.field ?? "",
    startDate: item.startDate ?? "",
    endDate: item.endDate ?? "",
    current: item.current ?? false,
    description: item.description ?? "",
  };
}

export function EducationTab({ initialItems }: Props) {
  const [items, setItems] = useState<Education[]>(initialItems);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(form: FormState) {
    const res = await fetch("/api/content/education", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to create");
    setItems((prev) => [{ id: data.id, ...form }, ...prev]);
    setCreating(false);
  }

  async function handleUpdate(id: string, form: FormState) {
    const res = await fetch(`/api/content/education/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to update");
    setItems((prev) => prev.map((item) => item.id === id ? { id: id, ...form } : item));
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this education entry?")) return;
    const res = await fetch(`/api/content/education/${id}`, { method: "DELETE" });
    if (!res.ok) { setError("Delete failed"); return; }
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-4">
      {!creating ? (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 rounded-lg border border-dashed border-(--cl-border) px-4 py-2 text-sm text-(--cl-muted) hover:border-(--cl-accent) hover:text-(--cl-accent) transition-colors"
        >
          + Add education
        </button>
      ) : (
        <div className="bg-white border border-(--cl-accent) rounded-xl px-5 py-4">
          <p className="text-sm font-medium text-(--cl-text) mb-4">New education</p>
          <EducationForm initial={EMPTY_FORM} submitLabel="Create" onSubmit={handleCreate} onCancel={() => setCreating(false)} />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {items.length === 0 && !creating && (
        <p className="text-sm text-(--cl-muted)">No education entries yet — add one above.</p>
      )}

      {items.map((item) => (
        <div key={item.id} className="bg-white border border-(--cl-border) rounded-xl px-5 py-4 space-y-3">
          {editingId === item.id ? (
            <>
              <p className="text-sm font-medium text-(--cl-text)">Edit education</p>
              <EducationForm
                initial={itemToForm(item)}
                submitLabel="Save changes"
                onSubmit={(form) => handleUpdate(item.id, form)}
                onCancel={() => setEditingId(null)}
              />
            </>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-(--cl-text)">
                  {item.degree ? `${item.degree}${item.field ? ` in ${item.field}` : ""}` : item.institution}
                </p>
                <p className="text-xs text-(--cl-muted) mt-0.5">
                  {item.degree ? item.institution : ""}{item.startDate ? ` · ${item.startDate} – ${item.current ? "Present" : (item.endDate ?? "?")}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <ActionChip onClick={() => setEditingId(item.id)}>Edit</ActionChip>
                <ActionChip tone="danger" onClick={() => handleDelete(item.id)}>Delete</ActionChip>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, required, multiline, disabled,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  required?: boolean; multiline?: boolean; disabled?: boolean;
}) {
  const cls = `w-full border border-(--cl-border) rounded-lg px-3 py-2 text-sm bg-white text-(--cl-text) placeholder:text-(--cl-muted) focus:outline-none focus:ring-2 focus:ring-(--cl-accent) disabled:opacity-50 disabled:bg-(--cl-pill)`;
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-(--cl-text)">{label}</label>
      {multiline
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className={cls} />
        : <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} disabled={disabled} className={cls} />}
    </div>
  );
}
