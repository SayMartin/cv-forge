import type { CvContent, CvEducation, CvExperience, CvOther, CvProject } from "@/lib/cv-content-types";
import {
  darkenColor,
  getContrastColor,
  sidebarGradient,
} from "@/lib/color-utils";
import type { CvTheme } from "@/lib/cv-theme";
import { DEFAULT_SECTION_ORDER, type SectionKey } from "@/lib/cv-layouts";
import { buildTimeline, TIMELINE_TYPE_LABEL } from "@/lib/cv-timeline";
import { Paginated } from "./pagination/Paginated";
import type { PageBlock } from "./pagination/types";

const DEFAULT_GOLD = "#c9a84c";
const DEFAULT_SIDEBAR_BG = "#2d2d2d";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "";
  if (/^\d{4}$/.test(dateStr)) return dateStr;
  const [year, month] = dateStr.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
  });
}

// ── Sub-components ───────────────────────────────────────────────────────────
type ModernColors = { sidebarDark: string; sidebarText: string; gold: string };

function SidebarSection({
  title,
  children,
  colors,
}: {
  title: string;
  children: React.ReactNode;
  colors: ModernColors;
}) {
  return (
    <div>
      <div
        className="flex items-center justify-between rounded-full px-4 py-1.5 mb-3"
        style={{ backgroundColor: colors.sidebarDark }}
      >
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: colors.sidebarText }}
        >
          {title}
        </span>
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: colors.gold }}
        />
      </div>
      {children}
    </div>
  );
}

function ContactRow({
  icon,
  text,
  isLink = false,
  colors,
}: {
  icon: string;
  text: string;
  isLink?: boolean;
  colors: ModernColors;
}) {
  return (
    <li className="flex items-start gap-2">
      <span className="shrink-0 w-4 text-center" style={{ color: colors.gold }}>
        {icon}
      </span>
      {isLink ? (
        <a
          href={text}
          className="min-w-0 flex-1 wrap-break-word transition-colors"
          style={{ color: colors.sidebarText }}
        >
          {text}
        </a>
      ) : (
        <span className="min-w-0 flex-1 wrap-break-word" style={{ color: colors.sidebarText }}>
          {text}
        </span>
      )}
    </li>
  );
}

function DotRating({ level, colors }: { level: number; colors: ModernColors }) {
  const clamped = Math.max(0, Math.min(5, Math.round(level)));
  return (
    <div className="flex gap-0.5 shrink-0">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor:
              i < clamped ? colors.gold : "rgba(128,128,128,0.5)",
          }}
        />
      ))}
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

function RightSection({
  icon,
  title,
  children,
  className,
  colors,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
  className?: string;
  colors: ModernColors;
}) {
  return (
    <section className={className}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base leading-none">{icon}</span>
        <h2 className="text-sm font-bold text-zinc-800 tracking-wide">
          {title}
        </h2>
      </div>
      <div
        className="mb-3"
        style={{ borderBottom: `2px solid ${colors.gold}` }}
      />
      {children}
    </section>
  );
}

// ── Main layout ──────────────────────────────────────────────────────────────

