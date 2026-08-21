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
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CvSkillGroup } from "@/lib/cv-content-types";

export type SkillOption = { id: string; name: string; level?: number; cefrLevel?: string };
export type CategoryOption = { id: string; name: string; kind: string };

// Group rows and skill chips share one DndContext. Prefixing the group ids keeps
// the two kinds apart in a single onDragEnd, which is simpler and better behaved
// than nesting a second context inside the first.
const GROUP = "group:";
const UNPLACED = "unplaced";

function GripIcon() {
  return (
    <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor" aria-hidden="true">
      <circle cx="3" cy="3" r="1.5" /><circle cx="9" cy="3" r="1.5" />
      <circle cx="3" cy="8" r="1.5" /><circle cx="9" cy="8" r="1.5" />
      <circle cx="3" cy="13" r="1.5" /><circle cx="9" cy="13" r="1.5" />
    </svg>
  );
}

function SkillChip({
  skill,
  selected,
  disabled,
  onToggle,
}: {
  skill: SkillOption;
  selected: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: skill.id });

  return (
    <span
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 bg-white ${
        isDragging ? "border-(--cl-accent) shadow-md" : "border-(--cl-border)"
      }`}
    >
      <input
        type="checkbox"
        checked={selected}
        disabled={disabled}
        onChange={onToggle}
        aria-label={`Include ${skill.name}`}
        className="rounded accent-(--cl-accent) disabled:opacity-40"
      />
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        type="button"
        aria-label={`Move ${skill.name} to another category`}
        className={`text-sm cursor-grab active:cursor-grabbing touch-none ${
          selected ? "text-(--cl-text)" : "text-(--cl-muted)"
        }`}
      >
        {skill.name}
      </button>
      {skill.cefrLevel && <span className="text-xs text-(--cl-muted)">{skill.cefrLevel}</span>}
    </span>
  );
}

function GroupRow({
  group,
  category,
  skills,
  selectedIds,
  onToggleSkill,
  onToggleHidden,
}: {
  group: CvSkillGroup;
  category: CategoryOption;
  skills: SkillOption[];
  selectedIds: string[];
  onToggleSkill: (id: string) => void;
  onToggleHidden: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: GROUP + group.categoryId });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: GROUP + group.categoryId });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      className={`rounded-xl border px-4 py-3 ${
        isOver ? "border-(--cl-accent) bg-(--cl-pill)" : "border-(--cl-border) bg-white"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <input
          type="checkbox"
          checked={!group.hidden}
          onChange={onToggleHidden}
          aria-label={`Show ${category.name} on this CV`}
          className="rounded accent-(--cl-accent)"
        />
        <span className={`text-xs font-semibold uppercase tracking-wide flex-1 ${
          group.hidden ? "text-(--cl-muted) line-through" : "text-(--cl-text)"
        }`}>
          {category.name}
        </span>
        <button
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          type="button"
          aria-label={`Reorder ${category.name}`}
          className="text-(--cl-muted) hover:text-(--cl-text) cursor-grab active:cursor-grabbing touch-none opacity-50 hover:opacity-100"
        >
          <GripIcon />
        </button>
      </div>

      <div ref={setDropRef}>
        <SortableContext items={group.skillIds} strategy={rectSortingStrategy}>
          <div className="flex flex-wrap gap-1.5 min-h-8">
            {skills.length === 0 ? (
              <p className="text-xs text-(--cl-muted) self-center">Drag skills here</p>
            ) : (
              skills.map((skill) => (
                <SkillChip
                  key={skill.id}
                  skill={skill}
                  selected={selectedIds.includes(skill.id)}
                  // A hidden group renders nothing, so ticking its skills would be
                  // a promise the CV does not keep.
                  disabled={group.hidden}
                  onToggle={() => onToggleSkill(skill.id)}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </li>
  );
}

interface Props {
  skills: SkillOption[];
  categories: CategoryOption[];
  groups: CvSkillGroup[];
  selectedIds: string[];
  onGroupsChange: (groups: CvSkillGroup[]) => void;
  onSelectedChange: (ids: string[]) => void;
}

export function CvSkillsEditor({
  skills, categories, groups, selectedIds, onGroupsChange, onSelectedChange,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const byId = new Map(skills.map((s) => [s.id, s]));
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  // Categories the user owns but this CV has never arranged are offered as empty
  // groups, so they can be filled without a separate "add category" step.
  const arranged = new Set(groups.map((g) => g.categoryId));
  const allGroups: CvSkillGroup[] = [
    ...groups,
    ...categories.filter((c) => !arranged.has(c.id)).map((c) => ({ categoryId: c.id, hidden: true, skillIds: [] })),
  ];

  const placed = new Set(allGroups.flatMap((g) => g.skillIds));
  const unplaced = skills.filter((s) => !placed.has(s.id));

  function containerOf(id: string): string | null {
    if (id === UNPLACED || id.startsWith(GROUP)) return id;
    const group = allGroups.find((g) => g.skillIds.includes(id));
    return group ? GROUP + group.categoryId : UNPLACED;
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    // Group reorder.
    if (activeId.startsWith(GROUP)) {
      if (!overId.startsWith(GROUP) || activeId === overId) return;
      const from = allGroups.findIndex((g) => GROUP + g.categoryId === activeId);
      const to = allGroups.findIndex((g) => GROUP + g.categoryId === overId);
      onGroupsChange(arrayMove(allGroups, from, to));
      return;
    }

    // Skill moved between (or within) containers.
    const target = containerOf(overId);
    const source = containerOf(activeId);
    if (!target || target === source) return;

    const next = allGroups.map((g) => ({ ...g, skillIds: g.skillIds.filter((id) => id !== activeId) }));

    if (target !== UNPLACED) {
      const categoryId = target.slice(GROUP.length);
      const group = next.find((g) => g.categoryId === categoryId);
      if (group) group.skillIds = [...group.skillIds, activeId];
    } else {
      // Dropped back into the unplaced tray — unplaced means unselectable, so the
      // selection has to let go of it too.
      onSelectedChange(selectedIds.filter((id) => id !== activeId));
    }

    onGroupsChange(next);
  }

  const { setNodeRef: setTrayRef, isOver: trayIsOver } = useDroppable({ id: UNPLACED });

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="space-y-3">
        <SortableContext items={allGroups.map((g) => GROUP + g.categoryId)} strategy={verticalListSortingStrategy}>
          <ol className="space-y-2">
            {allGroups.map((group) => {
              const category = categoryById.get(group.categoryId);
              if (!category) return null;
              return (
                <GroupRow
                  key={group.categoryId}
                  group={group}
                  category={category}
                  skills={group.skillIds.map((id) => byId.get(id)).filter((s): s is SkillOption => !!s)}
                  selectedIds={selectedIds}
                  onToggleSkill={(id) =>
                    onSelectedChange(
                      selectedIds.includes(id)
                        ? selectedIds.filter((s) => s !== id)
                        : [...selectedIds, id],
                    )
                  }
                  onToggleHidden={() =>
                    onGroupsChange(
                      allGroups.map((g) =>
                        g.categoryId === group.categoryId ? { ...g, hidden: !g.hidden } : g,
                      ),
                    )
                  }
                />
              );
            })}
          </ol>
        </SortableContext>

        <div
          ref={setTrayRef}
          className={`rounded-xl border border-dashed px-4 py-3 ${
            trayIsOver ? "border-(--cl-accent) bg-(--cl-pill)" : "border-(--cl-border)"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-(--cl-muted) mb-2">
            Not on this CV
          </p>
          <SortableContext items={unplaced.map((s) => s.id)} strategy={rectSortingStrategy}>
            <div className="flex flex-wrap gap-1.5 min-h-8">
              {unplaced.length === 0 ? (
                <p className="text-xs text-(--cl-muted) self-center">Every skill is placed.</p>
              ) : (
                unplaced.map((skill) => (
                  <SkillChip key={skill.id} skill={skill} selected={false} disabled onToggle={() => {}} />
                ))
              )}
            </div>
          </SortableContext>
        </div>
      </div>
    </DndContext>
  );
}
