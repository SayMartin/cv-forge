import type { CvContent, CvSkill } from "@/lib/cv-content-types";
import { getContrastColor } from "@/lib/color-utils";
import type { CvTheme } from "@/lib/cv-theme";
import { DEFAULT_SECTION_ORDER, type SectionKey } from "@/lib/cv-layouts";

const DEFAULT_ACCENT = "#6366f1";
const DEFAULT_SIDEBAR_BG = "#1e293b";
const PAGE_BG = "#ffffff";

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "";
  if (/^\d{4}$/.test(dateStr)) return dateStr;
  const [year, month] = dateStr.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
  });
}

function groupSkillsByCategory(skills: CvSkill[]): [string, CvSkill[]][] {
  const map = new Map<string, CvSkill[]>();
  for (const skill of skills) {
    const cat = skill.category ?? "Other";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(skill);
  }
  return Array.from(map.entries());
}

type SColors = { accent: string; sidebarText: string; sidebarMuted: string };

function SidebarLabel({ text, colors }: { text: string; colors: SColors }) {
  return (
    <p className="text-[9px] font-bold tracking-[1.5px] uppercase mb-2" style={{ color: colors.accent }}>
      {text}
    </p>
  );
}

function SidebarCategoryLabel({ text, colors }: { text: string; colors: SColors }) {
  return (
    <p className="text-[9px] font-bold uppercase tracking-wide mb-1" style={{ color: colors.sidebarMuted }}>
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
      <span className="shrink-0 text-[11px] w-4 text-center" style={{ color: accentIcon }}>
        {icon}
      </span>
      {isLink ? (
        <a href={text} className="min-w-0 flex-1 text-[10px] wrap-break-word" style={textStyle}>{text}</a>
      ) : (
        <span className="min-w-0 flex-1 text-[10px] wrap-break-word" style={textStyle}>{text}</span>
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
      <p className="text-[9px] font-bold tracking-[2px] text-slate-900 uppercase">{title}</p>
      <div className="w-7 h-0.5 rounded-full" style={{ backgroundColor: accent }} />
    </div>
  );
}

function TechPill({ label }: { label: string }) {
  return (
    <span className="text-[10px] text-slate-500 bg-slate-100 rounded-full px-2 py-0.5 leading-none">
      {label}
    </span>
  );
}

function ProjectCard({ proj, accent }: { proj: CvContent["projects"][0]; accent: string }) {
  const lang = proj.skills?.[0];
  return (
    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <p className="text-xs font-bold" style={{ color: accent }}>{proj.title}</p>
        {lang && (
          <span className="text-[10px] rounded-full px-2 py-0.5 leading-none shrink-0" style={{ color: accent, background: `${accent}18` }}>
            {lang}
          </span>
        )}
      </div>
      {proj.summary && <p className="text-[10px] text-slate-500 leading-relaxed">{proj.summary}</p>}
      {(proj.url || proj.sourceUrl) && (
        <div className="flex gap-3 mt-2">
          {proj.url && <a href={proj.url} className="text-[10px]" style={{ color: accent }}>↗ live</a>}
          {proj.sourceUrl && <a href={proj.sourceUrl} className="text-[10px]" style={{ color: accent }}>⎇ source</a>}
        </div>
      )}
    </div>
  );
}

export function SlateLayout({
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
  const SIDEBAR_TEXT = getContrastColor(SIDEBAR_BG);
  const SIDEBAR_MUTED = SIDEBAR_TEXT === "#ffffff" ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)";
  const DOT_EMPTY = SIDEBAR_TEXT === "#ffffff" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)";

  const colors: SColors = { accent: ACCENT, sidebarText: SIDEBAR_TEXT, sidebarMuted: SIDEBAR_MUTED };

  const languageSkills = skills.filter((s) => s.category?.toLowerCase() === "language");
  const techSkills = skills.filter((s) => s.category?.toLowerCase() !== "language");
  const skillGroups = groupSkillsByCategory(techSkills);

  const initials = profile?.name
    ? profile.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const sidebarStyle = { background: SIDEBAR_BG, width: "35%", color: SIDEBAR_TEXT } as const;

  const mainOrder = sectionOrder.filter((k) => k !== "skills");
  const page1Key = mainOrder[0];
  const page2Keys = mainOrder.slice(1);

  function renderMainSection(key: SectionKey): React.ReactNode {
    switch (key) {
      case "experience":
        return experiences.length > 0 ? (
          <section key="experience">
            <SectionHeader title="Experience" accent={ACCENT} />
            <ol className="flex flex-col gap-5">
              {experiences.map((job, i) => {
                const dateStr = [formatDate(job.startDate), job.current ? "Present" : formatDate(job.endDate)].filter(Boolean).join(" – ");
                return (
                  <li key={job.id} className="break-inside-avoid">
                    <div className="flex items-baseline justify-between gap-4 mb-1.5">
                      <p className="text-[11px] font-bold text-slate-900">
                        {job.company}
                        <span className="text-slate-400 font-normal mx-1.5">·</span>
                        {job.role}
                      </p>
                      {dateStr && <p className="text-[10px] text-slate-400 shrink-0">{dateStr}</p>}
                    </div>
                    {job.skills && job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {job.skills.map((s) => <TechPill key={s} label={s} />)}
                      </div>
                    )}
                    {job.description && (
                      <p className="text-[10px] text-slate-500 whitespace-pre-line leading-relaxed">{job.description}</p>
                    )}
                    {i < experiences.length - 1 && <div className="mt-4 border-b border-slate-100" />}
                  </li>
                );
              })}
            </ol>
          </section>
        ) : null;

      case "education":
        return educations.length > 0 ? (
          <section key="education">
            <SectionHeader title="Education" accent={ACCENT} />
            <ol className="flex flex-col gap-5">
              {educations.map((edu, i) => {
                const dateStr = [formatDate(edu.startDate), edu.current ? "Present" : formatDate(edu.endDate)].filter(Boolean).join(" – ");
                const degreeField = [edu.degree, edu.field ? `in ${edu.field}` : null].filter(Boolean).join(" ");
                return (
                  <li key={edu.id} className="break-inside-avoid">
                    <div className="flex items-baseline justify-between gap-4 mb-1.5">
                      <p className="text-[11px] font-bold text-slate-900">
                        {edu.institution}
                        {degreeField && (
                          <><span className="text-slate-400 font-normal mx-1.5">·</span>{degreeField}</>
                        )}
                      </p>
                      {dateStr && <p className="text-[10px] text-slate-400 shrink-0">{dateStr}</p>}
                    </div>
                    {edu.description && (
                      <p className="text-[10px] text-slate-500 whitespace-pre-line leading-relaxed">{edu.description}</p>
                    )}
                    {i < educations.length - 1 && <div className="mt-4 border-b border-slate-100" />}
                  </li>
                );
              })}
            </ol>
          </section>
        ) : null;

      case "projects":
        return projects.length > 0 ? (
          <section key="projects">
            <SectionHeader title="Projects" accent={ACCENT} />
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
            <SectionHeader title="Other" accent={ACCENT} />
            <ol className="flex flex-col gap-4">
              {others.map((o, i) => (
                <li key={o.id} className="break-inside-avoid">
                  <div className="flex items-baseline justify-between gap-4 mb-1">
                    <p className="text-[11px] font-bold text-slate-900">
                      {o.title}
                      {o.subtitle && (
                        <><span className="text-slate-400 font-normal mx-1.5">·</span>{o.subtitle}</>
                      )}
                    </p>
                    {o.date && <p className="text-[10px] text-slate-400 shrink-0">{formatDate(o.date)}</p>}
                  </div>
                  {o.description && (
                    <p className="text-[10px] text-slate-500 leading-relaxed">{o.description}</p>
                  )}
                  {i < others.length - 1 && <div className="mt-4 border-b border-slate-100" />}
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
      <div style={{ width: "210mm" }} className="mx-auto shadow-md print:shadow-none border border-slate-200 print:border-none">
        {/* ══ ROW 1 — Page 1 ══════════════════════════════════════════ */}
        <div className="relative flex overflow-hidden" style={{ height: "297mm" }}>
          {/* Sidebar — Page 1 */}
          <aside style={sidebarStyle} className="flex flex-col shrink-0 overflow-hidden">
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
                <p className="text-[11px]" style={{ color: ACCENT }}>{profile?.headline ?? "Software Engineer"}</p>
                {profile?.location && <p className="text-[10px]" style={{ color: SIDEBAR_MUTED }}>{profile.location}</p>}
              </div>
            </div>

            <SidebarDivider sidebarBg={SIDEBAR_BG} />

            {profile && (
              <div className="px-6 py-4">
                <SidebarLabel text="Contact" colors={colors} />
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

            {skillGroups.length > 0 && (
              <div className="px-6 py-4 flex flex-col gap-4">
                <SidebarLabel text="Skills" colors={colors} />
                {skillGroups.map(([category, catSkills]) => (
                  <div key={category} className="flex flex-col gap-2">
                    <SidebarCategoryLabel text={category} colors={colors} />
                    {catSkills.map((s) => (
                      <div key={s.id} className="flex items-center justify-between gap-2">
                        <span className="text-[10px] truncate" style={{ color: SIDEBAR_TEXT }}>{s.name}</span>
                        <DotRating level={s.level ?? 3} accent={ACCENT} emptyColor={DOT_EMPTY} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </aside>

          {/* Main — Page 1 */}
          <main style={{ background: PAGE_BG }} className="flex-1 flex flex-col overflow-hidden">
            <header className="px-8 pt-8 pb-5 shrink-0" style={{ borderBottom: `2px solid ${ACCENT}` }}>
              <p className="text-[9px] font-bold tracking-[2.5px] uppercase mb-2" style={{ color: ACCENT }}>
                {profile?.headline ?? "Software Engineer"}
              </p>
              <h1 className="text-3xl font-bold text-slate-900 leading-tight">{profile?.name ?? "Your Name"}</h1>
              {profile?.bio && <p className="mt-2 text-[10px] text-slate-500 leading-relaxed">{profile.bio}</p>}
            </header>

            <div className="px-8 py-6 flex-1 overflow-hidden flex flex-col gap-6">
              {page1Key && renderMainSection(page1Key)}
            </div>
          </main>
          <div className="absolute bottom-3 inset-x-0 text-center text-[10px] text-slate-400 pointer-events-none select-none">
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
          <aside style={sidebarStyle} className="flex flex-col shrink-0">
            {languageSkills.length > 0 && (
              <div className="px-6 py-6 flex flex-col gap-3">
                <SidebarLabel text="Languages" colors={colors} />
                {languageSkills.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-2">
                    <span className="text-[10px]" style={{ color: SIDEBAR_TEXT }}>{s.name}</span>
                    {s.level != null ? <DotRating level={s.level} accent={ACCENT} emptyColor={DOT_EMPTY} /> : null}
                  </div>
                ))}
              </div>
            )}
          </aside>

          {/* Main — Page 2 */}
          <main style={{ background: PAGE_BG }} className="flex-1 px-8 py-6 flex flex-col gap-6">
            {page2Keys.map((key) => renderMainSection(key))}
          </main>
          <div className="absolute bottom-3 inset-x-0 text-center text-[10px] text-slate-400 pointer-events-none select-none">
            Page 2 of 2
          </div>
        </div>
      </div>
    </div>
  );
}
