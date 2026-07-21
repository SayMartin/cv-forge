import type { CvContent } from "@/lib/cv-content-types";
import {
  darkenColor,
  lightenColor,
  getContrastColor,
  hexToRgba,
  sidebarGradient,
} from "@/lib/color-utils";
import type { CvTheme } from "@/lib/cv-theme";
import { DEFAULT_SECTION_ORDER, type SectionKey } from "@/lib/cv-layouts";

const DEFAULT_TEAL = "#2d7d8a";

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "";
  if (/^\d{4}$/.test(dateStr)) return dateStr;
  const [year, month] = dateStr.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleDateString("en-GB", {
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
      className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest py-1 px-3 mb-3"
      style={{ background: colors.teal, borderRadius: "0 20px 20px 0", width: "95%", color: colors.sidebarText }}
    >
      <span>{icon}</span>
      <span>{title}</span>
    </div>
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
}: {
  content: CvContent;
  theme?: CvTheme;
  sectionOrder?: SectionKey[];
}) {
  const { profile, experiences, educations, skills, projects, others } = content;

  const TEAL = theme?.sidebarColor ?? DEFAULT_TEAL;
  const TEAL_DARK = darkenColor(TEAL, 0.09);
  const TEAL_LIGHT = lightenColor(TEAL, 0.09);
  const SIDEBAR_TEXT = getContrastColor(TEAL);
  const SIDEBAR_GRADIENT = `linear-gradient(to right, ${sidebarGradient(TEAL)})`;

  const languageSkills = skills.filter((s) => s.category?.toLowerCase() === "language");
  const otherSkills = skills.filter((s) => s.category?.toLowerCase() !== "language");

  const tealColors: TealColors = { teal: TEAL, tealDark: TEAL_DARK, sidebarText: SIDEBAR_TEXT };

  const mainOrder = sectionOrder.filter((k) => k !== "skills");
  const page1Key = mainOrder[0];
  const page2Keys = mainOrder.slice(1);

  function renderMainSection(key: SectionKey): React.ReactNode {
    switch (key) {
      case "experience":
        return experiences.length > 0 ? (
          <section key="experience">
            <SectionHeader title="Experience" icon="💼" colors={tealColors} />
            <ol className="space-y-3">
              {experiences.map((job) => {
                const dateStr = [formatDate(job.startDate), job.current ? "Present" : formatDate(job.endDate)].filter(Boolean).join(" – ");
                return (
                  <li key={job.id} className="break-inside-avoid">
                    {dateStr && <p className="text-[11px] font-semibold" style={{ color: TEAL }}>{dateStr}</p>}
                    <p className="font-bold text-zinc-800">{job.role} — {job.company}</p>
                    {job.description && (
                      <p className="text-zinc-500 mt-0.5 text-[11px] leading-relaxed whitespace-pre-line">{job.description}</p>
                    )}
                    {job.skills && job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {job.skills.map((s) => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: hexToRgba(TEAL, 0.1), color: TEAL }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        ) : null;

      case "education":
        return educations.length > 0 ? (
          <section key="education">
            <SectionHeader title="Education" icon="🎓" colors={tealColors} />
            <ol className="space-y-3">
              {educations.map((edu) => {
                const dateStr = [formatDate(edu.startDate), edu.current ? "Present" : formatDate(edu.endDate)].filter(Boolean).join(" – ");
                return (
                  <li key={edu.id}>
                    {dateStr && <p className="text-[11px] font-semibold" style={{ color: TEAL }}>{dateStr}</p>}
                    <p className="font-bold text-zinc-800">
                      {edu.degree}{edu.field ? ` in ${edu.field}` : ""} — {edu.institution}
                    </p>
                    {edu.description && (
                      <p className="text-zinc-500 mt-0.5 text-[11px] leading-relaxed">{edu.description}</p>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        ) : null;

      case "projects":
        return projects.length > 0 ? (
          <section key="projects">
            <SectionHeader title="Projects" icon="🚀" colors={tealColors} />
            <ul className="space-y-3">
              {projects.map((proj) => (
                <li key={proj.id}>
                  <p className="font-bold text-zinc-800">{proj.title}</p>
                  {proj.summary && <p className="text-zinc-500 mt-0.5 text-[11px] leading-relaxed">{proj.summary}</p>}
                  <div className="flex gap-3 text-[10px] mt-1" style={{ color: TEAL }}>
                    {proj.url && <a href={proj.url}>Live ↗</a>}
                    {proj.sourceUrl && <a href={proj.sourceUrl}>Source ⎇</a>}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null;

      case "other":
        return others.length > 0 ? (
          <section key="other">
            <SectionHeader title="Other" icon="📌" colors={tealColors} />
            <ul className="space-y-3">
              {others.map((o) => (
                <li key={o.id}>
                  {o.date && <p className="text-[11px] font-semibold" style={{ color: TEAL }}>{formatDate(o.date)}</p>}
                  <p className="font-bold text-zinc-800">
                    {o.title}{o.subtitle && ` — ${o.subtitle}`}
                  </p>
                  {o.description && (
                    <p className="text-zinc-500 mt-0.5 text-[11px] leading-relaxed">{o.description}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ) : null;

      default:
        return null;
    }
  }

  const sidebarProps = {
    style: { background: SIDEBAR_GRADIENT, width: "32%", minWidth: "32%", color: SIDEBAR_TEXT },
    className: "flex flex-col shrink-0 text-xs relative",
  };

  return (
    <div className="py-8 px-4 print:p-0">
      <div style={{ width: "210mm" }} className="mx-auto shadow-md print:shadow-none border border-gray-300 print:border-none text-sm">
        {/* ══ ROW 1 — Page 1 ══════════════════════════════════════════════ */}
        <div className="relative flex overflow-hidden" style={{ height: "297mm" }}>
          {/* Left Sidebar — Page 1 */}
          <aside {...sidebarProps}>
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
              <SidebarHeader title="Contact" colors={tealColors} />
              <ul className="px-4 space-y-2">
                {profile?.name && <li className="flex items-center gap-2"><span>👤</span><span>{profile.name}</span></li>}
                {profile?.phone && <li className="flex items-center gap-2"><span>📞</span><span>{profile.phone}</span></li>}
                {profile?.email && <li className="flex items-center gap-2"><span>✉️</span><span className="break-all">{profile.email}</span></li>}
                {profile?.location && <li className="flex items-center gap-2"><span>📍</span><span>{profile.location}</span></li>}
                {profile?.social?.linkedin && (
                  <li className="flex items-center gap-2">
                    <span>🔗</span>
                    <span className="wrap-break-word">{profile.social.linkedin.replace(/^https?:\/\/(www\.)?/, "")}</span>
                  </li>
                )}
              </ul>
            </div>
          </aside>

          {/* Right Main — Page 1 */}
          <main className="flex-1 bg-white relative overflow-hidden flex flex-col text-xs text-zinc-800">
            <svg viewBox="0 0 200 200" className="absolute top-0 right-0 pointer-events-none" style={{ width: 180, height: 180, opacity: 0.15 }}>
              <circle cx="180" cy="20" r="120" fill={TEAL} />
            </svg>
            <svg viewBox="0 0 200 200" className="absolute top-0 right-0 pointer-events-none" style={{ width: 140, height: 140, opacity: 0.12 }}>
              <circle cx="200" cy="-10" r="100" fill={TEAL} />
            </svg>
            <div className="px-8 pt-10 pb-4 relative z-10">
              <h1 className="text-3xl font-extrabold uppercase tracking-wide leading-tight" style={{ color: TEAL_DARK }}>
                {profile?.name ?? "Your Name"}
              </h1>
              {profile?.headline && (
                <p className="text-sm font-medium tracking-widest mt-1" style={{ color: TEAL_LIGHT }}>
                  {profile.headline.toUpperCase()}
                </p>
              )}
            </div>
            <div className="flex-1 px-8 pb-8 space-y-5 relative z-10">
              {profile?.bio && (
                <section>
                  <SectionHeader title="Profile" icon="👤" colors={tealColors} />
                  <p className="text-zinc-600 leading-relaxed text-[11px]">{profile.bio}</p>
                </section>
              )}
              {page1Key && renderMainSection(page1Key)}
            </div>
          </main>
          <div className="absolute bottom-3 inset-x-0 text-center text-[10px] text-zinc-400 pointer-events-none select-none">
            Page 1 of 2
          </div>
        </div>

        {/* ── Page break band ──────────────────────────────────────────── */}
        <div className="print:hidden h-7 bg-gray-200 flex items-center justify-center">
          <span className="text-[9px] font-medium tracking-widest uppercase text-gray-400">Page 2</span>
        </div>

        {/* ══ ROW 2 — Page 2 ══════════════════════════════════════════════ */}
        <div className="relative flex print:break-before-page" style={{ minHeight: "297mm" }}>
          {/* Left Sidebar — Page 2: Languages + Skills */}
          <aside {...sidebarProps} className="flex flex-col shrink-0 text-xs pt-8 relative">
            {languageSkills.length > 0 && (
              <div className="mb-4">
                <SidebarHeader title="Language" colors={tealColors} />
                <ul className="px-4 space-y-1.5">
                  {languageSkills.map((s) => (
                    <li key={s.id} className="flex items-center justify-between">
                      <span className="text-[10px] tracking-wider" style={{ color: SIDEBAR_TEXT }}>{s.name}</span>
                      {s.level != null && <RatingBoxes level={s.level} />}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {otherSkills.length > 0 && (
              <div className="mb-4">
                <SidebarHeader title="Skills" colors={tealColors} />
                <ul className="px-4 space-y-1.5">
                  {otherSkills.map((s) => (
                    <li key={s.id} className="flex items-center justify-between">
                      <span className="text-[10px] tracking-wider" style={{ color: SIDEBAR_TEXT }}>{s.name}</span>
                      {s.level != null && <RatingBoxes level={s.level} />}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>

          {/* Right Main — Page 2 */}
          <main className="flex-1 bg-white flex flex-col text-xs text-zinc-800">
            <div className="px-8 pt-10 pb-8 space-y-5">
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
