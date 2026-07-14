import type { CvContent, CvExperience, CvSkill } from "@/lib/cv-content-types";
import type { CvTheme } from "@/lib/cv-theme";
import { DEFAULT_SECTION_ORDER, type SectionKey } from "@/lib/cv-layouts";

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

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ExperienceItem({ job }: { job: CvExperience }) {
  const dateStr = [
    formatDate(job.startDate),
    job.current ? "Present" : formatDate(job.endDate),
  ]
    .filter(Boolean)
    .join(" – ");

  return (
    <li className="break-inside-avoid">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-zinc-800">
          {job.role}{" "}
          <span className="font-normal text-zinc-500">· {job.company}</span>
        </p>
        {dateStr && (
          <span className="text-xs text-zinc-400 shrink-0 ml-4">
            {dateStr}
          </span>
        )}
      </div>
      {job.description && (
        <p className="mt-1 text-xs text-zinc-600 whitespace-pre-line">
          {job.description}
        </p>
      )}
      {job.skills && job.skills.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {job.skills.map((s) => (
            <span
              key={s}
              className="rounded bg-gray-100 px-2 py-0.5 text-xs text-zinc-500"
            >
              {s}
            </span>
          ))}
        </div>
      )}
    </li>
  );
}

// ── Main layout ──────────────────────────────────────────────────────────────

