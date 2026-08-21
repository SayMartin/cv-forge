"use client";

import {
  DndContext,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Skill, SkillCategoryOption } from "./ContentTabs";

// Container id for skills with no category. Not a real category row — it only
// exists so the board has somewhere to show, and somewhere to drop, skills the
// migration could not place.
export const UNCATEGORISED = "__uncategorised";

function SkillCard({
  skill,
  onEdit,
  onDelete,
}: {
  skill: Skill;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: skill.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-lg border bg-white px-2.5 py-1.5 ${
        isDragging ? "border-(--cl-accent) shadow-md" : "border-(--cl-border)"
      }`}
    >
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        type="button"
        aria-label={`Move ${skill.name} to another category`}
        className="text-sm text-(--cl-text) cursor-grab active:cursor-grabbing touch-none text-left"
      >
        {skill.name}
      </button>
      {skill.level != null && (
        <span className="text-xs text-(--cl-muted) shrink-0">{skill.level}/5</span>
      )}
      {skill.cefrLevel && (
        <span className="text-xs text-(--cl-muted) shrink-0">{skill.cefrLevel}</span>
      )}
      <button type="button" onClick={onEdit} className="text-xs text-(--cl-muted) hover:text-(--cl-accent) transition-colors shrink-0">
        Edit
      </button>
      <button type="button" onClick={onDelete} className="text-xs text-red-500 hover:text-red-700 transition-colors shrink-0">
        ×
      </button>
    </div>
  );
}

function DropGroup({
  id,
  title,
  skills,
  onEdit,
  onDelete,
}: {
  id: string;
  title: string;
  skills: Skill[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border px-4 py-3 transition-colors ${
        isOver ? "border-(--cl-accent) bg-(--cl-pill)" : "border-(--cl-border) bg-white"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-(--cl-muted) mb-2">
        {title}
      </p>
      <SortableContext items={skills.map((s) => s.id)} strategy={rectSortingStrategy}>
        <div className="flex flex-wrap gap-1.5 min-h-9">
          {skills.length === 0 ? (
            <p className="text-xs text-(--cl-muted) self-center">Drop skills here</p>
          ) : (
            skills.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                onEdit={() => onEdit(skill.id)}
                onDelete={() => onDelete(skill.id)}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

interface Props {
  skills: Skill[];
  categories: SkillCategoryOption[];
  onMove: (skillId: string, categoryId: string | null) => void;
  onEdit: (skillId: string) => void;
  onDelete: (skillId: string) => void;
}

export function SkillBoard({ skills, categories, onMove, onEdit, onDelete }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const known = new Set(categories.map((c) => c.id));
  const groupOf = (skill: Skill) =>
    skill.categoryId && known.has(skill.categoryId) ? skill.categoryId : UNCATEGORISED;

  const uncategorised = skills.filter((s) => groupOf(s) === UNCATEGORISED);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const skill = skills.find((s) => s.id === active.id);
    if (!skill) return;

    // `over` is either a group (dropped on empty space) or another skill (dropped
    // onto a card) — resolve the latter to the group that card lives in.
    const overSkill = skills.find((s) => s.id === over.id);
    const target = overSkill ? groupOf(overSkill) : String(over.id);

    if (target === groupOf(skill)) return;
    onMove(skill.id, target === UNCATEGORISED ? null : target);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="space-y-2">
        {categories.map((category) => (
          <DropGroup
            key={category.id}
            id={category.id}
            title={category.name}
            skills={skills.filter((s) => groupOf(s) === category.id)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}

        {/* Only shown when it has something in it — an empty tray would read as a
            category the user forgot to fill rather than as a leftover bucket. */}
        {uncategorised.length > 0 && (
          <DropGroup
            id={UNCATEGORISED}
            title="Uncategorised"
            skills={uncategorised}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )}
      </div>
    </DndContext>
  );
}
