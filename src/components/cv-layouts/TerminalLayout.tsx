import type { CvContent, CvOther } from "@/lib/cv-content-types";
import type { CvTheme } from "@/lib/cv-theme";
import { DEFAULT_SECTION_ORDER, type SectionKey } from "@/lib/cv-layouts";
import { buildTimeline, TIMELINE_TYPE_LABEL } from "@/lib/cv-timeline";
import { Paginated } from "./pagination/Paginated";
import type { PageBlock } from "./pagination/types";

const DEFAULT_ACCENT = "#3fb950";
const DEFAULT_SIDEBAR_BG = "#0f172a";
const HEADER_BG = "#161b22";
const CARD_BG = "#161b22";
const BORDER_COLOR = "#30363d";
const TEXT_PRIMARY = "#f0f6fc";
const TEXT_MUTED = "#8b949e";
const TEXT_LINK = "#79c0ff";
const TAG_BG = "#21262d";
const TAG_INFRA = "#ffa657";

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "";
  if (/^\d{4}$/.test(dateStr)) return dateStr;
  const [year, month] = dateStr.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
  });
}

function skillTagColor(category?: string | null, accent: string = DEFAULT_ACCENT): string {
  const c = (category ?? "").toLowerCase();
  if (c.includes("frontend") || c.includes("css") || c.includes("html") || c.includes("ui")) return TEXT_LINK;
  if (c.includes("devops") || c.includes("cloud") || c.includes("infra") || c.includes("platform") || c.includes("ops")) return TAG_INFRA;
  return accent;
}

type TColors = { accent: string };

function SectionLabel({ label, colors }: { label: string; colors: TColors }) {
  return (
    <p className="font-mono text-xs font-bold tracking-wide mb-3" style={{ color: colors.accent }}>
      {`// ${label}`}
    </p>
  );
}

function SidebarDivider() {
  return <div className="h-px" style={{ background: BORDER_COLOR }} />;
}

function ContactItem({ prefix, text, isLink }: { prefix: string; text: string; isLink?: boolean }) {
  const cls = "min-w-0 flex-1 font-mono text-xs wrap-break-word leading-snug";
  return (
    <div className="flex items-start gap-2">
      <span className="font-mono text-xs shrink-0 w-4" style={{ color: TEXT_MUTED }}>{prefix}</span>
      {isLink ? (
        <a href={text} className={cls} style={{ color: TEXT_LINK }}>{text}</a>
      ) : (
        <span className={cls} style={{ color: TEXT_MUTED }}>{text}</span>
      )}
    </div>
  );
}

function SkillTag({ name, color }: { name: string; color: string }) {
  return (
    <span className="font-mono text-xs px-2 py-0.5 rounded leading-none" style={{ color, backgroundColor: TAG_BG, border: `1px solid ${BORDER_COLOR}` }}>
      {name}
    </span>
  );
}

function TypeBadge({ label }: { label: string }) {
  return (
    <p className="font-mono text-xs font-medium uppercase tracking-wide mb-0.5" style={{ color: TEXT_MUTED }}>
      {label}
    </p>
  );
}

function ExpHeader({ role, company, dateStr, badge }: { role: string; company: string; dateStr: string; badge?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        {badge && <TypeBadge label={TIMELINE_TYPE_LABEL.experience} />}
        <p className="font-mono text-sm font-bold leading-tight" style={{ color: TEXT_PRIMARY }}>{role}</p>
        <p className="font-mono text-sm leading-tight mt-0.5" style={{ color: TEXT_LINK }}>{company}</p>
      </div>
      {dateStr && <p className="font-mono text-xs shrink-0" style={{ color: TEXT_MUTED }}>{dateStr}</p>}
    </div>
  );
}

function EduHeader({ degreeField, institution, dateStr, badge }: { degreeField: string; institution: string; dateStr: string; badge?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        {badge && <TypeBadge label={TIMELINE_TYPE_LABEL.education} />}
        <p className="font-mono text-sm font-bold leading-tight" style={{ color: TEXT_PRIMARY }}>{degreeField}</p>
        <p className="font-mono text-sm leading-tight mt-0.5" style={{ color: TEXT_LINK }}>{institution}</p>
      </div>
      {dateStr && <p className="font-mono text-xs shrink-0" style={{ color: TEXT_MUTED }}>{dateStr}</p>}
    </div>
  );
}

