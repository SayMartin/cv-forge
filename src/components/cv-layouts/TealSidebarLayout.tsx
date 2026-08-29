import type { CvContent, CvEducation, CvExperience, CvOther, CvProject } from "@/lib/cv-content-types";
import {
  darkenColor,
  lightenColor,
  getContrastColor,
  hexToRgba,
  sidebarGradient,
} from "@/lib/color-utils";
import type { CvTheme } from "@/lib/cv-theme";
import { DEFAULT_SECTION_ORDER, type SectionKey } from "@/lib/cv-layouts";
import { buildTimeline } from "@/lib/cv-timeline";
import { cvStrings } from "@/lib/cv-strings";
import { format } from "@/i18n/format";
import { Paginated } from "./pagination/Paginated";
import type { PageBlock } from "./pagination/types";

const DEFAULT_TEAL = "#2d7d8a";

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

type TealColors = { teal: string; tealDark: string; sidebarText: string };

function RatingBoxes({ level, max = 5 }: { level: number; max?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => (
        <div key={i} className="w-2.5 h-1.5 rounded-sm" style={{ background: i < level ? "white" : "rgba(255,255,255,0.25)" }} />
      ))}
    </div>
  );
}

function SectionHeader({ title, icon, colors }: { title: string; icon: string; colors: TealColors }) {
  return (
    <div
      className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest py-1 px-3 mb-3"
      style={{ background: colors.teal, borderRadius: "0 20px 20px 0", width: "95%", color: colors.sidebarText }}
    >
      <span>{icon}</span>
      <span>{title}</span>
    </div>
  );
}

function TypeBadge({ label }: { label: string }) {
  return (
    <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 mb-0.5">
      {label}
    </p>
  );
}

function SidebarHeader({ title, colors }: { title: string; colors: TealColors }) {
  return (
    <div
      className="text-center text-xs font-bold uppercase tracking-widest py-1.5 mb-3"
      style={{ background: colors.tealDark, color: getContrastColor(colors.tealDark) }}
    >
      {title}
    </div>
  );
}

