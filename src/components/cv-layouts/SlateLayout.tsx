import type { CvContent, CvEducation, CvExperience, CvOther } from "@/lib/cv-content-types";
import { getContrastColor } from "@/lib/color-utils";
import type { CvTheme } from "@/lib/cv-theme";
import { DEFAULT_SECTION_ORDER, type SectionKey } from "@/lib/cv-layouts";
import { buildTimeline } from "@/lib/cv-timeline";
import { cvStrings, type CvStrings } from "@/lib/cv-strings";
import { format } from "@/i18n/format";
import { Paginated } from "./pagination/Paginated";
import type { PageBlock } from "./pagination/types";

const DEFAULT_ACCENT = "#6366f1";
const DEFAULT_SIDEBAR_BG = "#1e293b";

// `locale` is the CV's, from `cvStrings(language).dateLocale` — passed rather
// than read, because this helper sits above the component that knows it.
function formatDate(dateStr: string | null | undefined, locale: string) {
  if (!dateStr) return "";
  if (/^\d{4}$/.test(dateStr)) return dateStr;
  const [year, month] = dateStr.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
  });
}


type SColors = { accent: string; sidebarText: string; sidebarMuted: string };

function SidebarLabel({ text, colors }: { text: string; colors: SColors }) {
  return (
    <p className="text-xs font-bold tracking-[1.5px] uppercase mb-2" style={{ color: colors.accent }}>
      {text}
    </p>
  );
}

function SidebarCategoryLabel({ text, colors }: { text: string; colors: SColors }) {
  return (
    <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: colors.sidebarMuted }}>
      {text}
    </p>
  );
}

function SidebarDivider({ sidebarBg }: { sidebarBg: string }) {
  const lineColor =
    getContrastColor(sidebarBg) === "#ffffff"
      ? "rgba(255,255,255,0.1)"
      : "rgba(0,0,0,0.1)";
  return <div className="h-px my-1" style={{ background: lineColor }} />;
}

function ContactRow({
  icon,
  text,
  isLink,
  colors,
}: {
  icon: string;
  text: string;
  isLink?: boolean;
  colors: SColors;
}) {
  const textStyle = { color: isLink ? colors.accent : colors.sidebarText };
  const accentIcon = isLink ? colors.accent : colors.sidebarMuted;
  return (
    <li className="flex items-start gap-2">
      <span className="shrink-0 text-xs w-4 text-center" style={{ color: accentIcon }}>
        {icon}
      </span>
      {isLink ? (
        <a href={text} className="min-w-0 flex-1 text-xs wrap-break-word" style={textStyle}>{text}</a>
      ) : (
        <span className="min-w-0 flex-1 text-xs wrap-break-word" style={textStyle}>{text}</span>
      )}
    </li>
  );
}

function DotRating({ level, accent, emptyColor }: { level: number; accent: string; emptyColor: string }) {
  const filled = Math.max(0, Math.min(5, Math.round(level)));
  return (
    <div className="flex gap-0.5 shrink-0">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: i < filled ? accent : emptyColor }} />
      ))}
    </div>
  );
}

function SectionHeader({ title, accent }: { title: string; accent: string }) {
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      <p className="text-sm font-bold tracking-[2px] text-slate-900 uppercase">{title}</p>
      <div className="w-7 h-0.5 rounded-full" style={{ backgroundColor: accent }} />
    </div>
  );
}

function TypeBadge({ label }: { label: string }) {
  return (
    <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-0.5">
      {label}
    </p>
  );
}

function TechPill({ label }: { label: string }) {
  return (
    <span className="text-xs text-slate-500 bg-slate-100 rounded-full px-2 py-0.5 leading-none">
      {label}
    </span>
  );
}

