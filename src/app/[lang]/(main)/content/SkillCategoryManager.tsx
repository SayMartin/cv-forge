"use client";

import { useState } from "react";
import { useDictionary } from "@/i18n/DictionaryProvider";
import { useApiError } from "@/i18n/useApiError";
import { format } from "@/i18n/format";
import { MAX_SKILL_CATEGORIES } from "@/lib/cv-content-types";
import type { SkillCategoryOption } from "./ContentTabs";
import { ActionChip } from "@/components/ActionChip";

function CategoryRow({
  category,
  onRename,
  onDelete,
}: {
  category: SkillCategoryOption;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const { form: t, skills } = useDictionary().content;
  const d = skills.categories;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(category.name);
  const [busy, setBusy] = useState(false);

  async function commit() {
    const name = draft.trim();
    if (!name || name === category.name) {
      setDraft(category.name);
      setEditing(false);
      return;
    }
    setBusy(true);
    try {
      await onRename(category.id, name);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="flex items-center gap-3 rounded-lg border border-(--cl-border) px-3 py-2.5 bg-white">
      {category.kind === "language" ? (
        // Fixed in both name and role: Europass requires this category to exist and
        // be identifiable, and nothing in the UI could recreate it once changed.
        <span className="flex-1 text-sm text-(--cl-text)">{category.name}</span>
      ) : editing ? (
        <input
          type="text"
          value={draft}
          autoFocus
          disabled={busy}
          aria-label={format(d.renameLabel, { name: category.name })}
          maxLength={40}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); void commit(); }
            if (e.key === "Escape") { setDraft(category.name); setEditing(false); }
          }}
          className="flex-1 border border-(--cl-accent) rounded px-2 py-1 text-sm bg-white text-(--cl-text) focus:outline-none focus:ring-2 focus:ring-(--cl-accent)"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex-1 text-left text-sm text-(--cl-text) hover:text-(--cl-accent) transition-colors"
        >
          {category.name}
        </button>
      )}

      {/* The role is fixed even though the name is not — it is what makes the CEFR
          field and the Europass language table work, so it is surfaced rather than
          hidden. */}
      {category.kind === "language" && !editing && (
        <span
          className="text-sm text-(--cl-muted) shrink-0"
          title={d.languageTooltip}
        >
          {d.languageBadge}
        </span>
      )}

      {/* Deleting this one is refused by the API too; hiding the button keeps the
          UI from offering an action that cannot succeed. */}
      {category.kind !== "language" && (
        <ActionChip tone="danger" onClick={() => onDelete(category.id)}>
          {t.delete}
        </ActionChip>
      )}

    </li>
  );
}

interface Props {
  categories: SkillCategoryOption[];
  onChange: (categories: SkillCategoryOption[]) => void;
}

export function SkillCategoryManager({ categories, onChange }: Props) {
  const { form: t, skills } = useDictionary().content;
  const apiError = useApiError();
  const d = skills.categories;
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleRename(id: string, name: string) {
    setError(null);
    const res = await fetch(`/api/content/skill-categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(apiError(data, d.renameFailed));
      return;
    }
    onChange(categories.map((c) => (c.id === id ? { ...c, name } : c)));
  }

  async function handleDelete(id: string) {
    setError(null);
    const res = await fetch(`/api/content/skill-categories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      // A populated category is refused by the API rather than silently
      // uncategorising its skills — surface that reason verbatim.
      setError(apiError(data, t.deleteFailed));
      return;
    }
    onChange(categories.filter((c) => c.id !== id));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/content/skill-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(apiError(data, d.addFailed));
        return;
      }
      onChange([...categories, { id: data.id, name, kind: "normal" }]);
      setNewName("");
    } finally {
      setAdding(false);
    }
  }

  const atLimit = categories.length >= MAX_SKILL_CATEGORIES;

  return (
    <div className="bg-white border border-(--cl-border) rounded-xl px-5 py-4 space-y-3">
      <div>
        <p className="text-sm font-medium text-(--cl-text)">{d.title}</p>
        <p className="text-sm text-(--cl-muted) mt-0.5">{d.description}</p>
      </div>

      <ol className="space-y-1.5">
        {categories.map((category) => (
          <CategoryRow
            key={category.id}
            category={category}
            onRename={handleRename}
            onDelete={handleDelete}
          />
        ))}
      </ol>

      {categories.length === 0 && (
        <p className="text-sm text-(--cl-muted)">{d.empty}</p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <form onSubmit={handleAdd} className="flex items-center gap-2 pt-1">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={atLimit ? format(d.atLimit, { max: MAX_SKILL_CATEGORIES }) : d.newPlaceholder}
          aria-label={d.newLabel}
          maxLength={40}
          disabled={atLimit}
          className="flex-1 border border-(--cl-border) rounded-lg px-3 py-1.5 text-sm bg-white text-(--cl-text) placeholder:text-(--cl-muted) focus:outline-none focus:ring-2 focus:ring-(--cl-accent) disabled:opacity-50 disabled:bg-(--cl-pill)"
        />
        <button
          type="submit"
          disabled={adding || atLimit || !newName.trim()}
          className="rounded-lg border border-(--cl-border) px-3 py-1.5 text-sm text-(--cl-muted) hover:border-(--cl-accent) hover:text-(--cl-accent) transition-colors disabled:opacity-50"
        >
          {d.add}
        </button>
      </form>
    </div>
  );
}
