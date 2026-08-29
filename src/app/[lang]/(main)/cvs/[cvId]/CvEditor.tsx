"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { LAYOUT_IDS, DEFAULT_LAYOUT_ID, DEFAULT_SECTION_ORDER, type SectionKey } from "@/lib/cv-layouts";
import { LayoutThumb } from "@/components/cv-layouts/thumbnails";
import { SectionOrderEditor } from "./SectionOrderEditor";
import { SortableEntryList } from "./SortableEntryList";
import { CvSkillsEditor, type CategoryOption } from "./CvSkillsEditor";
import { ActionChip } from "@/components/ActionChip";
import type { CvSkillGroup } from "@/lib/cv-content-types";
import { localeHref } from "@/i18n/routing";
import { useLocale } from "@/i18n/useLocale";
import { DEFAULT_LOCALE, isLocale, LOCALES, type Locale } from "@/i18n/config";
import { useDictionary } from "@/i18n/DictionaryProvider";
import { useApiError } from "@/i18n/useApiError";
import { format } from "@/i18n/format";

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
  /** Breadcrumb trail, rendered on the left of the sticky header. */
  headerTrail?: React.ReactNode;
  /** Preview link, rendered after the save controls in the sticky header. */
  headerLink?: React.ReactNode;
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
  initialLanguage?: string;
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
  headerTrail,
  headerLink,
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
  initialLanguage,
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
  const locale = useLocale();
  const { editor: t, layouts } = useDictionary();
  const apiError = useApiError();

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
  // The CV's own language — deliberately seeded from the row, never from
  // `useLocale()`. Defaulting an existing CV to the UI locale would silently
  // re-language every document the first time a Swedish user opened one.
  const [cvLanguage, setCvLanguage] = useState<Locale>(
    isLocale(initialLanguage) ? initialLanguage : DEFAULT_LOCALE,
  );
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
      body: JSON.stringify({ name: t.theme.newName }),
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
    if (!confirm(t.theme.confirmDelete)) return;
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
        language: cvLanguage,
        targetRole: targetRole.trim() || null,
        coverLetter: coverLetter.trim() || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(apiError(data, t.save.failed));
    } else {
      setSaved(true);
      setIsDirty(false);
      onDirtyChange?.(false);
      onNameChange?.(name);
    }
    setSaving(false);
  }

  function handleRevert() {
    if (!confirm(t.revert.confirm)) return;
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
    setCvLanguage(isLocale(initialLanguage) ? initialLanguage : DEFAULT_LOCALE);
    setTargetRole(initialTargetRole ?? "");
    setCoverLetter(initialCoverLetter ?? "");
    setIsDirty(false);
    onDirtyChange?.(false);
    setSaved(false);
  }

  async function handleDelete() {
    if (!confirm(format(t.deleteCv.confirm, { name }))) return;
    setDeleting(true);

    const res = await fetch(`/api/cvs/${cvId}`, { method: "DELETE" });
    if (res.ok) {
      router.push(localeHref(locale, "/cvs"));
    } else {
      setError(t.deleteCv.failed);
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
          {t.revert.label}
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
    <>
      {/* Save and Revert are what this page is used for, and the form below is
          long enough that a copy at the bottom was never in reach — hence the
          pin. The trail rides along because it costs no extra height and keeps
          the CV switcher reachable too.

          Same full-bleed band and same `max-w-5xl px-6` inner container as
          NavBar and the footer, so it reads as a second row of chrome rather
          than a card floating in the page: the trail lands under the logo and
          Preview under Sign out. That is deliberately *wider* than the
          `max-w-4xl` form below — the bar belongs to the page's chrome, the
          form to the editing surface.

          z-30 clears the z-index 10 the sortable lists give a dragged row, so a
          row passes under the bar rather than over it. The background must be
          opaque, not tinted, because the page content scrolls underneath. */}
      <div className="sticky top-0 z-30 border-b border-(--cl-border) bg-(--cl-bg)">
        <div className="max-w-5xl mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="min-w-0">{headerTrail}</div>
          {/* Wraps to its own line rather than shrinking when the trail and the
              three controls stop fitting side by side, which on a phone they do. */}
          <div className="flex items-center gap-2 shrink-0">
            {actionButtons}
            {headerLink}
          </div>
        </div>
        {/* Under the row, not in it: a save error is as long as the API decides
            it is, and it must not squeeze the buttons that produced it. */}
        {error && (
          <p role="alert" className="max-w-5xl mx-auto px-6 pb-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>

      {/* max-w-4xl, as on My Content: this is the other editing surface, and
          the reading measure the list pages use was only ever a ceiling here.
          The gutter sits on this column rather than on `main` so the sticky
          bar above can still reach the full width of the viewport. */}
      <div className="max-w-4xl mx-auto px-4 pt-8 space-y-8">
        {/* Name */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-(--cl-text)">
            {t.name.label}
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
            {t.targetRole.label}
          </label>
          <input
            type="text"
            value={targetRole}
            onChange={(e) => { setTargetRole(e.target.value); markDirty(); }}
            placeholder={t.targetRole.placeholder}
            maxLength={100}
            className="w-full border border-(--cl-border) rounded-lg px-3 py-2 text-sm bg-white text-(--cl-text) placeholder:text-(--cl-muted) focus:outline-none focus:ring-2 focus:ring-(--cl-accent)"
          />
          <p className="text-sm text-(--cl-muted)">{t.targetRole.help}</p>
        </div>

        {/* Layout picker */}
        <Section title={t.layout.title}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {LAYOUT_IDS.map((id) => {
              const selected = layoutId === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setLayoutId(id);
                    markDirty();
                  }}
                  className={`flex flex-col items-center gap-2 rounded-lg border p-2 transition-colors ${
                    selected
                      ? "border-(--cl-accent) bg-green-50"
                      : "border-(--cl-border) hover:border-(--cl-accent) bg-white"
                  }`}
                >
                  <LayoutThumb
                    layoutId={id}
                    sidebarColor={currentTheme?.sidebarColor}
                    accentColor={currentTheme?.accentColor}
                    selected={selected}
                  />
                  <p
                    className={`text-sm font-medium ${selected ? "text-(--cl-accent)" : "text-(--cl-text)"}`}
                  >
                    {layouts[id].name}
                  </p>
                </button>
              );
            })}
          </div>
        </Section>

        {/* CV language — the language of the document, not of the app */}
        <Section title={t.cvLanguage.title}>
          <p className="text-sm text-(--cl-muted) mb-3">{t.cvLanguage.help}</p>
          <div className="flex flex-col gap-2">
            {LOCALES.map((code) => (
              <label key={code} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="cvLanguage"
                  checked={cvLanguage === code}
                  onChange={() => { setCvLanguage(code); markDirty(); }}
                  className="h-4 w-4 accent-(--cl-accent)"
                />
                <span className="text-sm text-(--cl-text)">{t.cvLanguage.names[code]}</span>
              </label>
            ))}
          </div>
        </Section>

        {/* Theme picker */}
        <Section title={t.theme.title}>
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
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  themeId === null
                    ? "border-(--cl-accent) bg-green-50 text-(--cl-accent) font-medium"
                    : "border-(--cl-border) text-(--cl-muted) hover:border-(--cl-accent) bg-white"
                }`}
              >
                {t.theme.none}
              </button>

              {themes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setThemeId(t.id);
                    markDirty();
                  }}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
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
                className="flex items-center gap-1 rounded-lg border border-dashed border-(--cl-border) px-3 py-2 text-sm text-(--cl-muted) hover:border-(--cl-accent) hover:text-(--cl-accent) transition-colors disabled:opacity-50"
              >
                {creatingTheme ? t.theme.creating : t.theme.create}
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
                      <span className="text-sm text-(--cl-muted)">{t.theme.saved}</span>
                    )}
                  </div>
                  <ActionChip
                    tone="danger"
                    onClick={() => handleDeleteTheme(currentTheme.id)}
                  >
                    {t.theme.delete}
                  </ActionChip>
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm text-(--cl-muted)">
                    <input
                      type="color"
                      value={currentTheme.sidebarColor}
                      onChange={(e) =>
                        handleColorChange("sidebarColor", e.target.value)
                      }
                      className="w-8 h-8 rounded cursor-pointer border border-(--cl-border) p-0.5"
                    />
                    {t.theme.sidebar}
                  </label>
                  <label className="flex items-center gap-2 text-sm text-(--cl-muted)">
                    <input
                      type="color"
                      value={currentTheme.accentColor}
                      onChange={(e) =>
                        handleColorChange("accentColor", e.target.value)
                      }
                      className="w-8 h-8 rounded cursor-pointer border border-(--cl-border) p-0.5"
                    />
                    {t.theme.accent}
                  </label>
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Profile */}
        {profiles.length > 0 && (
          <Section title={t.profile.title} headerAction={<ContentLink cvId={cvId} tab="profiles" />}>
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
          <Section title={t.avatar.title} headerAction={<ContentLink cvId={cvId} tab="avatars" />}>
            <div className="flex items-center gap-3 flex-wrap">
              <ActionChip
                selected={avatarIndex === null}
                onClick={() => {
                  setAvatarIndex(null);
                  markDirty();
                }}
              >
                {t.avatar.none}
              </ActionChip>
              {avatarDoc.images.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt={format(t.avatar.alt, { number: i + 1 })}
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
            title={t.sections.experience}
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
              getLabel={(e) => format(t.entries.experience, { role: e.role, company: e.company })}
              onToggle={(id) => toggle(experienceIds, setExperienceIds, id)}
            />
          </Section>
        )}

        {/* Education */}
        {educations.length > 0 && (
          <Section
            title={t.sections.education}
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
              getLabel={(e) =>
                format(t.entries.education, {
                  degree: e.degree ?? t.entries.degreeFallback,
                  institution: e.institution,
                })
              }
              onToggle={(id) => toggle(educationIds, setEducationIds, id)}
            />
          </Section>
        )}

        {/* Skills — grouped per CV, so the arrangement is not a checkbox list */}
        {skills.length > 0 && (
          <Section title={t.sections.skills} headerAction={<ContentLink cvId={cvId} tab="skills" />}>
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
            title={t.sections.projects}
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
            title={t.sections.other}
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
              getLabel={(o) =>
                o.subtitle ? format(t.entries.other, { title: o.title, subtitle: o.subtitle }) : o.title
              }
              onToggle={(id) => toggle(otherIds, setOtherIds, id)}
            />
          </Section>
        )}

        {/* Timeline mode */}
        <Section title={t.timeline.title}>
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
                {t.timeline.grouped.label}
                <span className="block text-sm text-(--cl-muted)">{t.timeline.grouped.description}</span>
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
                {t.timeline.chronological.label}
                <span className="block text-sm text-(--cl-muted)">{t.timeline.chronological.description}</span>
              </span>
            </label>
          </div>
        </Section>

        {/* Section order */}
        {!chronological && (
          <Section title={t.sectionOrder.title}>
            <p className="text-sm text-(--cl-muted) mb-3">{t.sectionOrder.help}</p>
            <SectionOrderEditor
              sectionOrder={sectionOrder}
              onChange={(order) => { setSectionOrder(order); markDirty(); }}
            />
          </Section>
        )}

        {/* Cover letter */}
        <Section title={t.coverLetter.title}>
          <textarea
            value={coverLetter}
            onChange={(e) => { setCoverLetter(e.target.value); markDirty(); }}
            placeholder={t.coverLetter.placeholder}
            rows={8}
            maxLength={5000}
            className="w-full border border-(--cl-border) rounded-lg px-3 py-2 text-sm bg-white text-(--cl-text) placeholder:text-(--cl-muted) focus:outline-none focus:ring-2 focus:ring-(--cl-accent) resize-y"
          />
          <p className="text-sm text-(--cl-muted)">{t.coverLetter.help}</p>
        </Section>

        {/* Actions — save moved to the sticky header, so this row is the one
            destructive control, kept at the far end of the form where it cannot
            be hit by accident. */}
        <div className="flex items-center justify-end pt-2">
          <ActionChip
            tone="danger-strong"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting && (
              <svg className="animate-spin h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {deleting ? t.deleteCv.deleting : t.deleteCv.label}
          </ActionChip>
        </div>
      </div>
    </>
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
  const t = useDictionary().editor.save;

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
        {t.saving}
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
        {t.dirty}
      </button>
    );
  }
  if (saved) {
    return (
      <button
        disabled
        className="rounded-lg px-4 py-1.5 text-sm font-medium text-(--cl-muted) bg-(--cl-pill) cursor-default"
      >
        {t.saved}
      </button>
    );
  }
  // Initial state — no changes yet
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-(--cl-border) px-4 py-1.5 text-sm font-medium text-(--cl-muted) hover:border-(--cl-accent) hover:text-(--cl-accent) transition-colors bg-white"
    >
      {t.idle}
    </button>
  );
}

// A CV section only picks from the library; the wording lives in My Content. The
// link carries the CV along so that page can offer a way straight back, and names
// the tab so the trip lands on the right one.
function ContentLink({ cvId, tab }: { cvId: string; tab: string }) {
  const { myContent } = useDictionary().nav;
  return (
    <ActionChip href={`/content?tab=${tab}&from=${cvId}`}>{myContent} →</ActionChip>
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
  const t = useDictionary().editor;
  const allChecked = allIds && selectedIds && selectedIds.length === allIds.length;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4 border-b border-(--cl-border) pb-1.5">
        {/* The header action belongs to the heading — it names where this
            section's wording is edited — so it sits beside the title rather than
            banished to the far edge. gap-4 is the air that keeps it from being
            read as part of the title itself. The All/None toggle acts on the
            list below, not on the heading, and stays right-aligned above it. */}
        <div className="flex min-w-0 items-center gap-4">
          <h2 className="text-base font-semibold text-(--cl-text)">{title}</h2>
          {headerAction}
        </div>
        {onToggleAll && (
          <ActionChip onClick={onToggleAll}>
            {allChecked ? t.selectNone : t.selectAll}
          </ActionChip>
        )}
      </div>
      {children}
    </div>
  );
}

