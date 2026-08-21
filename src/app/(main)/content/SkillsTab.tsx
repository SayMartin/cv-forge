"use client";

import { useState } from "react";
import { SkillCategoryManager } from "./SkillCategoryManager";
import type { Skill, SkillCategoryOption } from "./ContentTabs";

interface Props {
  initialItems: Skill[];
  categories: SkillCategoryOption[];
}

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const EMPTY_FORM = { name: "", level: "", cefrLevel: "" };
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
          <label className="block text-xs font-medium text-(--cl-text)">Level (1–5)</label>
          <input type="number" min={1} max={5} value={form.level} onChange={(e) => set("level", e.target.value)} placeholder="e.g. 4" className="w-full border border-(--cl-border) rounded-lg px-3 py-2 text-sm bg-white text-(--cl-text) placeholder:text-(--cl-muted) focus:outline-none focus:ring-2 focus:ring-(--cl-accent)" />
        </div>
        {/* Always offered, never gated on a category: whether a skill is a spoken
            language is a property of the skill, while which group it appears under
            is decided per CV. The level only renders on a CV that places this skill
            in the language category. */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-(--cl-text)">CEFR level</label>
          <select value={form.cefrLevel} onChange={(e) => set("cefrLevel", e.target.value)} className="w-full border border-(--cl-border) rounded-lg px-3 py-2 text-sm bg-white text-(--cl-text) focus:outline-none focus:ring-2 focus:ring-(--cl-accent)">
            <option value="">— none —</option>
            {CEFR_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
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
    level: item.level != null ? String(item.level) : "",
    cefrLevel: item.cefrLevel ?? "",
  };
}

function byName(a: Skill, b: Skill) {
  return a.name.localeCompare(b.name);
}

export function SkillsTab({ initialItems, categories: initialCategories }: Props) {
  const [items, setItems] = useState<Skill[]>([...initialItems].sort(byName));
  const [categories, setCategories] = useState<SkillCategoryOption[]>(initialCategories);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const editingSkill = items.find((item) => item.id === editingId) ?? null;

  function toItem(id: string, form: FormState): Skill {
    return {
      id,
      name: form.name,
      level: form.level ? Number(form.level) : undefined,
      cefrLevel: form.cefrLevel || undefined,
    };
  }

  function toPayload(form: FormState) {
    return {
      name: form.name,
      level: form.level,
      cefrLevel: form.cefrLevel,
    };
  }

  async function handleCreate(form: FormState) {
    const res = await fetch("/api/content/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(form)),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to create");
    setItems((prev) => [...prev, toItem(data.id, form)].sort(byName));
    setCreating(false);
  }

  async function handleUpdate(id: string, form: FormState) {
    const res = await fetch(`/api/content/skills/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(form)),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to update");
    setItems((prev) =>
      prev.map((item) => (item.id === id ? toItem(id, form) : item)).sort(byName),
    );
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
      <SkillCategoryManager categories={categories} onChange={setCategories} />

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

      {editingSkill && (
        <div className="bg-white border border-(--cl-accent) rounded-xl px-5 py-4">
          <p className="text-sm font-medium text-(--cl-text) mb-4">Edit {editingSkill.name}</p>
          <SkillForm
            initial={itemToForm(editingSkill)}
            submitLabel="Save changes"
            onSubmit={(form) => handleUpdate(editingSkill.id, form)}
            onCancel={() => setEditingId(null)}
          />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {items.length === 0 && !creating ? (
        <p className="text-sm text-(--cl-muted)">No skills yet — add one above.</p>
      ) : (
        // A flat, alphabetical list. Which category a skill appears under, and in
        // what order, is decided per CV in the CV editor — not here.
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-2 rounded-lg border border-(--cl-border) bg-white px-2.5 py-1.5"
            >
              <span className="text-sm text-(--cl-text)">{item.name}</span>
              {item.level != null && (
                <span className="text-xs text-(--cl-muted)">{item.level}/5</span>
              )}
              {item.cefrLevel && (
                <span className="text-xs text-(--cl-muted)">{item.cefrLevel}</span>
              )}
              <button
                type="button"
                onClick={() => setEditingId(item.id)}
                className="text-xs text-(--cl-muted) hover:text-(--cl-accent) transition-colors"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                aria-label={`Delete ${item.name}`}
                className="text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
