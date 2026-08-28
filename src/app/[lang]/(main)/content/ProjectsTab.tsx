"use client";

import { useState } from "react";
import { useDictionary } from "@/i18n/DictionaryProvider";
import { useApiError } from "@/i18n/useApiError";
import type { Project } from "./ContentTabs";
import { ActionChip } from "@/components/ActionChip";

interface Props {
  initialItems: Project[];
}

const EMPTY_FORM = {
  title: "",
  summary: "",
  startDate: "",
  endDate: "",
  current: false,
  url: "",
  sourceUrl: "",
  skills: "",
  publishedAt: "",
};
type FormState = typeof EMPTY_FORM;

function ProjectForm({
  initial, submitLabel, onSubmit, onCancel,
}: {
  initial: FormState; submitLabel: string;
  onSubmit: (data: FormState) => Promise<void>; onCancel: () => void;
}) {
  const { form: t, projects: d } = useDictionary().content;
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
    try { await onSubmit(form); }
    catch (err) { setError(err instanceof Error ? err.message : t.saveFailed); setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Field label={d.fields.title.label} value={form.title} onChange={(v) => set("title", v)} placeholder={d.fields.title.placeholder} required />
      <Field label={d.fields.summary.label} value={form.summary} onChange={(v) => set("summary", v)} multiline placeholder={d.fields.summary.placeholder} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label={d.fields.startDate.label} value={form.startDate} onChange={(v) => set("startDate", v)} placeholder={d.fields.startDate.placeholder} />
        <Field label={d.fields.endDate.label} value={form.endDate} onChange={(v) => set("endDate", v)} placeholder={d.fields.endDate.placeholder} disabled={form.current} />
      </div>
      <label className="flex items-center gap-2 text-sm text-(--cl-muted) cursor-pointer">
        <input type="checkbox" checked={form.current} onChange={(e) => set("current", e.target.checked)} className="rounded accent-(--cl-accent)" />
        {d.current}
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label={d.fields.url.label} value={form.url} onChange={(v) => set("url", v)} placeholder={d.fields.url.placeholder} />
        <Field label={d.fields.sourceUrl.label} value={form.sourceUrl} onChange={(v) => set("sourceUrl", v)} placeholder={d.fields.sourceUrl.placeholder} />
      </div>
      <Field label={d.fields.skills.label} value={form.skills} onChange={(v) => set("skills", v)} placeholder={d.fields.skills.placeholder} />
      <div className="space-y-1">
        <label className="block text-sm font-medium text-(--cl-text)">{d.fields.publishedAt.label}</label>
        <input type="date" value={form.publishedAt} onChange={(e) => set("publishedAt", e.target.value)} className="border border-(--cl-border) rounded-lg px-3 py-2 text-sm bg-white text-(--cl-text) focus:outline-none focus:ring-2 focus:ring-(--cl-accent)" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-2 pt-1">
        <button type="submit" disabled={saving} className="bg-(--cl-accent) text-white rounded-lg px-4 py-1.5 text-sm font-medium disabled:opacity-50 hover:bg-(--cl-accent-hov) transition-colors">{saving ? t.saving : submitLabel}</button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-(--cl-border) px-4 py-1.5 text-sm text-(--cl-muted) hover:border-(--cl-accent) hover:text-(--cl-accent) transition-colors">{t.cancel}</button>
      </div>
    </form>
  );
}

function formToPayload(form: FormState) {
  return {
    title: form.title,
    summary: form.summary,
    startDate: form.startDate,
    endDate: form.endDate,
    current: form.current,
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
    startDate: item.startDate ?? "",
    endDate: item.endDate ?? "",
    current: item.current ?? false,
    url: item.url ?? "",
    sourceUrl: item.sourceUrl ?? "",
    skills: (item.skills ?? []).join(", "),
    publishedAt: item.publishedAt ? item.publishedAt.slice(0, 10) : "",
  };
}

export function ProjectsTab({ initialItems }: Props) {
  const { form: t, present, projects: d } = useDictionary().content;
  const apiError = useApiError();
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
    if (!res.ok) throw new Error(apiError(data, t.createFailed));
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
    if (!res.ok) throw new Error(apiError(data, t.updateFailed));
    setItems((prev) => prev.map((item) => item.id === id ? { id: id, ...payload } : item));
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm(d.confirmDelete)) return;
    const res = await fetch(`/api/content/projects/${id}`, { method: "DELETE" });
    if (!res.ok) { setError(t.deleteFailed); return; }
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-4">
      {!creating ? (
        <button type="button" onClick={() => setCreating(true)} className="flex items-center gap-2 rounded-lg border border-dashed border-(--cl-border) px-4 py-2 text-sm text-(--cl-muted) hover:border-(--cl-accent) hover:text-(--cl-accent) transition-colors">
          {d.add}
        </button>
      ) : (
        <div className="bg-white border border-(--cl-accent) rounded-xl px-5 py-4">
          <p className="text-sm font-medium text-(--cl-text) mb-4">{d.new}</p>
          <ProjectForm initial={EMPTY_FORM} submitLabel={t.create} onSubmit={handleCreate} onCancel={() => setCreating(false)} />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {items.length === 0 && !creating && (
        <p className="text-sm text-(--cl-muted)">{d.empty}</p>
      )}

      {items.map((item) => (
        <div key={item.id} className="bg-white border border-(--cl-border) rounded-xl px-5 py-4 space-y-3">
          {editingId === item.id ? (
            <>
              <p className="text-sm font-medium text-(--cl-text)">{d.edit}</p>
              <ProjectForm initial={itemToForm(item)} submitLabel={t.save} onSubmit={(form) => handleUpdate(item.id, form)} onCancel={() => setEditingId(null)} />
            </>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-(--cl-text)">{item.title}</p>
                <p className="text-sm text-(--cl-muted) mt-0.5">
                  {[
                    item.startDate || item.endDate || item.current
                      ? `${item.startDate ?? "?"} – ${item.current ? present : (item.endDate ?? "?")}`
                      : null,
                    item.skills?.join(", "),
                    item.publishedAt ? item.publishedAt.slice(0, 10) : null,
                  ].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <ActionChip onClick={() => setEditingId(item.id)}>{t.edit}</ActionChip>
                <ActionChip tone="danger" onClick={() => handleDelete(item.id)}>{t.delete}</ActionChip>
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
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; multiline?: boolean; disabled?: boolean;
}) {
  const cls = "w-full border border-(--cl-border) rounded-lg px-3 py-2 text-sm bg-white text-(--cl-text) placeholder:text-(--cl-muted) focus:outline-none focus:ring-2 focus:ring-(--cl-accent) disabled:opacity-50 disabled:bg-(--cl-pill)";
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-(--cl-text)">{label}</label>
      {multiline
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className={cls} />
        : <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} disabled={disabled} className={cls} />}
    </div>
  );
}
