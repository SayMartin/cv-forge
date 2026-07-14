import type { CvContent } from "@/lib/cv-content-types";
import type { CvTheme } from "@/lib/cv-theme";
import { DEFAULT_SECTION_ORDER, type SectionKey } from "@/lib/cv-layouts";

const DEFAULT_ACCENT = "#3fb950";
const DEFAULT_SIDEBAR_BG = "#0f172a";
const PAGE_BG = "#0d1117";
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
    <p className="font-mono text-[11px] font-bold tracking-wide mb-3" style={{ color: colors.accent }}>
      {`// ${label}`}
    </p>
  );
}

function SidebarDivider() {
  return <div className="h-px" style={{ background: BORDER_COLOR }} />;
}

function ContactItem({ prefix, text, isLink }: { prefix: string; text: string; isLink?: boolean }) {
  const cls = "font-mono text-[10px] break-all leading-snug";
  return (
    <div className="flex items-start gap-2">
      <span className="font-mono text-[10px] shrink-0 w-4" style={{ color: TEXT_MUTED }}>{prefix}</span>
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
    <span className="font-mono text-[10px] px-2 py-0.5 rounded leading-none" style={{ color, backgroundColor: TAG_BG, border: `1px solid ${BORDER_COLOR}` }}>
      {name}
    </span>
  );
}

function ExpHeader({ role, company, dateStr }: { role: string; company: string; dateStr: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-mono text-[11px] font-bold leading-tight" style={{ color: TEXT_PRIMARY }}>{role}</p>
        <p className="font-mono text-[10px] leading-tight mt-0.5" style={{ color: TEXT_LINK }}>{company}</p>
      </div>
      {dateStr && <p className="font-mono text-[10px] shrink-0" style={{ color: TEXT_MUTED }}>{dateStr}</p>}
    </div>
  );
}

function EduHeader({ degreeField, institution, dateStr }: { degreeField: string; institution: string; dateStr: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-mono text-[11px] font-bold leading-tight" style={{ color: TEXT_PRIMARY }}>{degreeField}</p>
        <p className="font-mono text-[10px] leading-tight mt-0.5" style={{ color: TEXT_LINK }}>{institution}</p>
      </div>
      {dateStr && <p className="font-mono text-[10px] shrink-0" style={{ color: TEXT_MUTED }}>{dateStr}</p>}
    </div>
  );
}

function ProjectCard({ proj, accent }: { proj: CvContent["projects"][0]; accent: string }) {
  const lang = proj.skills?.[0];
  return (
    <div className="p-3 rounded-md" style={{ background: CARD_BG, border: `1px solid ${BORDER_COLOR}` }}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px]" style={{ color: TEXT_MUTED }}>⎇</span>
          <p className="font-mono text-[11px] font-bold" style={{ color: TEXT_LINK }}>{proj.title}</p>
        </div>
        {lang && (
          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full leading-none shrink-0" style={{ color: accent, background: `${accent}22`, border: `1px solid ${accent}66` }}>
            {lang}
          </span>
        )}
      </div>
      {proj.summary && <p className="font-mono text-[10px] leading-relaxed" style={{ color: TEXT_MUTED }}>{proj.summary}</p>}
      {(proj.url || proj.sourceUrl) && (
        <div className="flex gap-3 mt-2">
          {proj.url && <a href={proj.url} className="font-mono text-[10px]" style={{ color: TEXT_LINK }}>↗ live</a>}
          {proj.sourceUrl && <a href={proj.sourceUrl} className="font-mono text-[10px]" style={{ color: TEXT_LINK }}>⎇ source</a>}
        </div>
      )}
    </div>
  );
}

