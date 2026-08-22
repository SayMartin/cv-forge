"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CV_LAYOUTS, DEFAULT_LAYOUT_ID, DEFAULT_SECTION_ORDER, type SectionKey } from "@/lib/cv-layouts";
import { LayoutThumb } from "@/components/cv-layouts/thumbnails";
import { SectionOrderEditor } from "./SectionOrderEditor";
import { SortableEntryList } from "./SortableEntryList";
import { CvSkillsEditor, type CategoryOption } from "./CvSkillsEditor";
import type { CvSkillGroup } from "@/lib/cv-content-types";

type Entry = { id: string; [key: string]: unknown };
type Experience = Entry & { company: string; role: string };
type Education = Entry & { institution: string; degree?: string };
type Skill = Entry & { name: string; category?: string };
type Project = Entry & { title: string };
type Other = Entry & { title: string; subtitle?: string };
type Profile = Entry & {
  profileName: string;
  name: string;
  headline?: string;
};

type AvatarDoc = {
  id: string;
  images: string[];
};

type ThemeEntry = {
  id: string;
  name: string;
  sidebarColor: string;
  accentColor: string;
};

interface Props {
  cvId: string;
  initialName: string;
  onNameChange?: (name: string) => void;
  onDirtyChange?: (dirty: boolean) => void;
  initialLayoutId: string;
  initialThemeId: string | null;
  initialProfileId: string | null;
  initialAvatarIndex: number | null;
  initialExperienceIds: string[];
  initialEducationIds: string[];
  initialSkillIds: string[];
  initialSkillGroups: CvSkillGroup[];
  initialProjectIds: string[];
  initialOtherIds: string[];
  initialTargetRole: string | null;
  initialCoverLetter: string | null;
  initialSectionOrder?: string[];
  initialChronological?: boolean;
  profiles: Profile[];
  avatarDoc: AvatarDoc | null;
  experiences: Experience[];
  educations: Education[];
  skills: Skill[];
  skillCategories: CategoryOption[];
  projects: Project[];
  others: Other[];
  themes: ThemeEntry[];
}


