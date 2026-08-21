"use client";

import { useState } from "react";
import { SKILL_CATEGORIES } from "@/lib/cv-content-types";
import type { Skill } from "./ContentTabs";

interface Props {
  initialItems: Skill[];
}

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const EMPTY_FORM = { name: "", category: "", level: "", cefrLevel: "", order: "" };
type FormState = typeof EMPTY_FORM;

function SkillForm({
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
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-(--cl-text)">Name *</label>
          <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="TypeScript" required className="w-full border border-(--cl-border) rounded-lg px-3 py-2 text-sm bg-white text-(--cl-text) placeholder:text-(--cl-muted) focus:outline-none focus:ring-2 focus:ring-(--cl-accent)" />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-(--cl-text)">Category</label>
          <select value={form.category} onChange={(e) => set("category", e.target.value)} className="w-full border border-(--cl-border) rounded-lg px-3 py-2 text-sm bg-white text-(--cl-text) focus:outline-none focus:ring-2 focus:ring-(--cl-accent)">
            <option value="">— none —</option>
            {SKILL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-(--cl-text)">Level (1–5)</label>
          <input type="number" min={1} max={5} value={form.level} onChange={(e) => set("level", e.target.value)} placeholder="e.g. 4" className="w-full border border-(--cl-border) rounded-lg px-3 py-2 text-sm bg-white text-(--cl-text) placeholder:text-(--cl-muted) focus:outline-none focus:ring-2 focus:ring-(--cl-accent)" />
        </div>
        {form.category === "Language" && (
          <div className="space-y-1">
            <label className="block text-xs font-medium text-(--cl-text)">CEFR level</label>
            <select value={form.cefrLevel} onChange={(e) => set("cefrLevel", e.target.value)} className="w-full border border-(--cl-border) rounded-lg px-3 py-2 text-sm bg-white text-(--cl-text) focus:outline-none focus:ring-2 focus:ring-(--cl-accent)">
              <option value="">— none —</option>
              {CEFR_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        )}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-(--cl-text)">Display order</label>
          <input type="number" value={form.order} onChange={(e) => set("order", e.target.value)} placeholder="e.g. 10" className="w-full border border-(--cl-border) rounded-lg px-3 py-2 text-sm bg-white text-(--cl-text) placeholder:text-(--cl-muted) focus:outline-none focus:ring-2 focus:ring-(--cl-accent)" />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-2 pt-1">
        <button type="submit" disabled={saving} className="bg-(--cl-accent) text-white rounded-lg px-4 py-1.5 text-sm font-medium disabled:opacity-50 hover:bg-(--cl-accent-hov) transition-colors">{saving ? "Saving…" : submitLabel}</button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-(--cl-border) px-4 py-1.5 text-sm text-(--cl-muted) hover:border-(--cl-accent) hover:text-(--cl-accent) transition-colors">Cancel</button>
      </div>
    </form>
  );
}

function itemToForm(item: Skill): FormState {
  return {
    name: item.name ?? "",
    category: item.category ?? "",
    level: item.level != null ? String(item.level) : "",
    cefrLevel: item.cefrLevel ?? "",
    order: item.order != null ? String(item.order) : "",
  };
}

export function SkillsTab({ initialItems }: Props) {
  const [items, setItems] = useState<Skill[]>(initialItems);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(form: FormState) {
    const res = await fetch("/api/content/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, category: form.category, level: form.level, cefrLevel: form.cefrLevel, order: form.order }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to create");
    setItems((prev) => [...prev, { id: data.id, name: form.name, category: form.category || undefined, level: form.level ? Number(form.level) : undefined, cefrLevel: form.cefrLevel || undefined, order: form.order ? Number(form.order) : undefined }]);
    setCreating(false);
  }

  async function handleUpdate(id: string, form: FormState) {
    const res = await fetch(`/api/content/skills/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, category: form.category, level: form.level, cefrLevel: form.cefrLevel, order: form.order }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to update");
    setItems((prev) => prev.map((item) => item.id === id ? { id: id, name: form.name, category: form.category || undefined, level: form.level ? Number(form.level) : undefined, cefrLevel: form.cefrLevel || undefined, order: form.order ? Number(form.order) : undefined } : item));
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this skill?")) return;
    const res = await fetch(`/api/content/skills/${id}`, { method: "DELETE" });
    if (!res.ok) { setError("Delete failed"); return; }
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-4">
      {!creating ? (
        <button type="button" onClick={() => setCreating(true)} className="flex items-center gap-2 rounded-lg border border-dashed border-(--cl-border) px-4 py-2 text-sm text-(--cl-muted) hover:border-(--cl-accent) hover:text-(--cl-accent) transition-colors">
          + Add skill
        </button>
      ) : (
        <div className="bg-white border border-(--cl-accent) rounded-xl px-5 py-4">
          <p className="text-sm font-medium text-(--cl-text) mb-4">New skill</p>
          <SkillForm initial={EMPTY_FORM} submitLabel="Create" onSubmit={handleCreate} onCancel={() => setCreating(false)} />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {items.length === 0 && !creating && (
        <p className="text-sm text-(--cl-muted)">No skills yet — add one above.</p>
      )}

      {items.map((item) => (
        <div key={item.id} className="bg-white border border-(--cl-border) rounded-xl px-5 py-4 space-y-3">
          {editingId === item.id ? (
            <>
              <p className="text-sm font-medium text-(--cl-text)">Edit skill</p>
              <SkillForm initial={itemToForm(item)} submitLabel="Save changes" onSubmit={(form) => handleUpdate(item.id, form)} onCancel={() => setEditingId(null)} />
            </>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-(--cl-text)">{item.name}</p>
                <p className="text-xs text-(--cl-muted) mt-0.5">
                  {[item.category, item.level != null ? `Level ${item.level}/5` : null, item.cefrLevel ? `CEFR ${item.cefrLevel}` : null].filter(Boolean).join(" · ")}
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
