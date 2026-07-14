"use client";

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
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ── Grip icon ─────────────────────────────────────────────────────────────────

function EntryGripIcon() {
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

// ── Sortable entry row (checked entries) ──────────────────────────────────────

function SortableEntryRow({ id, label, onToggle }: { id: string; label: string; onToggle: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const checkId = `entry-${id}`;
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 py-1 select-none">
      <input
        id={checkId}
        type="checkbox"
        checked
        onChange={onToggle}
        className="h-4 w-4 rounded border-(--cl-border) accent-(--cl-accent) shrink-0"
      />
      <label htmlFor={checkId} className="text-sm text-(--cl-text) cursor-pointer">
        {label}
      </label>
      <span className="flex-1" />
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        type="button"
        aria-label="Drag to reorder"
        className="text-(--cl-muted) hover:text-(--cl-text) cursor-grab active:cursor-grabbing touch-none shrink-0"
      >
        <EntryGripIcon />
      </button>
    </div>
  );
}

// ── Plain row (unchecked entries) ─────────────────────────────────────────────

function UncheckedEntryRow({ id, label, onToggle }: { id: string; label: string; onToggle: () => void }) {
  const checkId = `entry-${id}`;
  return (
    <div className="flex items-center gap-2 py-1 group">
      <input
        id={checkId}
        type="checkbox"
        checked={false}
        onChange={onToggle}
        className="h-4 w-4 rounded border-(--cl-border) accent-(--cl-accent) shrink-0"
      />
      <label htmlFor={checkId} className="text-sm text-(--cl-muted) group-hover:text-(--cl-text) cursor-pointer">
        {label}
      </label>
      {/* Spacer + placeholder width aligns with grip button on checked rows */}
      <span className="flex-1" />
      <span className="w-3 shrink-0" />
    </div>
  );
}

// ── Sortable entry list ───────────────────────────────────────────────────────

export function SortableEntryList<T extends { id: string }>({
  ids,
  onReorder,
  entries,
  getLabel,
  onToggle,
  columns = 1,
}: {
  ids: string[];
  onReorder: (ids: string[]) => void;
  entries: T[];
  getLabel: (entry: T) => string;
  onToggle: (id: string) => void;
  columns?: 1 | 2;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    onReorder(arrayMove(ids, oldIndex, newIndex));
  }

  const selected = ids.flatMap((id) => entries.find((e) => e.id === id) ?? []);
  const unselected = entries.filter((e) => !ids.includes(e.id));

  const gridClass = columns === 2 ? "columns-2 gap-x-6" : "";
  const strategy = columns === 2 ? rectSortingStrategy : verticalListSortingStrategy;

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={strategy}>
          <div className={gridClass}>
            {selected.map((entry) => (
              <SortableEntryRow
                key={entry.id}
                id={entry.id}
                label={getLabel(entry)}
                onToggle={() => onToggle(entry.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <div className={gridClass}>
        {unselected.map((entry) => (
          <UncheckedEntryRow
            key={entry.id}
            id={entry.id}
            label={getLabel(entry)}
            onToggle={() => onToggle(entry.id)}
          />
        ))}
      </div>
    </div>
  );
}