function ProjectCard({ proj, accent, badge }: { proj: CvContent["projects"][0]; accent: string; badge?: boolean }) {
  const lang = proj.skills?.[0];
  const dateStr = [formatDate(proj.startDate), proj.current ? "Present" : formatDate(proj.endDate)].filter(Boolean).join(" – ") || (proj.publishedAt ? formatDate(proj.publishedAt) : "");
  return (
    <div className="p-3 rounded-md" style={{ background: CARD_BG, border: `1px solid ${BORDER_COLOR}` }}>
      {badge && <TypeBadge label={TIMELINE_TYPE_LABEL.projects} />}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs" style={{ color: TEXT_MUTED }}>⎇</span>
          <p className="font-mono text-sm font-bold" style={{ color: TEXT_LINK }}>{proj.title}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {dateStr && <p className="font-mono text-xs" style={{ color: TEXT_MUTED }}>{dateStr}</p>}
          {lang && (
            <span className="font-mono text-xs px-2 py-0.5 rounded-full leading-none" style={{ color: accent, background: `${accent}22`, border: `1px solid ${accent}66` }}>
              {lang}
            </span>
          )}
        </div>
      </div>
      {proj.summary && <p className="font-mono text-sm leading-relaxed" style={{ color: TEXT_MUTED }}>{proj.summary}</p>}
      {(proj.url || proj.sourceUrl) && (
        <div className="flex flex-col gap-0.5 mt-2 font-mono text-xs" style={{ color: TEXT_MUTED }}>
          {proj.url && (
            <span className="wrap-break-word">
              Live at: <a href={proj.url} style={{ color: TEXT_LINK }}>{proj.url}</a>
            </span>
          )}
          {proj.sourceUrl && (
            <span className="wrap-break-word">
              Source: <a href={proj.sourceUrl} style={{ color: TEXT_LINK }}>{proj.sourceUrl}</a>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function TerminalLayout({
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

  const ACCENT = theme?.accentColor ?? DEFAULT_ACCENT;
  const SIDEBAR_BG = theme?.sidebarColor ?? DEFAULT_SIDEBAR_BG;
  const colors: TColors = { accent: ACCENT };

  const techSkills = skills.filter((s) => s.category?.toLowerCase() !== "language");
  const languageSkills = skills.filter((s) => s.category?.toLowerCase() === "language");

  const initials = profile?.name
    ? profile.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const sidebarStyle = { background: SIDEBAR_BG, width: "35%", borderRight: `1px solid ${BORDER_COLOR}` } as const;

  // Each returned block is one atomic, unsplittable pagination unit — a
  // single entry, with the section title fused into the first one so a
  // title can never be orphaned alone at the bottom of a page.
  function sectionBlocks(key: SectionKey): PageBlock[] {
    switch (key) {
      case "experience":
        return experiences.map((job, i) => {
          const dateStr = [formatDate(job.startDate), job.current ? "Present" : formatDate(job.endDate)].filter(Boolean).join(" – ");
          return {
            id: `experience-${job.id}`,
            node: (
              <div className="mb-6">
                {i === 0 && <SectionLabel label="EXPERIENCE" colors={colors} />}
                <div className="break-inside-avoid">
                  <ExpHeader role={job.role} company={job.company} dateStr={dateStr} />
                  {job.skills && job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {job.skills.map((s) => (
                        <span key={s} className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ color: ACCENT, background: CARD_BG, border: `1px solid ${BORDER_COLOR}` }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {job.description && (
                    <p className="font-mono text-sm mt-2 whitespace-pre-line leading-relaxed" style={{ color: TEXT_MUTED }}>{job.description}</p>
                  )}
                  {job.url && (
                    <p className="font-mono text-xs mt-1 wrap-break-word" style={{ color: TEXT_MUTED }}>
                      Live at: <a href={job.url} style={{ color: TEXT_LINK }}>{job.url}</a>
                    </p>
                  )}
                  {i < experiences.length - 1 && <div className="mt-4 h-px" style={{ background: BORDER_COLOR }} />}
                </div>
              </div>
            ),
          };
        });

      case "education":
        return educations.map((edu, i) => {
          const dateStr = [formatDate(edu.startDate), edu.current ? "Present" : formatDate(edu.endDate)].filter(Boolean).join(" – ");
          const degreeField = [edu.degree, edu.field ? `in ${edu.field}` : null].filter(Boolean).join(" ");
          return {
            id: `education-${edu.id}`,
            node: (
              <div className="mb-6">
                {i === 0 && <SectionLabel label="EDUCATION" colors={colors} />}
                <div className="break-inside-avoid">
                  <EduHeader degreeField={degreeField || edu.institution} institution={edu.institution} dateStr={dateStr} />
                  {edu.description && (
                    <p className="font-mono text-sm mt-2 whitespace-pre-line leading-relaxed" style={{ color: TEXT_MUTED }}>{edu.description}</p>
                  )}
                  {i < educations.length - 1 && <div className="mt-4 h-px" style={{ background: BORDER_COLOR }} />}
                </div>
              </div>
            ),
          };
        });

      case "projects":
        return projects.map((proj, i) => ({
          id: `project-${proj.id}`,
          node: (
            <div className="mb-6">
              {i === 0 && <SectionLabel label="PROJECTS" colors={colors} />}
              <div className="break-inside-avoid">
                <ProjectCard proj={proj} accent={ACCENT} />
              </div>
            </div>
          ),
        }));

      case "other":
        return others.map((o, i) => ({
          id: `other-${o.id}`,
          node: (
            <div className="mb-6">
              {i === 0 && <SectionLabel label="OTHER" colors={colors} />}
              {otherEntry(o, { divider: i < others.length - 1 })}
            </div>
          ),
        }));

      default:
        return [];
    }
  }

  function otherEntry(o: CvOther, opts?: { badge?: boolean; divider?: boolean }) {
    return (
      <div className="break-inside-avoid">
        {opts?.badge && <TypeBadge label={TIMELINE_TYPE_LABEL.other} />}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-sm font-bold leading-tight" style={{ color: TEXT_PRIMARY }}>{o.title}</p>
            {o.subtitle && <p className="font-mono text-sm leading-tight mt-0.5" style={{ color: TEXT_LINK }}>{o.subtitle}</p>}
          </div>
          {o.date && <p className="font-mono text-xs shrink-0" style={{ color: TEXT_MUTED }}>{formatDate(o.date)}</p>}
        </div>
        {o.url && (
          <p className="font-mono text-xs mt-1 wrap-break-word" style={{ color: TEXT_MUTED }}>
            <a href={o.url} style={{ color: TEXT_LINK }}>{o.url}</a>
          </p>
        )}
        {o.description && (
          <p className="font-mono text-sm mt-2 leading-relaxed" style={{ color: TEXT_MUTED }}>{o.description}</p>
        )}
        {opts?.divider && <div className="mt-4 h-px" style={{ background: BORDER_COLOR }} />}
      </div>
    );
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
          case "experience": {
            const dateStr = [formatDate(entry.data.startDate), entry.data.current ? "Present" : formatDate(entry.data.endDate)].filter(Boolean).join(" – ");
            return (
              <div className="break-inside-avoid">
                <ExpHeader role={entry.data.role} company={entry.data.company} dateStr={dateStr} badge />
                {entry.data.skills && entry.data.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {entry.data.skills.map((s) => (
                      <span key={s} className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ color: ACCENT, background: CARD_BG, border: `1px solid ${BORDER_COLOR}` }}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                {entry.data.description && (
                  <p className="font-mono text-sm mt-2 whitespace-pre-line leading-relaxed" style={{ color: TEXT_MUTED }}>{entry.data.description}</p>
                )}
                {!isLast && <div className="mt-4 h-px" style={{ background: BORDER_COLOR }} />}
              </div>
            );
          }
          case "education": {
            const dateStr = [formatDate(entry.data.startDate), entry.data.current ? "Present" : formatDate(entry.data.endDate)].filter(Boolean).join(" – ");
            const degreeField = [entry.data.degree, entry.data.field ? `in ${entry.data.field}` : null].filter(Boolean).join(" ");
            return (
              <div className="break-inside-avoid">
                <EduHeader degreeField={degreeField || entry.data.institution} institution={entry.data.institution} dateStr={dateStr} badge />
                {entry.data.description && (
                  <p className="font-mono text-sm mt-2 whitespace-pre-line leading-relaxed" style={{ color: TEXT_MUTED }}>{entry.data.description}</p>
                )}
                {!isLast && <div className="mt-4 h-px" style={{ background: BORDER_COLOR }} />}
              </div>
            );
          }
          case "projects":
            return <ProjectCard proj={entry.data} accent={ACCENT} badge />;
          case "other":
            return otherEntry(entry.data, { badge: true, divider: !isLast });
        }
      })();
      return {
        id: `${entry.type}-${entry.id}`,
        node: (
          <div className="mb-6">
            {i === 0 && <SectionLabel label="TIMELINE" colors={colors} />}
            {entryNode}
          </div>
        ),
      };
    });
  }

  const topHeader = (
    <header className="flex items-center justify-between shrink-0 px-8 py-5" style={{ background: HEADER_BG, borderBottom: `1px solid ${BORDER_COLOR}` }}>
      <div className="flex flex-col gap-1.5">
        <h1 className="font-mono text-3xl font-bold tracking-tight" style={{ color: TEXT_PRIMARY }}>{profile?.name ?? "Your Name"}</h1>
        <p className="font-mono text-sm" style={{ color: ACCENT }}>{`> ${profile?.headline ?? "Software Engineer"}`}</p>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        {profile?.social?.github && <ContactItem prefix="⎇" text={profile.social.github} isLink />}
        {profile?.email && <ContactItem prefix="@" text={profile.email} />}
        {profile?.social?.linkedin && <ContactItem prefix="in" text={profile.social.linkedin} isLink />}
        {profile?.social?.website && <ContactItem prefix="↗" text={profile.social.website} isLink />}
        {profile?.location && <ContactItem prefix="⌖" text={profile.location} />}
      </div>
    </header>
  );

  const sidebarFirst = (
    <>
      <div className="flex justify-center">
        {content.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={content.avatarUrl} alt={profile?.name ?? ""} className="w-20 h-20 rounded-full object-cover" style={{ border: `2px solid ${ACCENT}` }} />
        ) : (
          <div className="w-20 h-20 rounded-full flex items-center justify-center font-mono text-xl font-bold" style={{ background: "#21262d", border: `2px solid ${ACCENT}`, color: ACCENT }}>
            {initials}
          </div>
        )}
      </div>
      {profile && (
        <div className="flex flex-col gap-2">
          <SectionLabel label="CONTACT" colors={colors} />
          {profile.email && <ContactItem prefix="@" text={profile.email} />}
          {profile.phone && <ContactItem prefix="☏" text={profile.phone} />}
          {profile.location && <ContactItem prefix="⌖" text={profile.location} />}
          {profile.social?.github && <ContactItem prefix="⎇" text={profile.social.github} isLink />}
          {profile.social?.website && <ContactItem prefix="↗" text={profile.social.website} isLink />}
          {profile.social?.linkedin && <ContactItem prefix="in" text={profile.social.linkedin} isLink />}
        </div>
      )}
      <SidebarDivider />
      {techSkills.length > 0 && (
        <div className="flex flex-col gap-2">
          <SectionLabel label="TECH STACK" colors={colors} />
          <div className="flex flex-wrap gap-1.5">
            {techSkills.map((s) => (
              <SkillTag key={s.id} name={s.name} color={skillTagColor(s.category, ACCENT)} />
            ))}
          </div>
        </div>
      )}
    </>
  );

  const sidebarRest = languageSkills.length > 0 ? (
    <div className="flex flex-col gap-2">
      <SectionLabel label="LANGUAGES" colors={colors} />
      {languageSkills.map((s) => (
        <div key={s.id} className="flex items-center justify-between">
          <span className="font-mono text-xs" style={{ color: TEXT_PRIMARY }}>{s.name}</span>
          {s.level != null && (
            <span className="font-mono text-xs" style={{ color: TEXT_MUTED }}>
              {["Beginner", "Elementary", "Intermediate", "Advanced", "Fluent"][Math.min(4, Math.max(0, Math.round(s.level) - 1))]}
            </span>
          )}
        </div>
      ))}
    </div>
  ) : (
    <></>
  );

  const header = profile?.bio ? (
    <div className="p-3 rounded-sm font-mono text-sm italic leading-relaxed mb-6" style={{ background: CARD_BG, borderLeft: `3px solid ${ACCENT}`, color: TEXT_MUTED }}>
      {`/* ${profile.bio} */`}
    </div>
  ) : null;

  const mainOrder = sectionOrder.filter((k) => k !== "skills");
  const mainBlocks = chronological ? chronologicalBlocks() : mainOrder.flatMap(sectionBlocks);

  return (
    <div className="py-8 px-4 print:p-0">
      <Paginated
        topHeader={topHeader}
        header={header}
        blocks={mainBlocks}
        pageClassName="shadow-md print:shadow-none"
        footerClassName="absolute bottom-3 inset-x-0 text-center font-mono text-xs pointer-events-none select-none"
        sidebarFirst={sidebarFirst}
        sidebarRest={sidebarRest}
        sidebarStyle={sidebarStyle}
        sidebarClassName="flex flex-col shrink-0 p-6 gap-5"
        mainClassName="flex-1 bg-[#0d1117] flex flex-col p-7"
      />
    </div>
  );
}
