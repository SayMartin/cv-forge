"use client";

import { useId, useState } from "react";
import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  closestCorners,
  pointerWithin,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
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

// Group rows and skill chips share one DndContext. Prefixing the ids keeps the
// kinds apart in a single onDragEnd, which is simpler and better behaved than
// nesting a second context inside the first.
//
// A group needs two ids, not one: GROUP is the row itself, which is sortable so
// the categories can be reordered, and ZONE is the area inside it that receives
// skills. Reusing one id for both silently breaks dnd-kit — droppables live in a
// Map keyed by id, so the second registration evicts the first and the group ends
// up measured against the wrong DOM node.
const GROUP = "group:";
const ZONE = "zone:";
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
  const {
    attributes, listeners, setNodeRef, setActivatorNodeRef,
    transform, transition, isDragging, isOver: rowIsOver,
  } = useSortable({ id: GROUP + group.categoryId });
  const { setNodeRef: setDropRef, isOver: zoneIsOver } = useDroppable({ id: ZONE + group.categoryId });
  const isOver = rowIsOver || zoneIsOver;

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
      {/* The drop zone wraps the whole card, heading included, so anywhere inside
          a group counts as aiming at it. A zone the size of the chip strip alone
          is a target you have to hunt for. */}
      <div ref={setDropRef}>
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

        <SortableContext items={group.skillIds} strategy={rectSortingStrategy}>
          <div className="flex flex-wrap gap-1.5 min-h-9">
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
  // A distance constraint rather than a delay: dragging starts as soon as the
  // pointer actually moves, instead of after a fifth of a second of nothing. The
  // 4px threshold is what keeps a click on the drag handle from counting as a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  // See the note in SortableEntryList: an explicit id keeps dnd-kit's
  // aria-describedby stable between the server and client renders.
  const dndId = useId();

  // Two corrections to the default, both aimed at hit accuracy.
  //
  // First, the candidates depend on what is being dragged. A group row is a drop
  // target so categories can be reordered, but it spans the whole card and so
  // overlaps its own zone and every chip inside it. Offering all three for a chip
  // drag means the closest one wins more or less at random. Dragging a chip only
  // ever considers zones, chips and the tray; dragging a group only considers rows.
  //
  // Second, pointerWithin measures from the cursor rather than from the dragged
  // element's box. The groups are stacked full-width rows, so once the cursor is
  // inside one, horizontal position should not matter at all — and with a
  // rectangle-based test it very much does. The fallback covers the keyboard
  // sensor, which has no pointer, and the moment the cursor sits in the gap
  // between two cards.
  const collisionDetection: CollisionDetection = (args) => {
    const draggingGroup = String(args.active.id).startsWith(GROUP);
    const droppableContainers = args.droppableContainers.filter((c) =>
      String(c.id).startsWith(GROUP) === draggingGroup,
    );

    const hits = pointerWithin({ ...args, droppableContainers });
    return hits.length > 0 ? hits : closestCorners({ ...args, droppableContainers });
  };

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

  // Every id the pointer can land on resolves to the container it belongs to: the
  // tray, a group row, a group's drop zone, or a chip sitting in one of them.
  function containerOf(id: string): string {
    if (id === UNPLACED) return UNPLACED;
    if (id.startsWith(ZONE)) return GROUP + id.slice(ZONE.length);
    if (id.startsWith(GROUP)) return id;
    const group = allGroups.find((g) => g.skillIds.includes(id));
    return group ? GROUP + group.categoryId : UNPLACED;
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const draggedId = String(active.id);
    const overId = String(over.id);
    const target = containerOf(overId);

    // Group reorder. The pointer may well be over a chip or a drop zone rather
    // than the row itself, so resolve to the container first.
    if (draggedId.startsWith(GROUP)) {
      if (!target.startsWith(GROUP) || target === draggedId) return;
      const from = allGroups.findIndex((g) => GROUP + g.categoryId === draggedId);
      const to = allGroups.findIndex((g) => GROUP + g.categoryId === target);
      if (from < 0 || to < 0) return;
      onGroupsChange(arrayMove(allGroups, from, to));
      return;
    }

    const source = containerOf(draggedId);

    // Reorder within one group.
    if (source === target) {
      // The tray is derived from what is left over and shown alphabetically, so
      // there is no order to store for it.
      if (source === UNPLACED) return;
      const categoryId = source.slice(GROUP.length);
      onGroupsChange(
        allGroups.map((g) => {
          if (g.categoryId !== categoryId) return g;
          const from = g.skillIds.indexOf(draggedId);
          const to = g.skillIds.indexOf(overId);
          if (from < 0 || to < 0 || from === to) return g;
          return { ...g, skillIds: arrayMove(g.skillIds, from, to) };
        }),
      );
      return;
    }

    // Move between containers, landing where it was dropped rather than at the end.
    const next = allGroups.map((g) => ({ ...g, skillIds: g.skillIds.filter((id) => id !== draggedId) }));

    if (target === UNPLACED) {
      // Dropped back into the unplaced tray — unplaced means unselectable, so the
      // selection has to let go of it too.
      onSelectedChange(selectedIds.filter((id) => id !== draggedId));
    } else {
      const categoryId = target.slice(GROUP.length);
      const group = next.find((g) => g.categoryId === categoryId);
      if (group) {
        const at = group.skillIds.indexOf(overId);
        group.skillIds =
          at < 0
            ? [...group.skillIds, draggedId]
            : [...group.skillIds.slice(0, at), draggedId, ...group.skillIds.slice(at)];
      }
    }

    onGroupsChange(next);
  }

  const draggedSkill = activeId && !activeId.startsWith(GROUP) ? byId.get(activeId) : undefined;
  const draggedCategory = activeId?.startsWith(GROUP)
    ? categoryById.get(activeId.slice(GROUP.length))
    : undefined;

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={collisionDetection}
      // Containers change size as chips move between them, so the cached rects
      // from drag start go stale mid-drag — most visibly on an empty group.
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={handleDragEnd}
    >
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

        <UnplacedTray skills={unplaced} />
      </div>

      <DragOverlay>
        {draggedSkill && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-(--cl-accent) bg-white px-2 py-1 shadow-lg cursor-grabbing">
            <span className="text-sm text-(--cl-text)">{draggedSkill.name}</span>
            {draggedSkill.cefrLevel && (
              <span className="text-xs text-(--cl-muted)">{draggedSkill.cefrLevel}</span>
            )}
          </span>
        )}
        {draggedCategory && (
          <div className="rounded-xl border border-(--cl-accent) bg-white px-4 py-3 shadow-lg cursor-grabbing">
            <span className="text-xs font-semibold uppercase tracking-wide text-(--cl-text)">
              {draggedCategory.name}
            </span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

// The tray has to be its own component. Called from the parent it would run
// outside the DndContext that parent renders, where dnd-kit falls back to a
// no-op context — registering nothing, reporting no error, and quietly refusing
// every drop.
function UnplacedTray({ skills }: { skills: SkillOption[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: UNPLACED });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border border-dashed px-4 py-3 ${
        isOver ? "border-(--cl-accent) bg-(--cl-pill)" : "border-(--cl-border)"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-(--cl-muted) mb-2">
        Not on this CV
      </p>
      <SortableContext items={skills.map((s) => s.id)} strategy={rectSortingStrategy}>
        <div className="flex flex-wrap gap-1.5 min-h-9">
          {skills.length === 0 ? (
            <p className="text-xs text-(--cl-muted) self-center">Every skill is placed.</p>
          ) : (
            skills.map((skill) => (
              <SkillChip key={skill.id} skill={skill} selected={false} disabled onToggle={() => {}} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