function ProjectCard({ proj, accent, badge, t }: { proj: CvContent["projects"][0]; accent: string; badge?: boolean; t: CvStrings }) {
  const lang = proj.skills?.[0];
  const dateStr = [formatDate(proj.startDate, t.dateLocale), proj.current ? t.present : formatDate(proj.endDate, t.dateLocale)].filter(Boolean).join(" – ") || (proj.publishedAt ? formatDate(proj.publishedAt, t.dateLocale) : "");
  return (
    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
      {badge && <TypeBadge label={t.timelineType.projects} />}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <p className="text-sm font-bold" style={{ color: accent }}>{proj.title}</p>
        <div className="flex items-center gap-2 shrink-0">
          {dateStr && <p className="text-xs text-slate-400">{dateStr}</p>}
          {lang && (
            <span className="text-xs rounded-full px-2 py-0.5 leading-none" style={{ color: accent, background: `${accent}18` }}>
              {lang}
            </span>
          )}
        </div>
      </div>
      {proj.summary && <p className="text-sm text-slate-500 leading-relaxed">{proj.summary}</p>}
      {(proj.url || proj.sourceUrl) && (
        <div className="flex flex-col gap-0.5 mt-2 text-xs text-slate-400">
          {proj.url && (
            <span className="wrap-break-word">
              {t.liveAt} <a href={proj.url} style={{ color: accent }}>{proj.url}</a>
            </span>
          )}
          {proj.sourceUrl && (
            <span className="wrap-break-word">
              {t.source} <a href={proj.sourceUrl} style={{ color: accent }}>{proj.sourceUrl}</a>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function SlateLayout({
  content,
  theme,
  sectionOrder = DEFAULT_SECTION_ORDER,
  chronological = false,
  language,
}: {
  content: CvContent;
  theme?: CvTheme;
  sectionOrder?: SectionKey[];
  chronological?: boolean;
  language?: string;
}) {
  const { profile, experiences, educations, skillGroups, projects, others } = content;
  const t = cvStrings(language);

  const ACCENT = theme?.accentColor ?? DEFAULT_ACCENT;
  const SIDEBAR_BG = theme?.sidebarColor ?? DEFAULT_SIDEBAR_BG;
  const SIDEBAR_TEXT = getContrastColor(SIDEBAR_BG);
  const SIDEBAR_MUTED = SIDEBAR_TEXT === "#ffffff" ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)";
  const DOT_EMPTY = SIDEBAR_TEXT === "#ffffff" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)";

  const colors: SColors = { accent: ACCENT, sidebarText: SIDEBAR_TEXT, sidebarMuted: SIDEBAR_MUTED };

  const languageSkills = skillGroups.find((g) => g.kind === "language")?.skills ?? [];
  const techGroups = skillGroups.filter((g) => g.kind !== "language");

  const initials = profile?.name
    ? profile.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const sidebarStyle = { background: SIDEBAR_BG, width: "35%", color: SIDEBAR_TEXT } as const;

  function experienceEntry(job: CvExperience, opts?: { badge?: boolean; divider?: boolean }) {
    const dateStr = [formatDate(job.startDate, t.dateLocale), job.current ? t.present : formatDate(job.endDate, t.dateLocale)].filter(Boolean).join(" – ");
    return (
      <div className="break-inside-avoid">
        {opts?.badge && <TypeBadge label={t.timelineType.experience} />}
        <div className="flex items-baseline justify-between gap-4 mb-1.5">
          <p className="text-sm font-bold text-slate-900">
            {job.company}
            <span className="text-slate-400 font-normal mx-1.5">·</span>
            {job.role}
          </p>
          {dateStr && <p className="text-xs text-slate-400 shrink-0">{dateStr}</p>}
        </div>
        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {job.skills.map((s) => <TechPill key={s} label={s} />)}
          </div>
        )}
        {job.description && (
          <p className="text-sm text-slate-500 whitespace-pre-line leading-relaxed">{job.description}</p>
        )}
        {job.url && (
          <p className="text-xs text-slate-400 wrap-break-word mt-1">
            {t.liveAt} <a href={job.url} style={{ color: ACCENT }}>{job.url}</a>
          </p>
        )}
        {opts?.divider && <div className="mt-4 border-b border-slate-100" />}
      </div>
    );
  }

  function educationEntry(edu: CvEducation, opts?: { badge?: boolean; divider?: boolean }) {
    const dateStr = [formatDate(edu.startDate, t.dateLocale), edu.current ? t.present : formatDate(edu.endDate, t.dateLocale)].filter(Boolean).join(" – ");
    const degreeField = edu.field
      ? format(t.degreeIn, { degree: edu.degree ?? "", field: edu.field })
      : (edu.degree ?? "");
    return (
      <div className="break-inside-avoid">
        {opts?.badge && <TypeBadge label={t.timelineType.education} />}
        <div className="flex items-baseline justify-between gap-4 mb-1.5">
          <p className="text-sm font-bold text-slate-900">
            {edu.institution}
            {degreeField && (
              <><span className="text-slate-400 font-normal mx-1.5">·</span>{degreeField}</>
            )}
          </p>
          {dateStr && <p className="text-xs text-slate-400 shrink-0">{dateStr}</p>}
        </div>
        {edu.description && (
          <p className="text-sm text-slate-500 whitespace-pre-line leading-relaxed">{edu.description}</p>
        )}
        {opts?.divider && <div className="mt-4 border-b border-slate-100" />}
      </div>
    );
  }

  function otherEntry(o: CvOther, opts?: { badge?: boolean; divider?: boolean }) {
    return (
      <div className="break-inside-avoid">
        {opts?.badge && <TypeBadge label={t.timelineType.other} />}
        <div className="flex items-baseline justify-between gap-4 mb-1">
          <p className="text-sm font-bold text-slate-900">
            {o.title}
            {o.subtitle && (
              <><span className="text-slate-400 font-normal mx-1.5">·</span>{o.subtitle}</>
            )}
          </p>
          {o.date && <p className="text-xs text-slate-400 shrink-0">{formatDate(o.date, t.dateLocale)}</p>}
        </div>
        {o.url && (
          <p className="text-xs text-slate-400 wrap-break-word mb-1">
            <a href={o.url} style={{ color: ACCENT }}>{o.url}</a>
          </p>
        )}
        {o.description && (
          <p className="text-sm text-slate-500 leading-relaxed">{o.description}</p>
        )}
        {opts?.divider && <div className="mt-4 border-b border-slate-100" />}
      </div>
    );
  }

  // Each returned block is one atomic, unsplittable pagination unit — a
  // single entry, with the section title fused into the first one so a
  // title can never be orphaned alone at the bottom of a page.
  function sectionBlocks(key: SectionKey): PageBlock[] {
    switch (key) {
      case "experience":
        return experiences.map((job, i) => ({
          id: `experience-${job.id}`,
          node: (
            <div className="mb-6">
              {i === 0 && <SectionHeader title={t.sections.experience} accent={ACCENT} />}
              {experienceEntry(job, { divider: i < experiences.length - 1 })}
            </div>
          ),
        }));

      case "education":
        return educations.map((edu, i) => ({
          id: `education-${edu.id}`,
          node: (
            <div className="mb-6">
              {i === 0 && <SectionHeader title={t.sections.education} accent={ACCENT} />}
              {educationEntry(edu, { divider: i < educations.length - 1 })}
            </div>
          ),
        }));

      case "projects":
        return projects.map((proj, i) => ({
          id: `project-${proj.id}`,
          node: (
            <div className="mb-6">
              {i === 0 && <SectionHeader title={t.sections.projects} accent={ACCENT} />}
              <div className="break-inside-avoid">
                <ProjectCard proj={proj} accent={ACCENT} t={t} />
              </div>
            </div>
          ),
        }));

      case "other":
        return others.map((o, i) => ({
          id: `other-${o.id}`,
          node: (
            <div className="mb-6">
              {i === 0 && <SectionHeader title={t.sections.other} accent={ACCENT} />}
              {otherEntry(o, { divider: i < others.length - 1 })}
            </div>
          ),
        }));

      default:
        return [];
    }
  }

  // Merges experience/education/projects/other into one date-sorted timeline
  // (most recent/ongoing first). Skills always stays in the sidebar regardless
  // of mode, so no splicing is needed here.
  function chronologicalBlocks(): PageBlock[] {
    const timeline = buildTimeline(content);
    return timeline.map((entry, i) => {
      const isLast = i === timeline.length - 1;
      const entryNode = (() => {
        switch (entry.type) {
          case "experience": return experienceEntry(entry.data, { badge: true, divider: !isLast });
          case "education": return educationEntry(entry.data, { badge: true, divider: !isLast });
          case "projects": return <ProjectCard proj={entry.data} accent={ACCENT} badge t={t} />;
          case "other": return otherEntry(entry.data, { badge: true, divider: !isLast });
        }
      })();
      return {
        id: `${entry.type}-${entry.id}`,
        node: (
          <div className="mb-6">
            {i === 0 && <SectionHeader title={t.sections.timeline} accent={ACCENT} />}
            {entryNode}
          </div>
        ),
      };
    });
  }

  const sidebarFirst = (
    <>
      <div className="flex flex-col items-center px-6 pt-8 pb-5 gap-3">
        {content.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={content.avatarUrl} alt={profile?.name ?? ""} className="w-20 h-20 rounded-full object-cover shrink-0" style={{ border: `3px solid ${ACCENT}` }} />
        ) : (
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold shrink-0" style={{ border: `3px solid ${ACCENT}`, background: DOT_EMPTY, color: SIDEBAR_TEXT }}>
            {initials}
          </div>
        )}
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-base font-bold leading-tight" style={{ color: SIDEBAR_TEXT }}>{profile?.name ?? "Your Name"}</p>
          <p className="text-sm" style={{ color: ACCENT }}>{profile?.headline ?? "Software Engineer"}</p>
          {profile?.location && <p className="text-xs" style={{ color: SIDEBAR_MUTED }}>{profile.location}</p>}
        </div>
      </div>

      <SidebarDivider sidebarBg={SIDEBAR_BG} />

      {profile && (
        <div className="px-6 py-4">
          <SidebarLabel text={t.sections.contact} colors={colors} />
          <ul className="space-y-2">
            {profile.email && <ContactRow icon="✉" text={profile.email} colors={colors} />}
            {profile.phone && <ContactRow icon="☏" text={profile.phone} colors={colors} />}
            {profile.social?.github && <ContactRow icon="⎇" text={profile.social.github} isLink colors={colors} />}
            {profile.social?.website && <ContactRow icon="↗" text={profile.social.website} isLink colors={colors} />}
            {profile.social?.linkedin && <ContactRow icon="in" text={profile.social.linkedin} isLink colors={colors} />}
          </ul>
        </div>
      )}

      <SidebarDivider sidebarBg={SIDEBAR_BG} />

      {techGroups.length > 0 && (
        <div className="px-6 py-4 flex flex-col gap-4">
          <SidebarLabel text={t.sections.skills} colors={colors} />
          {techGroups.map(({ categoryId, name: category, skills: catSkills }) => (
            <div key={categoryId} className="flex flex-col gap-2">
              <SidebarCategoryLabel text={category} colors={colors} />
              {catSkills.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-2">
                  <span className="text-xs truncate" style={{ color: SIDEBAR_TEXT }}>{s.name}</span>
                  <DotRating level={s.level ?? 3} accent={ACCENT} emptyColor={DOT_EMPTY} />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  );

  const sidebarRest = languageSkills.length > 0 ? (
    <div className="px-6 py-6 flex flex-col gap-3">
      <SidebarLabel text={t.sections.languages} colors={colors} />
      {languageSkills.map((s) => (
        <div key={s.id} className="flex items-center justify-between gap-2">
          <span className="text-xs" style={{ color: SIDEBAR_TEXT }}>{s.name}</span>
          {s.level != null ? <DotRating level={s.level} accent={ACCENT} emptyColor={DOT_EMPTY} /> : null}
        </div>
      ))}
    </div>
  ) : (
    <></>
  );

  const header = (
    <header className="pb-5 mb-6" style={{ borderBottom: `2px solid ${ACCENT}` }}>
      <p className="text-sm font-bold tracking-[2.5px] uppercase mb-2" style={{ color: ACCENT }}>
        {profile?.headline ?? "Software Engineer"}
      </p>
      <h1 className="text-3xl font-bold text-slate-900 leading-tight">{profile?.name ?? "Your Name"}</h1>
      {profile?.bio && <p className="mt-2 text-sm text-slate-500 leading-relaxed">{profile.bio}</p>}
    </header>
  );

  const mainOrder = sectionOrder.filter((k) => k !== "skills");
  const mainBlocks = chronological ? chronologicalBlocks() : mainOrder.flatMap(sectionBlocks);

  return (
    <div className="py-8 px-4 print:p-0">
      <Paginated
        header={header}
        blocks={mainBlocks}
        pageLabel={t.pageOf}
        pageClassName="shadow-md print:shadow-none border border-slate-200 print:border-none"
        footerClassName="absolute bottom-3 inset-x-0 text-center text-xs text-slate-400 pointer-events-none select-none"
        sidebarFirst={sidebarFirst}
        sidebarRest={sidebarRest}
        sidebarStyle={sidebarStyle}
        sidebarClassName="flex flex-col shrink-0"
        mainClassName="flex-1 bg-white flex flex-col px-8 pt-8 pb-6"
      />
    </div>
  );
}
