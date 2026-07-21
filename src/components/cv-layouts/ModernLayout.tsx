import type { CvContent } from "@/lib/cv-content-types";
import {
  darkenColor,
  getContrastColor,
  sidebarGradient,
} from "@/lib/color-utils";
import type { CvTheme } from "@/lib/cv-theme";
import { DEFAULT_SECTION_ORDER, type SectionKey } from "@/lib/cv-layouts";

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
          className="wrap-break-word transition-colors"
          style={{ color: colors.sidebarText }}
        >
          {text}
        </a>
      ) : (
        <span className="wrap-break-word" style={{ color: colors.sidebarText }}>
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
}: {
  content: CvContent;
  theme?: CvTheme;
  sectionOrder?: SectionKey[];
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

  // Skills live in the sidebar — exclude from main-column ordering
  const mainOrder = sectionOrder.filter((k) => k !== "skills");
  const page1Key = mainOrder[0];
  const page2Keys = mainOrder.slice(1);

  function renderMainSection(key: SectionKey): React.ReactNode {
    switch (key) {
      case "experience":
        return experiences.length > 0 ? (
          <RightSection key="experience" icon="💼" title="Work Experience" colors={colors}>
            <ol className="space-y-4">
              {experiences.map((job) => {
                const dateStr = [
                  formatDate(job.startDate),
                  job.current ? "Present" : formatDate(job.endDate),
                ]
                  .filter(Boolean)
                  .join(" – ");
                return (
                  <li key={job.id} className="break-inside-avoid">
                    <div className="flex items-baseline justify-between">
                      <p className="text-xs font-semibold text-zinc-800">
                        {job.company}
                        {dateStr && (
                          <span className="font-normal text-zinc-400 ml-2">
                            {dateStr}
                          </span>
                        )}
                      </p>
                    </div>
                    <p className="text-xs font-medium mt-0.5" style={{ color: GOLD }}>
                      {job.role}
                    </p>
                    {job.description && (
                      <p className="mt-1 text-[11px] text-zinc-600 whitespace-pre-line">
                        {job.description}
                      </p>
                    )}
                    {job.skills && job.skills.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {job.skills.map((s) => (
                          <span
                            key={s}
                            className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-zinc-500"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </RightSection>
        ) : null;

      case "education":
        return educations.length > 0 ? (
          <RightSection key="education" icon="🎓" title="Education" colors={colors}>
            <ol className="space-y-3">
              {educations.map((edu) => {
                const dateStr = [
                  formatDate(edu.startDate),
                  edu.current ? "Present" : formatDate(edu.endDate),
                ]
                  .filter(Boolean)
                  .join(" – ");
                return (
                  <li key={edu.id}>
                    <div className="flex items-baseline justify-between">
                      <p className="text-xs font-semibold text-zinc-800">
                        {edu.institution}
                        {dateStr && (
                          <span className="font-normal text-zinc-400 ml-2">
                            {dateStr}
                          </span>
                        )}
                      </p>
                    </div>
                    {(edu.degree || edu.field) && (
                      <p className="text-xs font-medium mt-0.5" style={{ color: GOLD }}>
                        {edu.degree}
                        {edu.field ? ` in ${edu.field}` : ""}
                      </p>
                    )}
                    {edu.description && (
                      <p className="text-xs text-zinc-500 mt-0.5">{edu.description}</p>
                    )}
                  </li>
                );
              })}
            </ol>
          </RightSection>
        ) : null;

      case "projects":
        return projects.length > 0 ? (
          <RightSection key="projects" icon="🚀" title="Projects" colors={colors}>
            <ul className="space-y-3">
              {projects.map((proj) => (
                <li key={proj.id}>
                  <div className="flex items-baseline justify-between">
                    <p className="text-xs font-semibold text-zinc-800">{proj.title}</p>
                    <div className="flex gap-3 text-[10px] text-zinc-400">
                      {proj.url && <a href={proj.url}>Live</a>}
                      {proj.sourceUrl && <a href={proj.sourceUrl}>Source</a>}
                    </div>
                  </div>
                  {proj.summary && (
                    <p className="text-xs text-zinc-500 mt-0.5">{proj.summary}</p>
                  )}
                  {proj.skills && proj.skills.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {proj.skills.map((s) => (
                        <span
                          key={s}
                          className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-zinc-500"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </RightSection>
        ) : null;

      case "other":
        return others.length > 0 ? (
          <RightSection key="other" icon="📌" title="Other" colors={colors}>
            <ul className="space-y-3">
              {others.map((o) => (
                <li key={o.id}>
                  <div className="flex items-baseline justify-between">
                    <p className="text-xs font-semibold text-zinc-800">
                      {o.title}
                      {o.subtitle && (
                        <span className="font-normal text-zinc-400 ml-1">· {o.subtitle}</span>
                      )}
                    </p>
                    {o.date && (
                      <span className="text-[10px] text-zinc-400 shrink-0 ml-2">
                        {formatDate(o.date)}
                      </span>
                    )}
                  </div>
                  {o.description && (
                    <p className="text-xs text-zinc-500 mt-0.5">{o.description}</p>
                  )}
                </li>
              ))}
            </ul>
          </RightSection>
        ) : null;

      default:
        return null;
    }
  }

  return (
    <div className="py-8 px-4 print:p-0">
      <div
        style={{ width: "210mm" }}
        className="mx-auto shadow-md print:shadow-none border border-gray-300 print:border-none text-sm"
      >
        {/* ══ ROW 1 — Page 1 ═════════════════════════════════════════ */}
        <div className="relative flex overflow-hidden" style={{ height: "297mm" }}>
          {/* Left Sidebar — Page 1 */}
          <aside
            style={{ background: SIDEBAR_GRADIENT, width: "30%", color: SIDEBAR_TEXT }}
            className="flex flex-col shrink-0 relative"
          >
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
          </aside>

          {/* Right Content — Page 1 */}
          <main className="flex-1 bg-white flex flex-col">
            <header className="px-8 pt-8 pb-4" style={{ borderBottom: `3px solid ${GOLD}` }}>
              <h1 className="text-3xl font-bold tracking-tight leading-none">
                <span className="text-zinc-800">{firstName} </span>
                <span className="text-zinc-800">{lastName}</span>
              </h1>
              {profile?.headline && (
                <p className="mt-1 text-xs tracking-widest uppercase text-zinc-400">
                  {profile.headline}
                </p>
              )}
            </header>

            <div className="px-8 py-5 space-y-6">
              {profile?.bio && (
                <RightSection icon="👤" title="Profile" colors={colors}>
                  <p className="text-xs text-zinc-600 leading-relaxed">{profile.bio}</p>
                </RightSection>
              )}
              {page1Key && renderMainSection(page1Key)}
            </div>
          </main>
          <div className="absolute bottom-3 inset-x-0 text-center text-[10px] text-zinc-400 pointer-events-none select-none">
            Page 1 of 2
          </div>
        </div>

        {/* ══ PAGE BREAK BAND ════════════════════════════════════════ */}
        <div className="print:hidden h-7 bg-gray-200 flex items-center justify-center">
          <span className="text-[9px] font-medium tracking-widest uppercase text-gray-400">
            Page 2
          </span>
        </div>

        {/* ══ ROW 2 — Page 2 ═════════════════════════════════════════ */}
        <div className="relative flex print:break-before-page" style={{ minHeight: "297mm" }}>
          {/* Left Sidebar — Page 2: Language first, then Skills */}
          <aside
            style={{ background: SIDEBAR_GRADIENT, width: "30%", color: SIDEBAR_TEXT }}
            className="flex flex-col shrink-0 relative"
          >
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
          </aside>

          {/* Right Content — Page 2 */}
          <main className="flex-1 bg-white flex flex-col">
            <div className="px-8 pt-8 pb-5 space-y-6">
              {page2Keys.map((key) => renderMainSection(key))}
            </div>
          </main>
          <div className="absolute bottom-3 inset-x-0 text-center text-[10px] text-zinc-400 pointer-events-none select-none">
            Page 2 of 2
          </div>
        </div>
      </div>
    </div>
  );
}
