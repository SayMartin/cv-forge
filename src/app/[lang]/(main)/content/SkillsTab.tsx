"use client";

import { useMemo, useState } from "react";
import { INTL_LOCALES } from "@/i18n/config";
import { useDictionary } from "@/i18n/DictionaryProvider";
import { format } from "@/i18n/format";
import { useLocale } from "@/i18n/useLocale";
import { SkillCategoryManager } from "./SkillCategoryManager";
import type { Skill, SkillCategoryOption } from "./ContentTabs";
import { ActionChip } from "@/components/ActionChip";

interface Props {
  initialItems: Skill[];
  categories: SkillCategoryOption[];
}

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const EMPTY_FORM = { name: "", level: "", cefrLevel: "" };
type FormState = typeof EMPTY_FORM;

function SkillForm({
  initial, submitLabel, onSubmit, onCancel, onDelete,
}: {
  initial: FormState; submitLabel: string;
  onSubmit: (data: FormState) => Promise<void>; onCancel: () => void;
  onDelete?: () => Promise<void>;
}) {
  const { form: t, skills: d } = useDictionary().content;
  const [form, setForm] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try { await onSubmit(form); }
    catch (err) { setError(err instanceof Error ? err.message : t.saveFailed); setSaving(false); }
  }

  async function handleDelete() {
    if (!onDelete) return;
    setDeleting(true);
    setError(null);
    try { await onDelete(); }
    catch (err) { setError(err instanceof Error ? err.message : t.deleteFailed); setDeleting(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-(--cl-text)">{d.fields.name.label}</label>
          <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder={d.fields.name.placeholder} required className="w-full border border-(--cl-border) rounded-lg px-3 py-2 text-sm bg-white text-(--cl-text) placeholder:text-(--cl-muted) focus:outline-none focus:ring-2 focus:ring-(--cl-accent)" />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-(--cl-text)">{d.fields.level.label}</label>
          <input type="number" min={1} max={5} value={form.level} onChange={(e) => set("level", e.target.value)} placeholder={d.fields.level.placeholder} className="w-full border border-(--cl-border) rounded-lg px-3 py-2 text-sm bg-white text-(--cl-text) placeholder:text-(--cl-muted) focus:outline-none focus:ring-2 focus:ring-(--cl-accent)" />
        </div>
        {/* Always offered, never gated on a category: whether a skill is a spoken
            language is a property of the skill, while which group it appears under
            is decided per CV. The level only renders on a CV that places this skill
            in the language category. */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-(--cl-text)">{d.fields.cefr.label}</label>
          <select value={form.cefrLevel} onChange={(e) => set("cefrLevel", e.target.value)} className="w-full border border-(--cl-border) rounded-lg px-3 py-2 text-sm bg-white text-(--cl-text) focus:outline-none focus:ring-2 focus:ring-(--cl-accent)">
            <option value="">{d.cefrNone}</option>
            {CEFR_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-2 pt-1">
        <button type="submit" disabled={saving || deleting} className="bg-(--cl-accent) text-white rounded-lg px-4 py-1.5 text-sm font-medium disabled:opacity-50 hover:bg-(--cl-accent-hov) transition-colors">{saving ? t.saving : submitLabel}</button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-(--cl-border) px-4 py-1.5 text-sm text-(--cl-muted) hover:border-(--cl-accent) hover:text-(--cl-accent) transition-colors">{t.cancel}</button>
        {/* Deletion sits here rather than on the chip: from inside the edit card
            you can see exactly which skill you are about to remove. */}
        {onDelete && (
          <button type="button" onClick={handleDelete} disabled={saving || deleting} className="ml-auto rounded-lg border border-red-200 px-4 py-1.5 text-sm text-red-600 disabled:opacity-50 hover:border-red-500 hover:bg-red-50 transition-colors">{deleting ? t.deleting : t.delete}</button>
        )}
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

export function SkillsTab({ initialItems, categories: initialCategories }: Props) {
  const locale = useLocale();
  const { form: t, skills: d } = useDictionary().content;

  /**
   * Was a bare `a.name.localeCompare(b.name)`, which collates in the *runtime's
   * default* locale — the browser's language setting, which has nothing to do
   * with the locale this page is being rendered in. Two people looking at the
   * same list got different orders, and neither followed the app.
   *
   * Swedish treats å, ä and ö as their own letters after z; English treats them
   * as decorated a and o. So the default gave "Ångström" immediately after
   * "Analys" instead of after "Zod" — verified: under `en-US` the list sorts
   * Analys · Ångström · Azure · Backend · Zod, under `sv-SE`
   * Analys · Azure · Backend · Zod · Ångström.
   *
   * One `Intl.Collator` rather than `localeCompare(b.name, locale)` per call:
   * building the collator is the expensive half of Intl, and a sort calls the
   * comparator O(n log n) times.
   *
   * Keyed on `locale` for correctness rather than necessity — switching
   * language is a full document load (see `LanguageToggle`), so this component
   * remounts and the initial sort is redone anyway.
   */
  const byName = useMemo(() => {
    const collator = new Intl.Collator(INTL_LOCALES[locale]);
    return (a: Skill, b: Skill) => collator.compare(a.name, b.name);
  }, [locale]);

  const [items, setItems] = useState<Skill[]>(() => [...initialItems].sort(byName));
  const [categories, setCategories] = useState<SkillCategoryOption[]>(initialCategories);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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
    if (!res.ok) throw new Error(data.error ?? t.createFailed);
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
    if (!res.ok) throw new Error(data.error ?? t.updateFailed);
    setItems((prev) =>
      prev.map((item) => (item.id === id ? toItem(id, form) : item)).sort(byName),
    );
    setEditingId(null);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(format(d.confirmDelete, { name }))) return;
    const res = await fetch(`/api/content/skills/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(t.deleteFailed);
    setItems((prev) => prev.filter((item) => item.id !== id));
    setEditingId(null);
  }

  return (
    <div className="space-y-4">
      <SkillCategoryManager categories={categories} onChange={setCategories} />

      {!creating ? (
        <button type="button" onClick={() => setCreating(true)} className="flex items-center gap-2 rounded-lg border border-dashed border-(--cl-border) px-4 py-2 text-sm text-(--cl-muted) hover:border-(--cl-accent) hover:text-(--cl-accent) transition-colors">
          {d.add}
        </button>
      ) : (
        <div className="bg-white border border-(--cl-accent) rounded-xl px-5 py-4">
          <p className="text-sm font-medium text-(--cl-text) mb-4">{d.new}</p>
          <SkillForm initial={EMPTY_FORM} submitLabel={t.create} onSubmit={handleCreate} onCancel={() => setCreating(false)} />
        </div>
      )}

      {editingSkill && (
        <div className="bg-white border border-(--cl-accent) rounded-xl px-5 py-4">
          <p className="text-sm font-medium text-(--cl-text) mb-4">{format(d.editing, { name: editingSkill.name })}</p>
          <SkillForm
            initial={itemToForm(editingSkill)}
            submitLabel={t.save}
            onSubmit={(form) => handleUpdate(editingSkill.id, form)}
            onCancel={() => setEditingId(null)}
            onDelete={() => handleDelete(editingSkill.id, editingSkill.name)}
          />
        </div>
      )}

      {items.length === 0 && !creating ? (
        <p className="text-sm text-(--cl-muted)">{d.empty}</p>
      ) : (
        // A flat, alphabetical list. Which category a skill appears under, and in
        // what order, is decided per CV in the CV editor — not here.
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <span
              key={item.id}
              className={`inline-flex items-center gap-2 rounded-lg border bg-white px-2.5 py-1.5 ${
                item.id === editingId ? "border-(--cl-accent)" : "border-(--cl-border)"
              }`}
            >
              <span className="text-sm text-(--cl-text)">{item.name}</span>
              {item.level != null && (
                <span className="text-sm text-(--cl-muted)">{item.level}/5</span>
              )}
              {item.cefrLevel && (
                <span className="text-sm text-(--cl-muted)">{item.cefrLevel}</span>
              )}
              <ActionChip onClick={() => setEditingId(item.id)}>{t.edit}</ActionChip>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
