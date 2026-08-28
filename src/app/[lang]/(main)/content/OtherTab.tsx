"use client";

import { useState } from "react";
import type { Other } from "./ContentTabs";
import { ActionChip } from "@/components/ActionChip";

interface Props {
  initialItems: Other[];
}

const EMPTY_FORM = { title: "", subtitle: "", date: "", description: "", url: "", order: "" };
type FormState = typeof EMPTY_FORM;

function OtherForm({
  initial, submitLabel, onSubmit, onCancel,
}: {
  initial: FormState; submitLabel: string;
  onSubmit: (data: FormState) => Promise<void>; onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try { await onSubmit(form); }
    catch (err) { setError(err instanceof Error ? err.message : "Save failed"); setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Title *" value={form.title} onChange={(v) => set("title", v)} placeholder='e.g. "AWS Certified Developer"' required />
        <Field label="Subtitle" value={form.subtitle} onChange={(v) => set("subtitle", v)} placeholder="Issuer or organisation" />
        <Field label="Date" value={form.date} onChange={(v) => set("date", v)} placeholder="2023 or 2023-06" />
        <Field label="URL" value={form.url} onChange={(v) => set("url", v)} placeholder="https://certificate.link" />
      </div>
      <Field label="Description" value={form.description} onChange={(v) => set("description", v)} multiline placeholder="Details about this achievement…" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-2 pt-1">
        <button type="submit" disabled={saving} className="bg-(--cl-accent) text-white rounded-lg px-4 py-1.5 text-sm font-medium disabled:opacity-50 hover:bg-(--cl-accent-hov) transition-colors">{saving ? "Saving…" : submitLabel}</button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-(--cl-border) px-4 py-1.5 text-sm text-(--cl-muted) hover:border-(--cl-accent) hover:text-(--cl-accent) transition-colors">Cancel</button>
      </div>
    </form>
  );
}

function itemToForm(item: Other): FormState {
  return {
    title: item.title ?? "",
    subtitle: item.subtitle ?? "",
    date: item.date ?? "",
    description: item.description ?? "",
    url: item.url ?? "",
    order: item.order != null ? String(item.order) : "",
  };
}

export function OtherTab({ initialItems }: Props) {
  const [items, setItems] = useState<Other[]>(initialItems);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(form: FormState) {
    const res = await fetch("/api/content/other", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to create");
    setItems((prev) => [...prev, { id: data.id, title: form.title, subtitle: form.subtitle || undefined, date: form.date || undefined, description: form.description || undefined, url: form.url || undefined, order: form.order ? Number(form.order) : undefined }]);
    setCreating(false);
  }

  async function handleUpdate(id: string, form: FormState) {
    const res = await fetch(`/api/content/other/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to update");
    setItems((prev) => prev.map((item) => item.id === id ? { id: id, title: form.title, subtitle: form.subtitle || undefined, date: form.date || undefined, description: form.description || undefined, url: form.url || undefined, order: form.order ? Number(form.order) : undefined } : item));
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this entry?")) return;
    const res = await fetch(`/api/content/other/${id}`, { method: "DELETE" });
    if (!res.ok) { setError("Delete failed"); return; }
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-4">
      {!creating ? (
        <button type="button" onClick={() => setCreating(true)} className="flex items-center gap-2 rounded-lg border border-dashed border-(--cl-border) px-4 py-2 text-sm text-(--cl-muted) hover:border-(--cl-accent) hover:text-(--cl-accent) transition-colors">
          + Add entry
        </button>
      ) : (
        <div className="bg-white border border-(--cl-accent) rounded-xl px-5 py-4">
          <p className="text-sm font-medium text-(--cl-text) mb-4">New entry</p>
          <OtherForm initial={EMPTY_FORM} submitLabel="Create" onSubmit={handleCreate} onCancel={() => setCreating(false)} />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {items.length === 0 && !creating && (
        <p className="text-sm text-(--cl-muted)">No entries yet — add one above.</p>
      )}

      {items.map((item) => (
        <div key={item.id} className="bg-white border border-(--cl-border) rounded-xl px-5 py-4 space-y-3">
          {editingId === item.id ? (
            <>
              <p className="text-sm font-medium text-(--cl-text)">Edit entry</p>
              <OtherForm initial={itemToForm(item)} submitLabel="Save changes" onSubmit={(form) => handleUpdate(item.id, form)} onCancel={() => setEditingId(null)} />
            </>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-(--cl-text)">{item.title}</p>
                <p className="text-sm text-(--cl-muted) mt-0.5">
                  {[item.subtitle, item.date].filter(Boolean).join(" · ")}
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
  label, value, onChange, placeholder, required, multiline,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; multiline?: boolean;
}) {
  const cls = "w-full border border-(--cl-border) rounded-lg px-3 py-2 text-sm bg-white text-(--cl-text) placeholder:text-(--cl-muted) focus:outline-none focus:ring-2 focus:ring-(--cl-accent)";
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-(--cl-text)">{label}</label>
      {multiline
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className={cls} />
        : <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} className={cls} />}
    </div>
  );
}