export function DefaultLayout({
  content,
  sectionOrder = DEFAULT_SECTION_ORDER,
}: {
  content: CvContent;
  theme?: CvTheme;
  sectionOrder?: SectionKey[];
}) {
  const { profile, experiences, educations, skills, projects, others } = content;

  const skillsByCategory = skills.reduce<Record<string, CvSkill[]>>(
    (acc, s) => {
      const cat = s.category ?? "Other";
      (acc[cat] ??= []).push(s);
      return acc;
    },
    {},
  );

  function renderSection(key: SectionKey): React.ReactNode {
    switch (key) {
      case "experience":
        return experiences.length > 0 ? (
          <Section key="experience" title="Experience">
            <ol className="space-y-5">
              {experiences.map((job) => (
                <ExperienceItem key={job.id} job={job} />
              ))}
            </ol>
          </Section>
        ) : null;

      case "education":
        return educations.length > 0 ? (
          <Section key="education" title="Education">
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
                      <p className="text-sm font-semibold text-zinc-800">
                        {edu.degree}
                        {edu.field ? ` in ${edu.field}` : ""}
                      </p>
                      {dateStr && (
                        <span className="text-xs text-zinc-400 shrink-0 ml-4">
                          {dateStr}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500">{edu.institution}</p>
                    {edu.description && (
                      <p className="mt-1 text-xs text-zinc-500">
                        {edu.description}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          </Section>
        ) : null;

      case "skills":
        return Object.keys(skillsByCategory).length > 0 ? (
          <Section key="skills" title="Skills">
            <div className="space-y-2">
              {Object.entries(skillsByCategory).map(([category, items]) => (
                <div
                  key={category}
                  className="flex gap-2 flex-wrap items-baseline"
                >
                  <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide w-20 shrink-0">
                    {category}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {items.map((s) => (
                      <span
                        key={s.id}
                        className="rounded bg-gray-100 px-2 py-0.5 text-xs text-zinc-600 inline-flex items-center gap-1.5"
                      >
                        {s.name}
                        {s.level != null && (
                          <span
                            className="flex gap-0.5"
                            aria-label={`Level ${s.level} of 5`}
                          >
                            {Array.from({ length: 5 }, (_, i) => (
                              <span
                                key={i}
                                className={`block w-1 h-1 rounded-full ${i < s.level! ? "bg-zinc-500" : "bg-zinc-300"}`}
                              />
                            ))}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        ) : null;

      case "projects":
        return projects.length > 0 ? (
          <Section key="projects" title="Projects">
            <ul className="space-y-3">
              {projects.map((proj) => (
                <li key={proj.id}>
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm font-semibold text-zinc-800">
                      {proj.title}
                    </p>
                    <div className="flex gap-3 text-xs text-zinc-400">
                      {proj.url && (
                        <a href={proj.url} className="hover:text-black">
                          Live
                        </a>
                      )}
                      {proj.sourceUrl && (
                        <a href={proj.sourceUrl} className="hover:text-black">
                          Source
                        </a>
                      )}
                    </div>
                  </div>
                  {proj.summary && (
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {proj.summary}
                    </p>
                  )}
                  {proj.skills && proj.skills.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {proj.skills.map((s) => (
                        <span
                          key={s}
                          className="rounded bg-gray-100 px-2 py-0.5 text-xs text-zinc-500"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        ) : null;

      case "other":
        return others.length > 0 ? (
          <Section key="other" title="Other">
            <ul className="space-y-3">
              {others.map((o) => (
                <li key={o.id}>
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm font-semibold text-zinc-800">
                      {o.title}
                      {o.subtitle && (
                        <span className="font-normal text-zinc-500"> · {o.subtitle}</span>
                      )}
                    </p>
                    {o.date && (
                      <span className="text-xs text-zinc-400 shrink-0 ml-4">
                        {formatDate(o.date)}
                      </span>
                    )}
                  </div>
                  {o.description && (
                    <p className="mt-1 text-xs text-zinc-600">{o.description}</p>
                  )}
                  {o.url && (
                    <a href={o.url} className="text-xs text-zinc-400 hover:text-black mt-0.5 block">
                      {o.url}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        ) : null;
    }
  }

  const page1Section = sectionOrder[0];
  const page2Sections = sectionOrder.slice(1);

  return (
    <div className="py-8 px-4 print:p-0">
      <div style={{ width: "210mm" }} className="mx-auto">
        {/* ══ ROW 1 — Page 1 ══════════════════════════════════════════ */}
        <div
          style={{ height: "297mm" }}
          className="relative overflow-hidden bg-white shadow-md print:shadow-none border border-gray-300 print:border-none p-12 print:p-10 space-y-8 text-zinc-800"
        >
          {/* ── Header / Profile ─────────────────────────────── */}
          {profile && (
            <header className="border-b border-gray-200 pb-6">
              <h1 className="text-3xl font-bold tracking-tight text-black">
                {profile.name}
              </h1>
              {profile.headline && (
                <p className="mt-1 text-base text-zinc-500">
                  {profile.headline}
                </p>
              )}
              {profile.bio && (
                <p className="mt-3 text-sm text-zinc-600 leading-relaxed max-w-prose">
                  {profile.bio}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-400">
                {profile.location && <span>{profile.location}</span>}
                {profile.email && (
                  <a href={`mailto:${profile.email}`} className="hover:text-black">
                    {profile.email}
                  </a>
                )}
                {profile.phone && <span>{profile.phone}</span>}
                {profile.social?.linkedin && (
                  <a href={profile.social.linkedin} className="hover:text-black">LinkedIn</a>
                )}
                {profile.social?.github && (
                  <a href={profile.social.github} className="hover:text-black">GitHub</a>
                )}
                {profile.social?.website && (
                  <a href={profile.social.website} className="hover:text-black">Website</a>
                )}
              </div>
            </header>
          )}

          {renderSection(page1Section)}

          <div className="absolute bottom-3 inset-x-0 text-center text-[10px] text-zinc-400 pointer-events-none select-none">
            Page 1 of 2
          </div>
        </div>
        {/* ══ End Row 1 ══════════════════════════════════════════════ */}

        {/* ── Page break band (screen only) ──────────────────────── */}
        <div className="print:hidden h-7 bg-gray-200 flex items-center justify-center">
          <span className="text-[9px] font-medium tracking-widest uppercase text-gray-400">
            Page 2
          </span>
        </div>

        {/* ══ ROW 2 — Page 2 ══════════════════════════════════════════ */}
        <div
          style={{ minHeight: "297mm" }}
          className="relative bg-white shadow-md print:shadow-none border border-gray-300 print:border-none p-12 print:p-10 space-y-8 text-zinc-800 print:break-before-page"
        >
          {page2Sections.map((key) => renderSection(key))}
          <div className="absolute bottom-3 inset-x-0 text-center text-[10px] text-zinc-400 pointer-events-none select-none">
            Page 2 of 2
          </div>
        </div>
        {/* ══ End Row 2 ══════════════════════════════════════════════ */}
      </div>
    </div>
  );
}
