"use client";

import { useId } from "react";
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
import { SECTION_LABELS, type SectionKey } from "@/lib/cv-layouts";

// ── Grip icon ─────────────────────────────────────────────────────────────────

function GripIcon() {
  return (
    <svg
      width="12"
      height="16"
      viewBox="0 0 12 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="3" cy="3" r="1.5" />
      <circle cx="9" cy="3" r="1.5" />
      <circle cx="3" cy="8" r="1.5" />
      <circle cx="9" cy="8" r="1.5" />
      <circle cx="3" cy="13" r="1.5" />
      <circle cx="9" cy="13" r="1.5" />
    </svg>
  );
}

// ── Sortable row ──────────────────────────────────────────────────────────────

function SortableRow({ id }: { id: SectionKey }) {
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

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 bg-white select-none ${
        isDragging
          ? "border-(--cl-accent) shadow-md"
          : "border-(--cl-border)"
      }`}
    >
      <span className="text-sm text-(--cl-text) flex-1">
        {SECTION_LABELS[id]}
      </span>

      {/* Drag handle — only this triggers the drag */}
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        type="button"
        aria-label="Drag to reorder"
        className="text-(--cl-muted) hover:text-(--cl-text) cursor-grab active:cursor-grabbing touch-none shrink-0 opacity-50 hover:opacity-100"
      >
        <GripIcon />
      </button>
    </li>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  sectionOrder: SectionKey[];
  onChange: (order: SectionKey[]) => void;
}

export function SectionOrderEditor({ sectionOrder, onChange }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // 200 ms hold before drag activates — prevents accidental drags
        // on mobile while allowing immediate drag on deliberate holds
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sectionOrder.indexOf(active.id as SectionKey);
    const newIndex = sectionOrder.indexOf(over.id as SectionKey);
    onChange(arrayMove(sectionOrder, oldIndex, newIndex));
  }

  // See the note in SortableEntryList: an explicit id keeps dnd-kit's
  // aria-describedby stable between the server and client renders.
  const dndId = useId();

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
        <ol className="space-y-1.5">
          {sectionOrder.map((key) => (
            <SortableRow key={key} id={key} />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}
