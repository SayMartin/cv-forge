"use client";

import { useState } from "react";
import { SkillCategoryManager } from "./SkillCategoryManager";
import { SkillBoard } from "./SkillBoard";
import type { Skill, SkillCategoryOption } from "./ContentTabs";

interface Props {
  initialItems: Skill[];
  categories: SkillCategoryOption[];
}

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const EMPTY_FORM = { name: "", categoryId: "", level: "", cefrLevel: "", order: "" };
type FormState = typeof EMPTY_FORM;

function SkillForm({
  initial, submitLabel, categories, onSubmit, onCancel,
}: {
  initial: FormState; submitLabel: string; categories: SkillCategoryOption[];
  onSubmit: (data: FormState) => Promise<void>; onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // CEFR applies to spoken languages. Keyed on the category's role, never on its
  // name, so renaming the group to "Språk" does not hide the field.
  const isLanguage =
    categories.find((c) => c.id === form.categoryId)?.kind === "language";

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
          <select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} className="w-full border border-(--cl-border) rounded-lg px-3 py-2 text-sm bg-white text-(--cl-text) focus:outline-none focus:ring-2 focus:ring-(--cl-accent)">
            <option value="">— none —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {categories.length === 0 && (
            <p className="text-xs text-(--cl-muted)">No categories yet.</p>
          )}
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-(--cl-text)">Level (1–5)</label>
          <input type="number" min={1} max={5} value={form.level} onChange={(e) => set("level", e.target.value)} placeholder="e.g. 4" className="w-full border border-(--cl-border) rounded-lg px-3 py-2 text-sm bg-white text-(--cl-text) placeholder:text-(--cl-muted) focus:outline-none focus:ring-2 focus:ring-(--cl-accent)" />
        </div>
        {isLanguage && (
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
    categoryId: item.categoryId ?? "",
    level: item.level != null ? String(item.level) : "",
    cefrLevel: item.cefrLevel ?? "",
    order: item.order != null ? String(item.order) : "",
  };
}

export function SkillsTab({ initialItems, categories: initialCategories }: Props) {
  const [items, setItems] = useState<Skill[]>(initialItems);
  // Owned here, not in the manager: the form's dropdown reads the same list, so a
  // rename or a new category has to be visible in both without a page reload.
  const [categories, setCategories] = useState<SkillCategoryOption[]>(initialCategories);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const editingSkill = items.find((item) => item.id === editingId) ?? null;

  // A rename must also update the denormalised name shown on each skill row.
  function handleCategoriesChange(next: SkillCategoryOption[]) {
    setCategories(next);
    setItems((prev) =>
      prev.map((item) =>
        item.categoryId
          ? { ...item, category: next.find((c) => c.id === item.categoryId)?.name }
          : item,
      ),
    );
  }

  // The API stores an id; the list renders a name. Resolve it locally so the row
  // updates without a round-trip.
  function toItem(id: string, form: FormState): Skill {
    return {
      id,
      name: form.name,
      categoryId: form.categoryId || undefined,
      category: categories.find((c) => c.id === form.categoryId)?.name,
      level: form.level ? Number(form.level) : undefined,
      cefrLevel: form.cefrLevel || undefined,
      order: form.order ? Number(form.order) : undefined,
    };
  }

  function toPayload(form: FormState) {
    return {
      name: form.name,
      categoryId: form.categoryId,
      level: form.level,
      cefrLevel: form.cefrLevel,
      order: form.order,
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
    setItems((prev) => [...prev, toItem(data.id, form)]);
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
    setItems((prev) => prev.map((item) => (item.id === id ? toItem(id, form) : item)));
    setEditingId(null);
  }

  // Optimistic: the card has already moved under the cursor, so render the result
  // and put it back if the server refuses.
  async function handleMove(skillId: string, categoryId: string | null) {
    const previous = items;
    setItems((prev) =>
      prev.map((item) =>
        item.id === skillId
          ? {
              ...item,
              categoryId: categoryId ?? undefined,
              category: categories.find((c) => c.id === categoryId)?.name,
            }
          : item,
      ),
    );
    setError(null);

    const res = await fetch(`/api/content/skills/${skillId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: categoryId ?? "" }),
    });
    if (!res.ok) {
      setItems(previous);
      setError("Could not move that skill");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this skill?")) return;
    const res = await fetch(`/api/content/skills/${id}`, { method: "DELETE" });
    if (!res.ok) { setError("Delete failed"); return; }
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-4">
      <SkillCategoryManager categories={categories} onChange={handleCategoriesChange} />

      {!creating ? (
        <button type="button" onClick={() => setCreating(true)} className="flex items-center gap-2 rounded-lg border border-dashed border-(--cl-border) px-4 py-2 text-sm text-(--cl-muted) hover:border-(--cl-accent) hover:text-(--cl-accent) transition-colors">
          + Add skill
        </button>
      ) : (
        <div className="bg-white border border-(--cl-accent) rounded-xl px-5 py-4">
          <p className="text-sm font-medium text-(--cl-text) mb-4">New skill</p>
          <SkillForm initial={EMPTY_FORM} submitLabel="Create" categories={categories} onSubmit={handleCreate} onCancel={() => setCreating(false)} />
        </div>
      )}

      {editingSkill && (
        <div className="bg-white border border-(--cl-accent) rounded-xl px-5 py-4">
          <p className="text-sm font-medium text-(--cl-text) mb-4">Edit {editingSkill.name}</p>
          <SkillForm
            initial={itemToForm(editingSkill)}
            submitLabel="Save changes"
            categories={categories}
            onSubmit={(form) => handleUpdate(editingSkill.id, form)}
            onCancel={() => setEditingId(null)}
          />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {items.length === 0 && !creating ? (
        <p className="text-sm text-(--cl-muted)">No skills yet — add one above.</p>
      ) : (
        <SkillBoard
          skills={items}
          categories={categories}
          onMove={handleMove}
          onEdit={setEditingId}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
