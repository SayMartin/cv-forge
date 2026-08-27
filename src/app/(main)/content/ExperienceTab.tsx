"use client";

import { useState } from "react";
import type { Experience } from "./ContentTabs";
import { ActionChip } from "@/components/ActionChip";

interface Props {
  initialItems: Experience[];
}

const EMPTY_FORM = {
  company: "",
  role: "",
  startDate: "",
  endDate: "",
  current: false,
  description: "",
  url: "",
  skills: "",
};

type FormState = typeof EMPTY_FORM;

function ExperienceForm({
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Company *" value={form.company} onChange={(v) => set("company", v)} placeholder="Acme Corp" required />
        <Field label="Role / Title *" value={form.role} onChange={(v) => set("role", v)} placeholder="Senior Engineer" required />
        <Field label="Start date" value={form.startDate} onChange={(v) => set("startDate", v)} placeholder="2021 or 2021-06" />
        <Field label="End date" value={form.endDate} onChange={(v) => set("endDate", v)} placeholder="2024 or 2024-03" disabled={form.current} />
      </div>
      <label className="flex items-center gap-2 text-sm text-(--cl-muted) cursor-pointer">
        <input type="checkbox" checked={form.current} onChange={(e) => set("current", e.target.checked)} className="rounded accent-(--cl-accent)" />
        Current position
      </label>
      <Field label="Description" value={form.description} onChange={(v) => set("description", v)} multiline placeholder="Key responsibilities and achievements…" />
      <Field label="Live URL" value={form.url} onChange={(v) => set("url", v)} placeholder="https://example.com" />
      <Field label="Skills used (comma-separated)" value={form.skills} onChange={(v) => set("skills", v)} placeholder="React, TypeScript, Node.js" />
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

function formToPayload(form: FormState) {
  return {
    company: form.company,
    role: form.role,
    startDate: form.startDate,
    endDate: form.endDate,
    current: form.current,
    description: form.description,
    url: form.url,
    skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
  };
}

function itemToForm(item: Experience): FormState {
  return {
    company: item.company ?? "",
    role: item.role ?? "",
    startDate: item.startDate ?? "",
    endDate: item.endDate ?? "",
    current: item.current ?? false,
    description: item.description ?? "",
    url: item.url ?? "",
    skills: (item.skills ?? []).join(", "),
  };
}

export function ExperienceTab({ initialItems }: Props) {
  const [items, setItems] = useState<Experience[]>(initialItems);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(form: FormState) {
    const res = await fetch("/api/content/experience", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formToPayload(form)),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to create");
    const payload = formToPayload(form);
    setItems((prev) => [{ id: data.id, ...payload }, ...prev]);
    setCreating(false);
  }

  async function handleUpdate(id: string, form: FormState) {
    const res = await fetch(`/api/content/experience/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formToPayload(form)),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to update");
    const payload = formToPayload(form);
    setItems((prev) => prev.map((item) => item.id === id ? { id: id, ...payload } : item));
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this experience entry?")) return;
    const res = await fetch(`/api/content/experience/${id}`, { method: "DELETE" });
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
          + Add experience
        </button>
      ) : (
        <div className="bg-white border border-(--cl-accent) rounded-xl px-5 py-4">
          <p className="text-sm font-medium text-(--cl-text) mb-4">New experience</p>
          <ExperienceForm initial={EMPTY_FORM} submitLabel="Create" onSubmit={handleCreate} onCancel={() => setCreating(false)} />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {items.length === 0 && !creating && (
        <p className="text-sm text-(--cl-muted)">No experience entries yet — add one above.</p>
      )}

      {items.map((item) => (
        <div key={item.id} className="bg-white border border-(--cl-border) rounded-xl px-5 py-4 space-y-3">
          {editingId === item.id ? (
            <>
              <p className="text-sm font-medium text-(--cl-text)">Edit experience</p>
              <ExperienceForm
                initial={itemToForm(item)}
                submitLabel="Save changes"
                onSubmit={(form) => handleUpdate(item.id, form)}
                onCancel={() => setEditingId(null)}
              />
            </>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-(--cl-text)">{item.role} @ {item.company}</p>
                <p className="text-sm text-(--cl-muted) mt-0.5">
                  {item.startDate ?? "?"} – {item.current ? "Present" : (item.endDate ?? "?")}
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
  label,
  value,
  onChange,
  placeholder,
  required,
  multiline,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  disabled?: boolean;
}) {
  const cls = `w-full border border-(--cl-border) rounded-lg px-3 py-2 text-sm bg-white text-(--cl-text) placeholder:text-(--cl-muted) focus:outline-none focus:ring-2 focus:ring-(--cl-accent) disabled:opacity-50 disabled:bg-(--cl-pill)`;
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-(--cl-text)">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className={cls} />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} disabled={disabled} className={cls} />
      )}
    </div>
  );
}