export function ModernLayout({
  content,
  theme,
  sectionOrder = DEFAULT_SECTION_ORDER,
  chronological = false,
}: {
  content: CvContent;
  theme?: CvTheme;
  sectionOrder?: SectionKey[];
  chronological?: boolean;
}) {
  const { profile, experiences, educations, skills, projects, others } = content;

  const SIDEBAR_BG = theme?.sidebarColor ?? DEFAULT_SIDEBAR_BG;
  const GOLD = theme?.accentColor ?? DEFAULT_GOLD;
  const SIDEBAR_DARK = darkenColor(SIDEBAR_BG, 0.06);
  const SIDEBAR_TEXT = getContrastColor(SIDEBAR_BG);
  const SIDEBAR_GRADIENT = `linear-gradient(to right, ${sidebarGradient(SIDEBAR_BG)})`;

  const languageSkills = skills.filter(
    (s) => s.category?.toLowerCase() === "language",
  );
  const otherSkills = skills.filter(
    (s) => s.category?.toLowerCase() !== "language",
  );

  const nameParts = profile?.name?.split(" ") ?? [];
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ");

  const colors: ModernColors = {
    sidebarDark: SIDEBAR_DARK,
    sidebarText: SIDEBAR_TEXT,
    gold: GOLD,
  };

  function experienceEntry(job: CvExperience, badge?: boolean) {
    const dateStr = [
      formatDate(job.startDate),
      job.current ? "Present" : formatDate(job.endDate),
    ]
      .filter(Boolean)
      .join(" – ");
    return (
      <div className="break-inside-avoid">
        {badge && <TypeBadge label={TIMELINE_TYPE_LABEL.experience} />}
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-semibold text-zinc-800">
            {job.company}
            {dateStr && (
              <span className="text-xs font-normal text-zinc-400 ml-2">
                {dateStr}
              </span>
            )}
          </p>
        </div>
        <p className="text-sm font-medium mt-0.5" style={{ color: GOLD }}>
          {job.role}
        </p>
        {job.description && (
          <p className="mt-1 text-sm text-zinc-600 whitespace-pre-line">
            {job.description}
          </p>
        )}
        {job.skills && job.skills.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {job.skills.map((s) => (
              <span
                key={s}
                className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-zinc-500"
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  function educationEntry(edu: CvEducation, badge?: boolean) {
    const dateStr = [
      formatDate(edu.startDate),
      edu.current ? "Present" : formatDate(edu.endDate),
    ]
      .filter(Boolean)
      .join(" – ");
    return (
      <div>
        {badge && <TypeBadge label={TIMELINE_TYPE_LABEL.education} />}
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-semibold text-zinc-800">
            {edu.institution}
            {dateStr && (
              <span className="text-xs font-normal text-zinc-400 ml-2">
                {dateStr}
              </span>
            )}
          </p>
        </div>
        {(edu.degree || edu.field) && (
          <p className="text-sm font-medium mt-0.5" style={{ color: GOLD }}>
            {edu.degree}
            {edu.field ? ` in ${edu.field}` : ""}
          </p>
        )}
        {edu.description && (
          <p className="text-sm text-zinc-500 mt-0.5">{edu.description}</p>
        )}
      </div>
    );
  }

  function projectEntry(proj: CvProject, badge?: boolean) {
    const dateStr = [formatDate(proj.startDate), proj.current ? "Present" : formatDate(proj.endDate)].filter(Boolean).join(" – ") || (proj.publishedAt ? formatDate(proj.publishedAt) : "");
    return (
      <div>
        {badge && <TypeBadge label={TIMELINE_TYPE_LABEL.projects} />}
        <p className="text-sm font-semibold text-zinc-800">
          {proj.title}
          {dateStr && <span className="text-xs font-normal text-zinc-400 ml-2">{dateStr}</span>}
        </p>
        {(proj.url || proj.sourceUrl) && (
          <div className="flex flex-col gap-0.5 text-xs text-zinc-400 mt-0.5">
            {proj.url && <span className="wrap-break-word">Live at: <a href={proj.url}>{proj.url}</a></span>}
            {proj.sourceUrl && <span className="wrap-break-word">Source: <a href={proj.sourceUrl}>{proj.sourceUrl}</a></span>}
          </div>
        )}
        {proj.summary && (
          <p className="text-sm text-zinc-500 mt-0.5">{proj.summary}</p>
        )}
        {proj.skills && proj.skills.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {proj.skills.map((s) => (
              <span
                key={s}
                className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-zinc-500"
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  function otherEntry(o: CvOther, badge?: boolean) {
    return (
      <div>
        {badge && <TypeBadge label={TIMELINE_TYPE_LABEL.other} />}
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-semibold text-zinc-800">
            {o.title}
            {o.subtitle && (
              <span className="font-normal text-zinc-400 ml-1">· {o.subtitle}</span>
            )}
          </p>
          {o.date && (
            <span className="text-xs text-zinc-400 shrink-0 ml-2">
              {formatDate(o.date)}
            </span>
          )}
        </div>
        {o.description && (
          <p className="text-sm text-zinc-500 mt-0.5">{o.description}</p>
        )}
      </div>
    );
  }

  // Skills live in the sidebar — exclude from main-column ordering.
  // Each returned block is one atomic, unsplittable pagination unit — a
  // single entry, with the section title (icon + divider) fused into the
  // first one so a title can never be orphaned alone at the bottom of a page.
  function sectionBlocks(key: SectionKey): PageBlock[] {
    switch (key) {
      case "experience":
        return experiences.map((job, i) => ({
          id: `experience-${job.id}`,
          node:
            i === 0 ? (
              <RightSection icon="💼" title="Work Experience" colors={colors} className="mb-6">
                {experienceEntry(job)}
              </RightSection>
            ) : (
              <div className="mb-6">{experienceEntry(job)}</div>
            ),
        }));

      case "education":
        return educations.map((edu, i) => ({
          id: `education-${edu.id}`,
          node:
            i === 0 ? (
              <RightSection icon="🎓" title="Education" colors={colors} className="mb-6">
                {educationEntry(edu)}
              </RightSection>
            ) : (
              <div className="mb-6">{educationEntry(edu)}</div>
            ),
        }));

      case "projects":
        return projects.map((proj, i) => ({
          id: `project-${proj.id}`,
          node:
            i === 0 ? (
              <RightSection icon="🚀" title="Projects" colors={colors} className="mb-6">
                {projectEntry(proj)}
              </RightSection>
            ) : (
              <div className="mb-6">{projectEntry(proj)}</div>
            ),
        }));

      case "other":
        return others.map((o, i) => ({
          id: `other-${o.id}`,
          node:
            i === 0 ? (
              <RightSection icon="📌" title="Other" colors={colors} className="mb-6">
                {otherEntry(o)}
              </RightSection>
            ) : (
              <div className="mb-6">{otherEntry(o)}</div>
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
        node:
          i === 0 ? (
            <RightSection icon="🕒" title="Timeline" colors={colors} className="mb-6">
              {entryNode}
            </RightSection>
          ) : (
            <div className="mb-6">{entryNode}</div>
          ),
      };
    });
  }

  const sidebarFirst = (
    <>
      <div className="flex justify-center pt-8 pb-4">
        {content.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={content.avatarUrl}
            alt={profile?.name ?? ""}
            className="w-24 h-24 rounded-full object-cover"
            style={{ border: `4px solid ${GOLD}`, outline: `3px solid ${SIDEBAR_BG}` }}
          />
        ) : (
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{ border: `4px solid ${GOLD}`, backgroundColor: SIDEBAR_DARK, color: GOLD }}
          >
            {firstName.charAt(0)}
          </div>
        )}
      </div>

      <div className="px-5 space-y-5 pb-8">
        {profile && (
          <SidebarSection title="Contact" colors={colors}>
            <ul className="space-y-2 text-xs text-gray-300">
              {profile.phone && <ContactRow icon="📞" text={profile.phone} colors={colors} />}
              {profile.email && <ContactRow icon="✉" text={profile.email} colors={colors} />}
              {profile.location && <ContactRow icon="📍" text={profile.location} colors={colors} />}
              {profile.social?.website && <ContactRow icon="🌐" text={profile.social.website} colors={colors} />}
              {profile.social?.linkedin && <ContactRow icon="in" text={profile.social.linkedin} isLink colors={colors} />}
              {profile.social?.github && <ContactRow icon="gh" text={profile.social.github} isLink colors={colors} />}
            </ul>
          </SidebarSection>
        )}
      </div>
    </>
  );

  const sidebarRest = (
    <div className="px-5 space-y-5 py-8">
      {languageSkills.length > 0 && (
        <SidebarSection title="Language" colors={colors}>
          <ul className="space-y-2">
            {languageSkills.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2">
                <span className="text-xs tracking-wide truncate" style={{ color: colors.sidebarText }}>
                  {s.name}
                </span>
                <DotRating level={s.level ?? 3} colors={colors} />
              </li>
            ))}
          </ul>
        </SidebarSection>
      )}
      {otherSkills.length > 0 && (
        <SidebarSection title="Skills" colors={colors}>
          <ul className="space-y-2">
            {otherSkills.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2">
                <span className="text-xs tracking-wide truncate" style={{ color: colors.sidebarText }}>
                  {s.name}
                </span>
                <DotRating level={s.level ?? 3} colors={colors} />
              </li>
            ))}
          </ul>
        </SidebarSection>
      )}
    </div>
  );

  const header = (
    <>
      <header className="pb-4" style={{ borderBottom: `3px solid ${GOLD}` }}>
        <h1 className="text-3xl font-bold tracking-tight leading-none">
          <span className="text-zinc-800">{firstName} </span>
          <span className="text-zinc-800">{lastName}</span>
        </h1>
        {profile?.headline && (
          <p className="mt-1 text-sm tracking-widest uppercase text-zinc-400">
            {profile.headline}
          </p>
        )}
      </header>
      {profile?.bio && (
        <RightSection icon="👤" title="Profile" colors={colors} className="mt-5 mb-6">
          <p className="text-sm text-zinc-600 leading-relaxed">{profile.bio}</p>
        </RightSection>
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
        pageClassName="shadow-md print:shadow-none border border-gray-300 print:border-none text-sm"
        sidebarFirst={sidebarFirst}
        sidebarRest={sidebarRest}
        sidebarStyle={{ background: SIDEBAR_GRADIENT, width: "30%", color: SIDEBAR_TEXT }}
        sidebarClassName="flex flex-col shrink-0 relative"
        mainClassName="flex-1 bg-white flex flex-col px-8 pt-8 pb-5"
      />
    </div>
  );
}
