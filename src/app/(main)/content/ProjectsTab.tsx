"use client";

import { useState } from "react";
import type { Project } from "./ContentTabs";

interface Props {
  initialItems: Project[];
}

const EMPTY_FORM = { title: "", summary: "", url: "", sourceUrl: "", skills: "", publishedAt: "" };
type FormState = typeof EMPTY_FORM;

function ProjectForm({
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
      <Field label="Title *" value={form.title} onChange={(v) => set("title", v)} placeholder="My Project" required />
      <Field label="Summary" value={form.summary} onChange={(v) => set("summary", v)} multiline placeholder="Short description of the project…" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Live URL" value={form.url} onChange={(v) => set("url", v)} placeholder="https://myproject.com" />
        <Field label="Source / GitHub URL" value={form.sourceUrl} onChange={(v) => set("sourceUrl", v)} placeholder="https://github.com/…" />
      </div>
      <Field label="Technologies (comma-separated)" value={form.skills} onChange={(v) => set("skills", v)} placeholder="React, Node.js, PostgreSQL" />
      <div className="space-y-1">
        <label className="block text-xs font-medium text-(--cl-text)">Published date</label>
        <input type="date" value={form.publishedAt} onChange={(e) => set("publishedAt", e.target.value)} className="border border-(--cl-border) rounded-lg px-3 py-2 text-sm bg-white text-(--cl-text) focus:outline-none focus:ring-2 focus:ring-(--cl-accent)" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-2 pt-1">
        <button type="submit" disabled={saving} className="bg-(--cl-accent) text-white rounded-lg px-4 py-1.5 text-sm font-medium disabled:opacity-50 hover:bg-(--cl-accent-hov) transition-colors">{saving ? "Saving…" : submitLabel}</button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-(--cl-border) px-4 py-1.5 text-sm text-(--cl-muted) hover:border-(--cl-accent) hover:text-(--cl-accent) transition-colors">Cancel</button>
      </div>
    </form>
  );
}

function formToPayload(form: FormState) {
  return {
    title: form.title,
    summary: form.summary,
    url: form.url,
    sourceUrl: form.sourceUrl,
    skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
    publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : "",
  };
}

function itemToForm(item: Project): FormState {
  return {
    title: item.title ?? "",
    summary: item.summary ?? "",
    url: item.url ?? "",
    sourceUrl: item.sourceUrl ?? "",
    skills: (item.skills ?? []).join(", "),
    publishedAt: item.publishedAt ? item.publishedAt.slice(0, 10) : "",
  };
}

export function ProjectsTab({ initialItems }: Props) {
  const [items, setItems] = useState<Project[]>(initialItems);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(form: FormState) {
    const payload = formToPayload(form);
    const res = await fetch("/api/content/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to create");
    setItems((prev) => [{ id: data.id, ...payload }, ...prev]);
    setCreating(false);
  }

  async function handleUpdate(id: string, form: FormState) {
    const payload = formToPayload(form);
    const res = await fetch(`/api/content/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to update");
    setItems((prev) => prev.map((item) => item.id === id ? { id: id, ...payload } : item));
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this project?")) return;
    const res = await fetch(`/api/content/projects/${id}`, { method: "DELETE" });
    if (!res.ok) { setError("Delete failed"); return; }
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-4">
      {!creating ? (
        <button type="button" onClick={() => setCreating(true)} className="flex items-center gap-2 rounded-lg border border-dashed border-(--cl-border) px-4 py-2 text-sm text-(--cl-muted) hover:border-(--cl-accent) hover:text-(--cl-accent) transition-colors">
          + Add project
        </button>
      ) : (
        <div className="bg-white border border-(--cl-accent) rounded-xl px-5 py-4">
          <p className="text-sm font-medium text-(--cl-text) mb-4">New project</p>
          <ProjectForm initial={EMPTY_FORM} submitLabel="Create" onSubmit={handleCreate} onCancel={() => setCreating(false)} />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {items.length === 0 && !creating && (
        <p className="text-sm text-(--cl-muted)">No projects yet — add one above.</p>
      )}

      {items.map((item) => (
        <div key={item.id} className="bg-white border border-(--cl-border) rounded-xl px-5 py-4 space-y-3">
          {editingId === item.id ? (
            <>
              <p className="text-sm font-medium text-(--cl-text)">Edit project</p>
              <ProjectForm initial={itemToForm(item)} submitLabel="Save changes" onSubmit={(form) => handleUpdate(item.id, form)} onCancel={() => setEditingId(null)} />
            </>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-(--cl-text)">{item.title}</p>
                <p className="text-xs text-(--cl-muted) mt-0.5">
                  {[item.skills?.join(", "), item.publishedAt ? item.publishedAt.slice(0, 10) : null].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button onClick={() => setEditingId(item.id)} className="text-xs text-(--cl-muted) hover:text-(--cl-accent) transition-colors">Edit</button>
                <button onClick={() => handleDelete(item.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Delete</button>
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
      <label className="block text-xs font-medium text-(--cl-text)">{label}</label>
      {multiline
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className={cls} />
        : <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} className={cls} />}
    </div>
  );
}