export function TealSidebarLayout({
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

  const TEAL = theme?.sidebarColor ?? DEFAULT_TEAL;
  const TEAL_DARK = darkenColor(TEAL, 0.09);
  const TEAL_LIGHT = lightenColor(TEAL, 0.09);
  const SIDEBAR_TEXT = getContrastColor(TEAL);
  const SIDEBAR_GRADIENT = `linear-gradient(to right, ${sidebarGradient(TEAL)})`;

  const languageSkills = skillGroups.find((g) => g.kind === "language")?.skills ?? [];
  const otherSkills = skillGroups.filter((g) => g.kind !== "language").flatMap((g) => g.skills);

  const tealColors: TealColors = { teal: TEAL, tealDark: TEAL_DARK, sidebarText: SIDEBAR_TEXT };

  function experienceEntry(job: CvExperience, badge?: boolean) {
    const dateStr = [formatDate(job.startDate, t.dateLocale), job.current ? t.present : formatDate(job.endDate, t.dateLocale)].filter(Boolean).join(" – ");
    return (
      <div className="break-inside-avoid">
        {badge && <TypeBadge label={t.timelineType.experience} />}
        {dateStr && <p className="text-xs font-semibold" style={{ color: TEAL }}>{dateStr}</p>}
        <p className="font-bold text-zinc-800">{job.role} — {job.company}</p>
        {job.description && (
          <p className="text-zinc-500 mt-0.5 text-sm leading-relaxed whitespace-pre-line">{job.description}</p>
        )}
        {job.url && (
          <p className="text-xs text-zinc-500 wrap-break-word mt-1">
            {t.liveAt} <a href={job.url} style={{ color: TEAL }}>{job.url}</a>
          </p>
        )}
        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {job.skills.map((s) => (
              <span key={s} className="text-xs px-1.5 py-0.5 rounded" style={{ background: hexToRgba(TEAL, 0.1), color: TEAL }}>
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  function educationEntry(edu: CvEducation, badge?: boolean) {
    const dateStr = [formatDate(edu.startDate, t.dateLocale), edu.current ? t.present : formatDate(edu.endDate, t.dateLocale)].filter(Boolean).join(" – ");
    return (
      <div>
        {badge && <TypeBadge label={t.timelineType.education} />}
        {dateStr && <p className="text-xs font-semibold" style={{ color: TEAL }}>{dateStr}</p>}
        <p className="font-bold text-zinc-800">
          {edu.field ? format(t.degreeIn, { degree: edu.degree ?? "", field: edu.field }) : edu.degree} — {edu.institution}
        </p>
        {edu.description && (
          <p className="text-zinc-500 mt-0.5 text-sm leading-relaxed">{edu.description}</p>
        )}
      </div>
    );
  }

  function projectEntry(proj: CvProject, badge?: boolean) {
    const dateStr = [formatDate(proj.startDate, t.dateLocale), proj.current ? t.present : formatDate(proj.endDate, t.dateLocale)].filter(Boolean).join(" – ") || (proj.publishedAt ? formatDate(proj.publishedAt, t.dateLocale) : "");
    return (
      <div>
        {badge && <TypeBadge label={t.timelineType.projects} />}
        {dateStr && <p className="text-xs font-semibold" style={{ color: TEAL }}>{dateStr}</p>}
        <p className="font-bold text-zinc-800">{proj.title}</p>
        {proj.summary && <p className="text-zinc-500 mt-0.5 text-sm leading-relaxed">{proj.summary}</p>}
        <div className="flex flex-col gap-0.5 text-xs mt-1">
          {proj.url && (
            <span className="text-zinc-400 wrap-break-word">
              {t.liveAt} <a href={proj.url} style={{ color: TEAL }}>{proj.url}</a>
            </span>
          )}
          {proj.sourceUrl && (
            <span className="text-zinc-400 wrap-break-word">
              {t.source} <a href={proj.sourceUrl} style={{ color: TEAL }}>{proj.sourceUrl}</a>
            </span>
          )}
        </div>
      </div>
    );
  }

  function otherEntry(o: CvOther, badge?: boolean) {
    return (
      <div>
        {badge && <TypeBadge label={t.timelineType.other} />}
        {o.date && <p className="text-xs font-semibold" style={{ color: TEAL }}>{formatDate(o.date, t.dateLocale)}</p>}
        <p className="font-bold text-zinc-800">
          {o.title}{o.subtitle && ` — ${o.subtitle}`}
        </p>
        {o.url && (
          <p className="text-xs text-zinc-400 wrap-break-word mt-0.5">
            <a href={o.url} style={{ color: TEAL }}>{o.url}</a>
          </p>
        )}
        {o.description && (
          <p className="text-zinc-500 mt-0.5 text-sm leading-relaxed">{o.description}</p>
        )}
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
              {i === 0 && <SectionHeader title={t.sections.experience} icon="💼" colors={tealColors} />}
              {experienceEntry(job)}
            </div>
          ),
        }));

      case "education":
        return educations.map((edu, i) => ({
          id: `education-${edu.id}`,
          node: (
            <div className="mb-6">
              {i === 0 && <SectionHeader title={t.sections.education} icon="🎓" colors={tealColors} />}
              {educationEntry(edu)}
            </div>
          ),
        }));

      case "projects":
        return projects.map((proj, i) => ({
          id: `project-${proj.id}`,
          node: (
            <div className="mb-6">
              {i === 0 && <SectionHeader title={t.sections.projects} icon="🚀" colors={tealColors} />}
              {projectEntry(proj)}
            </div>
          ),
        }));

      case "other":
        return others.map((o, i) => ({
          id: `other-${o.id}`,
          node: (
            <div className="mb-6">
              {i === 0 && <SectionHeader title={t.sections.other} icon="📌" colors={tealColors} />}
              {otherEntry(o)}
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
      const entryNode = (() => {
        switch (entry.type) {
          case "experience": return experienceEntry(entry.data, true);
          case "education": return educationEntry(entry.data, true);
          case "projects": return projectEntry(entry.data, true);
          case "other": return otherEntry(entry.data, true);
        }
      })();
      return {
        id: `${entry.type}-${entry.id}`,
        node: (
          <div className="mb-6">
            {i === 0 && <SectionHeader title={t.sections.timeline} icon="🕒" colors={tealColors} />}
            {entryNode}
          </div>
        ),
      };
    });
  }

  const sidebarFirst = (
    <>
      <div className="flex justify-center pt-8 pb-4">
        {content.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={content.avatarUrl} alt={profile?.name ?? ""} className="w-30 h-30 rounded-full object-cover border-4 border-white" />
        ) : (
          <div className="w-30 h-30 rounded-full border-4 border-white flex items-center justify-center text-2xl font-bold" style={{ background: TEAL_DARK }}>
            {profile?.name?.[0] ?? "?"}
          </div>
        )}
      </div>
      <div className="mb-4">
        <SidebarHeader title={t.sections.contact} colors={tealColors} />
        <ul className="px-4 space-y-2 text-xs">
          {profile?.name && <li className="flex items-center gap-2"><span>👤</span><span>{profile.name}</span></li>}
          {profile?.phone && <li className="flex items-center gap-2"><span>📞</span><span>{profile.phone}</span></li>}
          {profile?.email && <li className="flex items-center gap-2"><span>✉️</span><span className="break-all">{profile.email}</span></li>}
          {profile?.location && <li className="flex items-center gap-2"><span>📍</span><span>{profile.location}</span></li>}
          {profile?.social?.linkedin && (
            <li className="flex items-center gap-2">
              <span>🔗</span>
              <span className="min-w-0 flex-1 wrap-break-word">{profile.social.linkedin.replace(/^https?:\/\/(www\.)?/, "")}</span>
            </li>
          )}
        </ul>
      </div>
    </>
  );

  const sidebarRest = (
    <div className="pt-8">
      {languageSkills.length > 0 && (
        <div className="mb-4">
          <SidebarHeader title={t.sections.language} colors={tealColors} />
          <ul className="px-4 space-y-1.5">
            {languageSkills.map((s) => (
              <li key={s.id} className="flex items-center justify-between">
                <span className="text-xs tracking-wider" style={{ color: SIDEBAR_TEXT }}>{s.name}</span>
                {s.level != null && <RatingBoxes level={s.level} />}
              </li>
            ))}
          </ul>
        </div>
      )}
      {otherSkills.length > 0 && (
        <div className="mb-4">
          <SidebarHeader title={t.sections.skills} colors={tealColors} />
          <ul className="px-4 space-y-1.5">
            {otherSkills.map((s) => (
              <li key={s.id} className="flex items-center justify-between">
                <span className="text-xs tracking-wider" style={{ color: SIDEBAR_TEXT }}>{s.name}</span>
                {s.level != null && <RatingBoxes level={s.level} />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const header = (
    <>
      <svg viewBox="0 0 200 200" className="absolute top-0 right-0 pointer-events-none" style={{ width: 180, height: 180, opacity: 0.15 }}>
        <circle cx="180" cy="20" r="120" fill={TEAL} />
      </svg>
      <svg viewBox="0 0 200 200" className="absolute top-0 right-0 pointer-events-none" style={{ width: 140, height: 140, opacity: 0.12 }}>
        <circle cx="200" cy="-10" r="100" fill={TEAL} />
      </svg>
      <div className="relative z-10 pb-4">
        <h1 className="text-3xl font-extrabold uppercase tracking-wide leading-tight" style={{ color: TEAL_DARK }}>
          {profile?.name ?? "Your Name"}
        </h1>
        {profile?.headline && (
          <p className="text-sm font-medium tracking-widest mt-1" style={{ color: TEAL_LIGHT }}>
            {profile.headline.toUpperCase()}
          </p>
        )}
      </div>
      {profile?.bio && (
        <section className="relative z-10 mb-6">
          <SectionHeader title={t.sections.profile} icon="👤" colors={tealColors} />
          <p className="text-zinc-600 leading-relaxed text-sm">{profile.bio}</p>
        </section>
      )}
    </>
  );

  const mainOrder = sectionOrder.filter((k) => k !== "skills");
  const mainBlocks = chronological ? chronologicalBlocks() : mainOrder.flatMap(sectionBlocks);

  return (
    <div className="py-8 px-4 print:p-0">
      <Paginated
        header={header}
        blocks={mainBlocks}
        pageLabel={t.pageOf}
        pageClassName="shadow-md print:shadow-none border border-gray-300 print:border-none text-sm"
        sidebarFirst={sidebarFirst}
        sidebarRest={sidebarRest}
        sidebarStyle={{ background: SIDEBAR_GRADIENT, width: "32%", minWidth: "32%", color: SIDEBAR_TEXT }}
        sidebarClassName="flex flex-col shrink-0 text-sm relative"
        mainClassName="flex-1 bg-white relative overflow-hidden flex flex-col text-sm text-zinc-800 px-8 pt-10 pb-8"
      />
    </div>
  );
}