export function TerminalLayout({
  content,
  theme,
  sectionOrder = DEFAULT_SECTION_ORDER,
}: {
  content: CvContent;
  theme?: CvTheme;
  sectionOrder?: SectionKey[];
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

  const mainOrder = sectionOrder.filter((k) => k !== "skills");
  const page1Key = mainOrder[0];
  const page2Keys = mainOrder.slice(1);

  function renderMainSection(key: SectionKey): React.ReactNode {
    switch (key) {
      case "experience":
        return experiences.length > 0 ? (
          <section key="experience">
            <SectionLabel label="EXPERIENCE" colors={colors} />
            <ol className="flex flex-col gap-4">
              {experiences.map((job, i) => {
                const dateStr = [formatDate(job.startDate), job.current ? "Present" : formatDate(job.endDate)].filter(Boolean).join(" – ");
                return (
                  <li key={job.id} className="break-inside-avoid">
                    <ExpHeader role={job.role} company={job.company} dateStr={dateStr} />
                    {job.skills && job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {job.skills.map((s) => (
                          <span key={s} className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ color: ACCENT, background: CARD_BG, border: `1px solid ${BORDER_COLOR}` }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                    {job.description && (
                      <p className="font-mono text-[10px] mt-2 whitespace-pre-line leading-relaxed" style={{ color: TEXT_MUTED }}>{job.description}</p>
                    )}
                    {i < experiences.length - 1 && <div className="mt-4 h-px" style={{ background: BORDER_COLOR }} />}
                  </li>
                );
              })}
            </ol>
          </section>
        ) : null;

      case "education":
        return educations.length > 0 ? (
          <section key="education">
            <SectionLabel label="EDUCATION" colors={colors} />
            <ol className="flex flex-col gap-4">
              {educations.map((edu, i) => {
                const dateStr = [formatDate(edu.startDate), edu.current ? "Present" : formatDate(edu.endDate)].filter(Boolean).join(" – ");
                const degreeField = [edu.degree, edu.field ? `in ${edu.field}` : null].filter(Boolean).join(" ");
                return (
                  <li key={edu.id} className="break-inside-avoid">
                    <EduHeader degreeField={degreeField || edu.institution} institution={edu.institution} dateStr={dateStr} />
                    {edu.description && (
                      <p className="font-mono text-[10px] mt-2 whitespace-pre-line leading-relaxed" style={{ color: TEXT_MUTED }}>{edu.description}</p>
                    )}
                    {i < educations.length - 1 && <div className="mt-4 h-px" style={{ background: BORDER_COLOR }} />}
                  </li>
                );
              })}
            </ol>
          </section>
        ) : null;

      case "projects":
        return projects.length > 0 ? (
          <section key="projects">
            <SectionLabel label="PROJECTS" colors={colors} />
            <ol className="flex flex-col gap-3">
              {projects.map((proj) => (
                <li key={proj.id} className="break-inside-avoid">
                  <ProjectCard proj={proj} accent={ACCENT} />
                </li>
              ))}
            </ol>
          </section>
        ) : null;

      case "other":
        return others.length > 0 ? (
          <section key="other">
            <SectionLabel label="OTHER" colors={colors} />
            <ol className="flex flex-col gap-4">
              {others.map((o, i) => (
                <li key={o.id} className="break-inside-avoid">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-[11px] font-bold leading-tight" style={{ color: TEXT_PRIMARY }}>{o.title}</p>
                      {o.subtitle && <p className="font-mono text-[10px] leading-tight mt-0.5" style={{ color: TEXT_LINK }}>{o.subtitle}</p>}
                    </div>
                    {o.date && <p className="font-mono text-[10px] shrink-0" style={{ color: TEXT_MUTED }}>{formatDate(o.date)}</p>}
                  </div>
                  {o.description && (
                    <p className="font-mono text-[10px] mt-2 leading-relaxed" style={{ color: TEXT_MUTED }}>{o.description}</p>
                  )}
                  {i < others.length - 1 && <div className="mt-4 h-px" style={{ background: BORDER_COLOR }} />}
                </li>
              ))}
            </ol>
          </section>
        ) : null;

      default:
        return null;
    }
  }

  return (
    <div className="py-8 px-4 print:p-0">
      <div style={{ width: "210mm" }} className="mx-auto shadow-md print:shadow-none">
        {/* ══ ROW 1 — Page 1 ══════════════════════════════════════════ */}
        <div className="relative flex flex-col overflow-hidden" style={{ height: "297mm" }}>
          {/* Full-width header */}
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

          {/* Sidebar + Main — Page 1 */}
          <div className="flex flex-1 min-h-0">
            <aside style={sidebarStyle} className="flex flex-col shrink-0 overflow-hidden p-6 gap-5">
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
            </aside>

            <main style={{ background: PAGE_BG }} className="flex-1 flex flex-col overflow-hidden p-7 gap-6">
              {profile?.bio && (
                <div className="p-3 rounded-sm font-mono text-[10px] italic leading-relaxed" style={{ background: CARD_BG, borderLeft: `3px solid ${ACCENT}`, color: TEXT_MUTED }}>
                  {`/* ${profile.bio} */`}
                </div>
              )}
              {page1Key && renderMainSection(page1Key)}
            </main>
          </div>
          <div className="absolute bottom-3 inset-x-0 text-center font-mono text-[10px] pointer-events-none select-none" style={{ color: TEXT_MUTED }}>
            Page 1 of 2
          </div>
        </div>

        {/* ══ PAGE BREAK BAND ═════════════════════════════════════════ */}
        <div className="print:hidden h-7 bg-gray-200 flex items-center justify-center">
          <span className="text-[9px] font-medium tracking-widest uppercase text-gray-400">Page 2</span>
        </div>

        {/* ══ ROW 2 — Page 2 ══════════════════════════════════════════ */}
        <div className="relative flex print:break-before-page" style={{ minHeight: "297mm" }}>
          {/* Sidebar — Page 2: Languages */}
          <aside style={sidebarStyle} className="flex flex-col shrink-0 p-6 gap-5">
            {languageSkills.length > 0 && (
              <div className="flex flex-col gap-2">
                <SectionLabel label="LANGUAGES" colors={colors} />
                {languageSkills.map((s) => (
                  <div key={s.id} className="flex items-center justify-between">
                    <span className="font-mono text-[10px]" style={{ color: TEXT_PRIMARY }}>{s.name}</span>
                    {s.level != null && (
                      <span className="font-mono text-[10px]" style={{ color: TEXT_MUTED }}>
                        {["Beginner", "Elementary", "Intermediate", "Advanced", "Fluent"][Math.min(4, Math.max(0, Math.round(s.level) - 1))]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </aside>

          {/* Main — Page 2 */}
          <main style={{ background: PAGE_BG }} className="flex-1 p-7 flex flex-col gap-6">
            {page2Keys.map((key) => renderMainSection(key))}
          </main>
          <div className="absolute bottom-3 inset-x-0 text-center font-mono text-[10px] pointer-events-none select-none" style={{ color: TEXT_MUTED }}>
            Page 2 of 2
          </div>
        </div>
      </div>
    </div>
  );
}