export function CvEditor({
  cvId,
  initialName,
  onNameChange,
  onDirtyChange,
  initialLayoutId,
  initialThemeId,
  initialProfileId,
  initialAvatarIndex,
  initialExperienceIds,
  initialEducationIds,
  initialSkillIds,
  initialSkillGroups,
  initialProjectIds,
  initialOtherIds,
  initialTargetRole,
  initialCoverLetter,
  initialSectionOrder,
  initialChronological,
  profiles,
  avatarDoc,
  experiences,
  educations,
  skills,
  skillCategories,
  projects,
  others,
  themes: initialThemes,
}: Props) {
  const router = useRouter();

  const [name, setName] = useState(initialName);
  const [layoutId, setLayoutId] = useState(
    initialLayoutId ?? DEFAULT_LAYOUT_ID,
  );
  const [themeId, setThemeId] = useState<string | null>(initialThemeId);
  const [themes, setThemes] = useState<ThemeEntry[]>(initialThemes);
  const [profileId, setProfileId] = useState<string | null>(initialProfileId);
  const [avatarIndex, setAvatarIndex] = useState<number | null>(
    initialAvatarIndex,
  );

  // Ordered arrays — position determines order in the rendered CV
  const [experienceIds, setExperienceIds] = useState<string[]>(initialExperienceIds);
  const [educationIds, setEducationIds] = useState<string[]>(initialEducationIds);
  const [skillIds, setSkillIds] = useState<string[]>(initialSkillIds);
  const [skillGroups, setSkillGroups] = useState<CvSkillGroup[]>(initialSkillGroups);
  const [projectIds, setProjectIds] = useState<string[]>(initialProjectIds);
  const [otherIds, setOtherIds] = useState<string[]>(initialOtherIds);

  const [sectionOrder, setSectionOrder] = useState<SectionKey[]>(
    (initialSectionOrder?.length ? initialSectionOrder : DEFAULT_SECTION_ORDER) as SectionKey[],
  );
  const [chronological, setChronological] = useState<boolean>(initialChronological ?? false);
  const [targetRole, setTargetRole] = useState<string>(initialTargetRole ?? "");
  const [coverLetter, setCoverLetter] = useState<string>(initialCoverLetter ?? "");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [creatingTheme, setCreatingTheme] = useState(false);
  const [themeNameSaved, setThemeNameSaved] = useState(false);

  // Debounce timer ref for patching theme colors
  const colorDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentTheme = themes.find((t) => t.id === themeId) ?? null;

  function markDirty() {
    setIsDirty(true);
    onDirtyChange?.(true);
    setSaved(false);
  }

  function toggle(ids: string[], setIds: (ids: string[]) => void, id: string) {
    if (ids.includes(id)) {
      setIds(ids.filter((x) => x !== id));
    } else {
      setIds([...ids, id]); // append to end — preserves existing order
    }
    markDirty();
  }

  function toggleAll(ids: string[], setIds: (ids: string[]) => void, allIds: string[]) {
    setIds(ids.length === allIds.length ? [] : [...allIds]);
    markDirty();
  }

  function handleColorChange(
    field: "sidebarColor" | "accentColor",
    value: string,
  ) {
    if (!themeId) return;
    // Update local state immediately for live preview
    setThemes((prev) =>
      prev.map((t) => (t.id === themeId ? { ...t, [field]: value } : t)),
    );
    // Debounce the API call (saves directly — does not affect dirty state)
    if (colorDebounceRef.current) clearTimeout(colorDebounceRef.current);
    colorDebounceRef.current = setTimeout(async () => {
      await fetch(`/api/themes/${themeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
    }, 400);
  }

  async function handleCreateTheme() {
    setCreatingTheme(true);
    const res = await fetch("/api/themes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "My theme" }),
    });
    if (res.ok) {
      const theme: ThemeEntry = await res.json();
      setThemes((prev) => [...prev, theme]);
      setThemeId(theme.id);
      markDirty();
    }
    setCreatingTheme(false);
  }

  async function handleDeleteTheme(id: string) {
    if (
      !confirm(
        "Delete this theme? CVs using it will lose their colour settings.",
      )
    )
      return;
    const res = await fetch(`/api/themes/${id}`, { method: "DELETE" });
    if (res.ok) {
      setThemes((prev) => prev.filter((t) => t.id !== id));
      if (themeId === id) {
        setThemeId(null);
        markDirty();
      }
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/cvs/${cvId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        layoutId,
        themeId,
        profileId,
        avatarIndex,
        experienceIds,
        educationIds,
        skillIds,
        skillGroups,
        projectIds,
        otherIds,
        sectionOrder,
        chronological,
        targetRole: targetRole.trim() || null,
        coverLetter: coverLetter.trim() || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Save failed");
    } else {
      setSaved(true);
      setIsDirty(false);
      onDirtyChange?.(false);
      onNameChange?.(name);
    }
    setSaving(false);
  }

  function handleRevert() {
    if (!confirm("Discard all unsaved changes?")) return;
    setName(initialName);
    setLayoutId(initialLayoutId ?? DEFAULT_LAYOUT_ID);
    setThemeId(initialThemeId);
    setProfileId(initialProfileId);
    setAvatarIndex(initialAvatarIndex);
    setExperienceIds(initialExperienceIds);
    setEducationIds(initialEducationIds);
    setSkillIds(initialSkillIds);
    setProjectIds(initialProjectIds);
    setOtherIds(initialOtherIds);
    setSectionOrder(
      (initialSectionOrder?.length ? initialSectionOrder : DEFAULT_SECTION_ORDER) as SectionKey[],
    );
    setChronological(initialChronological ?? false);
    setTargetRole(initialTargetRole ?? "");
    setCoverLetter(initialCoverLetter ?? "");
    setIsDirty(false);
    onDirtyChange?.(false);
    setSaved(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(true);

    const res = await fetch(`/api/cvs/${cvId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/cvs");
    } else {
      setError("Delete failed");
      setDeleting(false);
    }
  }

  const actionButtons = (
    <div className="flex items-center gap-2">
      {isDirty && (
        <button
          type="button"
          onClick={handleRevert}
          className="rounded-lg border border-(--cl-border) px-3 py-1.5 text-sm text-(--cl-muted) hover:border-red-400 hover:text-red-500 transition-colors bg-white"
        >
          Revert
        </button>
      )}
      <SaveButton
        onClick={handleSave}
        saving={saving}
        isDirty={isDirty}
        saved={saved}
      />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Name */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-(--cl-text)">
          CV name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            markDirty();
          }}
          maxLength={100}
          className="w-full border border-(--cl-border) rounded-lg px-3 py-2 text-sm bg-white text-(--cl-text) focus:outline-none focus:ring-2 focus:ring-(--cl-accent)"
        />
      </div>

      {/* Tailored for */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-(--cl-text)">
          Tailored for
        </label>
        <input
          type="text"
          value={targetRole}
          onChange={(e) => { setTargetRole(e.target.value); markDirty(); }}
          placeholder="e.g. Acme Corp — Senior Designer"
          maxLength={100}
          className="w-full border border-(--cl-border) rounded-lg px-3 py-2 text-sm bg-white text-(--cl-text) placeholder:text-(--cl-muted) focus:outline-none focus:ring-2 focus:ring-(--cl-accent)"
        />
        <p className="text-xs text-(--cl-muted)">Only shown in the CV list — not printed.</p>
      </div>

      {/* Layout picker */}
      <Section title="Layout">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CV_LAYOUTS.map((layout) => {
            const selected = layoutId === layout.id;
            return (
              <button
                key={layout.id}
                type="button"
                onClick={() => {
                  setLayoutId(layout.id);
                  markDirty();
                }}
                className={`flex flex-col items-center gap-2 rounded-lg border p-2 transition-colors ${
                  selected
                    ? "border-(--cl-accent) bg-green-50"
                    : "border-(--cl-border) hover:border-(--cl-accent) bg-white"
                }`}
              >
                <LayoutThumb
                  layoutId={layout.id}
                  sidebarColor={currentTheme?.sidebarColor}
                  accentColor={currentTheme?.accentColor}
                  selected={selected}
                />
                <p
                  className={`text-xs font-medium ${selected ? "text-(--cl-accent)" : "text-(--cl-text)"}`}
                >
                  {layout.name}
                </p>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Theme picker */}
      <Section title="Colour theme" headerAction={actionButtons}>
        <div className="space-y-3">
          {/* Theme cards */}
          <div className="flex flex-wrap gap-2">
            {/* "None" option */}
            <button
              type="button"
              onClick={() => {
                setThemeId(null);
                markDirty();
              }}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
                themeId === null
                  ? "border-(--cl-accent) bg-green-50 text-(--cl-accent) font-medium"
                  : "border-(--cl-border) text-(--cl-muted) hover:border-(--cl-accent) bg-white"
              }`}
            >
              Default
            </button>

            {themes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setThemeId(t.id);
                  markDirty();
                }}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
                  themeId === t.id
                    ? "border-(--cl-accent) bg-green-50 font-medium text-(--cl-text)"
                    : "border-(--cl-border) text-(--cl-muted) hover:border-(--cl-accent) bg-white"
                }`}
              >
                {/* Colour swatches */}
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: t.sidebarColor,
                    border: "1px solid rgba(0,0,0,0.15)",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: t.accentColor,
                    border: "1px solid rgba(0,0,0,0.15)",
                    flexShrink: 0,
                  }}
                />
                {t.name}
              </button>
            ))}

            <button
              type="button"
              onClick={handleCreateTheme}
              disabled={creatingTheme}
              className="flex items-center gap-1 rounded-lg border border-dashed border-(--cl-border) px-3 py-2 text-xs text-(--cl-muted) hover:border-(--cl-accent) hover:text-(--cl-accent) transition-colors disabled:opacity-50"
            >
              {creatingTheme ? "Creating…" : "+ New theme"}
            </button>
          </div>

          {/* Inline colour editor for selected theme */}
          {currentTheme && (
            <div className="rounded-lg border border-(--cl-border) bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={currentTheme.name}
                    onChange={async (e) => {
                      const newName = e.target.value;
                      setThemes((prev) =>
                        prev.map((t) =>
                          t.id === currentTheme.id ? { ...t, name: newName } : t,
                        ),
                      );
                      setThemeNameSaved(false);
                      await fetch(`/api/themes/${currentTheme.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: newName }),
                      });
                      setThemeNameSaved(true);
                      setTimeout(() => setThemeNameSaved(false), 2000);
                    }}
                    maxLength={50}
                    className="text-sm font-medium bg-transparent border-b border-(--cl-border) focus:outline-none focus:border-(--cl-accent) py-0.5 w-40"
                  />
                  {themeNameSaved && (
                    <span className="text-xs text-(--cl-muted)">Saved ✓</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteTheme(currentTheme.id)}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-xs text-(--cl-muted)">
                  <input
                    type="color"
                    value={currentTheme.sidebarColor}
                    onChange={(e) =>
                      handleColorChange("sidebarColor", e.target.value)
                    }
                    className="w-8 h-8 rounded cursor-pointer border border-(--cl-border) p-0.5"
                  />
                  Sidebar
                </label>
                <label className="flex items-center gap-2 text-xs text-(--cl-muted)">
                  <input
                    type="color"
                    value={currentTheme.accentColor}
                    onChange={(e) =>
                      handleColorChange("accentColor", e.target.value)
                    }
                    className="w-8 h-8 rounded cursor-pointer border border-(--cl-border) p-0.5"
                  />
                  Accent
                </label>
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Profile */}
      {profiles.length > 0 && (
        <Section title="Profile" headerAction={<ContentLink cvId={cvId} tab="profiles" />}>
          <div className="space-y-2">
            {profiles.map((p) => {
              const selected = profileId === p.id;
              return (
                <label key={p.id} className="flex items-center gap-3 py-1 cursor-pointer group">
                  <input
                    type="radio"
                    name="profile"
                    checked={selected}
                    onChange={() => {
                      setProfileId(p.id);
                      markDirty();
                    }}
                    className="h-4 w-4 accent-(--cl-accent)"
                  />
                  <span className="text-sm text-(--cl-muted) group-hover:text-(--cl-text)">
                    {p.profileName}
                    {p.name ? ` — ${p.name}` : ""}
                  </span>
                </label>
              );
            })}
          </div>
        </Section>
      )}

      {/* Avatar */}
      {avatarDoc && avatarDoc.images.length > 0 && (
        <Section title="Avatar" headerAction={<ContentLink cvId={cvId} tab="avatars" />}>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setAvatarIndex(null);
                markDirty();
              }}
              className={`text-xs px-2 py-1 rounded border transition-colors ${
                avatarIndex === null
                  ? "border-(--cl-accent) bg-(--cl-accent) text-white"
                  : "border-(--cl-border) text-(--cl-muted) hover:border-(--cl-accent)"
              }`}
            >
              None
            </button>
            {avatarDoc.images.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt={`Avatar ${i + 1}`}
                onClick={() => {
                  setAvatarIndex(i);
                  markDirty();
                }}
                className={`w-12 h-12 rounded-full object-cover cursor-pointer transition-all ${
                  avatarIndex === i
                    ? "ring-2 ring-(--cl-accent) ring-offset-2"
                    : "opacity-60 hover:opacity-100"
                }`}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <Section
          title="Experience"
          headerAction={<ContentLink cvId={cvId} tab="experience" />}
          allIds={experiences.map((e) => e.id)}
          selectedIds={experienceIds}
          onToggleAll={() =>
            toggleAll(experienceIds, setExperienceIds, experiences.map((e) => e.id))
          }
        >
          <SortableEntryList
            ids={experienceIds}
            onReorder={(ids) => { setExperienceIds(ids); markDirty(); }}
            entries={experiences}
            getLabel={(e) => `${e.role} @ ${e.company}`}
            onToggle={(id) => toggle(experienceIds, setExperienceIds, id)}
          />
        </Section>
      )}

      {/* Education */}
      {educations.length > 0 && (
        <Section
          title="Education"
          headerAction={<ContentLink cvId={cvId} tab="education" />}
          allIds={educations.map((e) => e.id)}
          selectedIds={educationIds}
          onToggleAll={() =>
            toggleAll(educationIds, setEducationIds, educations.map((e) => e.id))
          }
        >
          <SortableEntryList
            ids={educationIds}
            onReorder={(ids) => { setEducationIds(ids); markDirty(); }}
            entries={educations}
            getLabel={(e) => `${e.degree ?? "Degree"} — ${e.institution}`}
            onToggle={(id) => toggle(educationIds, setEducationIds, id)}
          />
        </Section>
      )}

      {/* Skills — grouped per CV, so the arrangement is not a checkbox list */}
      {skills.length > 0 && (
        <Section title="Skills" headerAction={<ContentLink cvId={cvId} tab="skills" />}>
          <CvSkillsEditor
            skills={skills}
            categories={skillCategories}
            groups={skillGroups}
            selectedIds={skillIds}
            onGroupsChange={(g) => { setSkillGroups(g); markDirty(); }}
            onSelectedChange={(ids) => { setSkillIds(ids); markDirty(); }}
          />
        </Section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <Section
          title="Projects"
          headerAction={<ContentLink cvId={cvId} tab="projects" />}
          allIds={projects.map((p) => p.id)}
          selectedIds={projectIds}
          onToggleAll={() =>
            toggleAll(projectIds, setProjectIds, projects.map((p) => p.id))
          }
        >
          <SortableEntryList
            ids={projectIds}
            onReorder={(ids) => { setProjectIds(ids); markDirty(); }}
            entries={projects}
            getLabel={(p) => p.title}
            onToggle={(id) => toggle(projectIds, setProjectIds, id)}
          />
        </Section>
      )}

      {/* Other */}
      {others.length > 0 && (
        <Section
          title="Other"
          headerAction={<ContentLink cvId={cvId} tab="other" />}
          allIds={others.map((o) => o.id)}
          selectedIds={otherIds}
          onToggleAll={() =>
            toggleAll(otherIds, setOtherIds, others.map((o) => o.id))
          }
        >
          <SortableEntryList
            ids={otherIds}
            onReorder={(ids) => { setOtherIds(ids); markDirty(); }}
            entries={others}
            getLabel={(o) => o.subtitle ? `${o.title} — ${o.subtitle}` : o.title}
            onToggle={(id) => toggle(otherIds, setOtherIds, id)}
          />
        </Section>
      )}

      {/* Timeline mode */}
      <Section title="Timeline">
        <div className="flex flex-col gap-2">
          <label className="flex items-start gap-2 cursor-pointer group">
            <input
              type="radio"
              name="chronological"
              checked={!chronological}
              onChange={() => { setChronological(false); markDirty(); }}
              className="mt-0.5 h-4 w-4 accent-(--cl-accent)"
            />
            <span className="text-sm text-(--cl-text)">
              Grouped by section
              <span className="block text-xs text-(--cl-muted)">Experience, Education, Projects, and Other each render as their own block, in the order below.</span>
            </span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer group">
            <input
              type="radio"
              name="chronological"
              checked={chronological}
              onChange={() => { setChronological(true); markDirty(); }}
              className="mt-0.5 h-4 w-4 accent-(--cl-accent)"
            />
            <span className="text-sm text-(--cl-text)">
              Mixed, chronological order
              <span className="block text-xs text-(--cl-muted)">Experience, Education, Projects, and Other are merged into one timeline sorted by date (most recent first). Skills stays separate.</span>
            </span>
          </label>
        </div>
      </Section>

      {/* Section order */}
      {!chronological && (
        <Section title="Section order">
          <p className="text-xs text-(--cl-muted) mb-3">Hold and drag to reorder sections in your CV.</p>
          <SectionOrderEditor
            sectionOrder={sectionOrder}
            onChange={(order) => { setSectionOrder(order); markDirty(); }}
          />
        </Section>
      )}

      {/* Cover letter */}
      <Section title="Cover letter">
        <textarea
          value={coverLetter}
          onChange={(e) => { setCoverLetter(e.target.value); markDirty(); }}
          placeholder="Write a cover letter for this application…"
          rows={8}
          maxLength={5000}
          className="w-full border border-(--cl-border) rounded-lg px-3 py-2 text-sm bg-white text-(--cl-text) placeholder:text-(--cl-muted) focus:outline-none focus:ring-2 focus:ring-(--cl-accent) resize-y"
        />
        <p className="text-xs text-(--cl-muted)">Printed as a separate page before the CV when not empty.</p>
      </Section>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-2">
        {actionButtons}
        {error && <span className="text-sm text-red-600">{error}</span>}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="ml-auto text-sm text-red-500 hover:text-red-700 disabled:opacity-50 flex items-center gap-1.5"
        >
          {deleting && (
            <svg className="animate-spin h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {deleting ? "Deleting…" : "Delete CV"}
        </button>
      </div>
    </div>
  );
}

function SaveButton({
  onClick,
  saving,
  isDirty,
  saved,
}: {
  onClick: () => void;
  saving: boolean;
  isDirty: boolean;
  saved: boolean;
}) {
  if (saving) {
    return (
      <button
        disabled
        className="bg-(--cl-accent) text-white rounded-lg px-4 py-1.5 text-sm font-medium opacity-60 cursor-not-allowed flex items-center gap-2"
      >
        <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Saving…
      </button>
    );
  }
  if (isDirty) {
    return (
      <button
        onClick={onClick}
        className="bg-(--cl-accent) text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-(--cl-accent-hov) transition-colors flex items-center gap-1.5"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-300 shrink-0" />
        Save changes
      </button>
    );
  }
  if (saved) {
    return (
      <button
        disabled
        className="rounded-lg px-4 py-1.5 text-sm font-medium text-(--cl-muted) bg-(--cl-pill) cursor-default"
      >
        Saved ✓
      </button>
    );
  }
  // Initial state — no changes yet
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-(--cl-border) px-4 py-1.5 text-sm font-medium text-(--cl-muted) hover:border-(--cl-accent) hover:text-(--cl-accent) transition-colors bg-white"
    >
      Save
    </button>
  );
}

// A CV section only picks from the library; the wording lives in My Content. The
// link carries the CV along so that page can offer a way straight back, and names
// the tab so the trip lands on the right one.
function ContentLink({ cvId, tab }: { cvId: string; tab: string }) {
  return (
    <Link
      href={`/content?tab=${tab}&from=${cvId}`}
      className="text-xs text-(--cl-muted) hover:text-(--cl-accent) transition-colors whitespace-nowrap"
    >
      My Content →
    </Link>
  );
}

function Section({
  title,
  children,
  allIds,
  selectedIds,
  onToggleAll,
  headerAction,
}: {
  title: string;
  children: React.ReactNode;
  allIds?: string[];
  selectedIds?: string[];
  onToggleAll?: () => void;
  headerAction?: React.ReactNode;
}) {
  const allChecked = allIds && selectedIds && selectedIds.length === allIds.length;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between border-b border-(--cl-border) pb-1">
        <h2 className="text-base font-semibold text-(--cl-text)">{title}</h2>
        <div className="flex items-center gap-3">
          {headerAction}
          {onToggleAll && (
            <button
              type="button"
              onClick={onToggleAll}
              className="text-xs text-(--cl-muted) hover:text-(--cl-accent) transition-colors"
            >
              {allChecked ? "None" : "All"}
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

