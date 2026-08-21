"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MAX_SKILL_CATEGORIES } from "@/lib/cv-content-types";
import type { SkillCategoryOption } from "./ContentTabs";

function GripIcon() {
  return (
    <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor" aria-hidden="true">
      <circle cx="3" cy="3" r="1.5" />
      <circle cx="9" cy="3" r="1.5" />
      <circle cx="3" cy="8" r="1.5" />
      <circle cx="9" cy="8" r="1.5" />
      <circle cx="3" cy="13" r="1.5" />
      <circle cx="9" cy="13" r="1.5" />
    </svg>
  );
}

function SortableCategoryRow({
  category,
  onRename,
  onDelete,
}: {
  category: SkillCategoryOption;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: category.id });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(category.name);
  const [busy, setBusy] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

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
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 bg-white ${
        isDragging ? "border-(--cl-accent) shadow-md" : "border-(--cl-border)"
      }`}
    >
      {editing ? (
        <input
          type="text"
          value={draft}
          autoFocus
          disabled={busy}
          aria-label={`Rename ${category.name}`}
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

      {/* The role is fixed, not renameable — it is what makes the CEFR field and the
          Europass language table work, so it is surfaced rather than hidden. */}
      {category.kind === "language" && !editing && (
        <span className="text-xs text-(--cl-muted) shrink-0" title="Spoken languages — enables CEFR levels">
          CEFR
        </span>
      )}

      <button
        type="button"
        onClick={() => onDelete(category.id)}
        className="text-xs text-red-500 hover:text-red-700 transition-colors shrink-0"
      >
        Delete
      </button>

      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        type="button"
        aria-label={`Reorder ${category.name}`}
        className="text-(--cl-muted) hover:text-(--cl-text) cursor-grab active:cursor-grabbing touch-none shrink-0 opacity-50 hover:opacity-100"
      >
        <GripIcon />
      </button>
    </li>
  );
}

interface Props {
  categories: SkillCategoryOption[];
  onChange: (categories: SkillCategoryOption[]) => void;
}

export function SkillCategoryManager({ categories, onChange }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(categories, oldIndex, newIndex);

    // Optimistic: the drag has already visually happened, so show the result and
    // roll back if the server disagrees.
    onChange(reordered);
    setError(null);

    const res = await fetch("/api/content/skill-categories/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: reordered.map((c) => c.id) }),
    });
    if (!res.ok) {
      onChange(categories);
      setError("Could not save the new order");
    }
  }

  async function handleRename(id: string, name: string) {
    setError(null);
    const res = await fetch(`/api/content/skill-categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Rename failed");
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
      setError(data.error ?? "Delete failed");
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
        setError(data.error ?? "Could not add category");
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
        <p className="text-sm font-medium text-(--cl-text)">Categories</p>
        <p className="text-xs text-(--cl-muted) mt-0.5">
          Your own grouping. Drag to set the order they appear in on a CV; click a name to rename it.
        </p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <ol className="space-y-1.5">
            {categories.map((category) => (
              <SortableCategoryRow
                key={category.id}
                category={category}
                onRename={handleRename}
                onDelete={handleDelete}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>

      {categories.length === 0 && (
        <p className="text-sm text-(--cl-muted)">No categories yet — add one below.</p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <form onSubmit={handleAdd} className="flex items-center gap-2 pt-1">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={atLimit ? `Limit of ${MAX_SKILL_CATEGORIES} reached` : "New category"}
          aria-label="New category name"
          maxLength={40}
          disabled={atLimit}
          className="flex-1 border border-(--cl-border) rounded-lg px-3 py-1.5 text-sm bg-white text-(--cl-text) placeholder:text-(--cl-muted) focus:outline-none focus:ring-2 focus:ring-(--cl-accent) disabled:opacity-50 disabled:bg-(--cl-pill)"
        />
        <button
          type="submit"
          disabled={adding || atLimit || !newName.trim()}
          className="rounded-lg border border-(--cl-border) px-3 py-1.5 text-sm text-(--cl-muted) hover:border-(--cl-accent) hover:text-(--cl-accent) transition-colors disabled:opacity-50"
        >
          Add
        </button>
      </form>
    </div>
  );
}
