import type { CvContent, CvEducation, CvExperience, CvOther, CvProject } from "@/lib/cv-content-types";
import type { CvTheme } from "@/lib/cv-theme";
import { DEFAULT_SECTION_ORDER, type SectionKey } from "@/lib/cv-layouts";
import { buildTimeline } from "@/lib/cv-timeline";
import { cvStrings, type CvStrings } from "@/lib/cv-strings";
import { format } from "@/i18n/format";
import { Paginated } from "./pagination/Paginated";
import type { PageBlock } from "./pagination/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ title }: { title: string }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">
      {title}
    </h2>
  );
}

function TypeBadge({ label }: { label: string }) {
  return (
    <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 mb-0.5">
      {label}
    </p>
  );
}

// Takes `t` as a prop rather than reading a context: the layouts are Server
// Components and the CV's language is data, so there is nothing to read from.
function ExperienceItem({ job, badge, t }: { job: CvExperience; badge?: boolean; t: CvStrings }) {
  const dateStr = [
    formatDate(job.startDate, t.dateLocale),
    job.current ? t.present : formatDate(job.endDate, t.dateLocale),
  ]
    .filter(Boolean)
    .join(" – ");

  return (
    <div className="break-inside-avoid">
      {badge && <TypeBadge label={t.timelineType.experience} />}
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
      {job.url && (
        <span className="block wrap-break-word text-xs text-zinc-400 mt-0.5">
          {t.liveAt} <a href={job.url} className="hover:text-black">{job.url}</a>
        </span>
      )}
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
              className="rounded bg-gray-100 px-2 py-0.5 text-xs text-zinc-500"
            >
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main layout ──────────────────────────────────────────────────────────────

export function DefaultLayout({
  content,
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


  function educationEntry(edu: CvEducation, badge?: boolean) {
    const dateStr = [
      formatDate(edu.startDate, t.dateLocale),
      edu.current ? t.present : formatDate(edu.endDate, t.dateLocale),
    ]
      .filter(Boolean)
      .join(" – ");
    return (
      <div className="break-inside-avoid">
        {badge && <TypeBadge label={t.timelineType.education} />}
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-semibold text-zinc-800">
            {edu.field ? format(t.degreeIn, { degree: edu.degree ?? "", field: edu.field }) : edu.degree}
          </p>
          {dateStr && (
            <span className="text-xs text-zinc-400 shrink-0 ml-4">
              {dateStr}
            </span>
          )}
        </div>
        <p className="text-sm text-zinc-500">{edu.institution}</p>
        {edu.description && (
          <p className="mt-1 text-sm text-zinc-500">
            {edu.description}
          </p>
        )}
      </div>
    );
  }

  function projectEntry(proj: CvProject, badge?: boolean) {
    const dateStr = [formatDate(proj.startDate, t.dateLocale), proj.current ? t.present : formatDate(proj.endDate, t.dateLocale)].filter(Boolean).join(" – ") || (proj.publishedAt ? formatDate(proj.publishedAt, t.dateLocale) : "");
    return (
      <div className="break-inside-avoid">
        {badge && <TypeBadge label={t.timelineType.projects} />}
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-semibold text-zinc-800">
            {proj.title}
          </p>
          {dateStr && (
            <span className="text-xs text-zinc-400 shrink-0 ml-4">{dateStr}</span>
          )}
        </div>
        {(proj.url || proj.sourceUrl) && (
          <div className="flex flex-col gap-0.5 text-xs text-zinc-400 mt-0.5">
            {proj.url && (
              <span className="wrap-break-word">
                {t.liveAt} <a href={proj.url} className="hover:text-black">{proj.url}</a>
              </span>
            )}
            {proj.sourceUrl && (
              <span className="wrap-break-word">
                {t.source} <a href={proj.sourceUrl} className="hover:text-black">{proj.sourceUrl}</a>
              </span>
            )}
          </div>
        )}
        {proj.summary && (
          <p className="text-sm text-zinc-500 mt-0.5">
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
      </div>
    );
  }

  function otherEntry(o: CvOther, badge?: boolean) {
    return (
      <div className="break-inside-avoid">
        {badge && <TypeBadge label={t.timelineType.other} />}
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-semibold text-zinc-800">
            {o.title}
            {o.subtitle && (
              <span className="font-normal text-zinc-500"> · {o.subtitle}</span>
            )}
          </p>
          {o.date && (
            <span className="text-xs text-zinc-400 shrink-0 ml-4">
              {formatDate(o.date, t.dateLocale)}
            </span>
          )}
        </div>
        {o.description && (
          <p className="mt-1 text-sm text-zinc-600">{o.description}</p>
        )}
        {o.url && (
          <a href={o.url} className="text-xs text-zinc-400 hover:text-black mt-0.5 block">
            {o.url}
          </a>
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
              {i === 0 && <SectionTitle title={t.sections.experience} />}
              <ExperienceItem job={job} t={t} />
            </div>
          ),
        }));

      case "education":
        return educations.map((edu, i) => ({
          id: `education-${edu.id}`,
          node: (
            <div className="mb-6">
              {i === 0 && <SectionTitle title={t.sections.education} />}
              {educationEntry(edu)}
            </div>
          ),
        }));

      case "skills":
        return skillGroups.length > 0
          ? [
              {
                id: "skills",
                node: (
                  <div className="mb-6">
                    <SectionTitle title={t.sections.skills} />
                    <div className="space-y-2">
                      {skillGroups.map(({ categoryId, name: category, skills: items }) => (
                        <div
                          key={categoryId}
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
                                    aria-label={format(t.levelOf, { level: s.level })}
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
                  </div>
                ),
              },
            ]
          : [];

      case "projects":
        return projects.map((proj, i) => ({
          id: `project-${proj.id}`,
          node: (
            <div className="mb-6">
              {i === 0 && <SectionTitle title={t.sections.projects} />}
              {projectEntry(proj)}
            </div>
          ),
        }));

      case "other":
        return others.map((o, i) => ({
          id: `other-${o.id}`,
          node: (
            <div className="mb-6">
              {i === 0 && <SectionTitle title={t.sections.other} />}
              {otherEntry(o)}
            </div>
          ),
        }));

      default:
        return [];
    }
  }

  // Merges experience/education/projects/other into one date-sorted timeline
  // (most recent/ongoing first); Skills stays separate, spliced before or
  // after based on its stored position in `sectionOrder`.
  function chronologicalBlocks(): PageBlock[] {
    const timeline = buildTimeline(content);
    const timelineBlocks: PageBlock[] = timeline.map((entry, i) => {
      const title = i === 0 ? <SectionTitle title={t.sections.timeline} /> : null;
      const entryNode = (() => {
        switch (entry.type) {
          case "experience": return <ExperienceItem job={entry.data} badge t={t} />;
          case "education": return educationEntry(entry.data, true);
          case "projects": return projectEntry(entry.data, true);
          case "other": return otherEntry(entry.data, true);
        }
      })();
      return {
        id: `${entry.type}-${entry.id}`,
        node: (
          <div className="mb-6">
            {title}
            {entryNode}
          </div>
        ),
      };
    });

    const skillsBlocks = sectionBlocks("skills");
    const skillsIdx = sectionOrder.indexOf("skills");
    const firstOtherIdx = sectionOrder.findIndex((k) => k !== "skills");
    const skillsFirst = skillsIdx !== -1 && (firstOtherIdx === -1 || skillsIdx < firstOtherIdx);

    return skillsFirst ? [...skillsBlocks, ...timelineBlocks] : [...timelineBlocks, ...skillsBlocks];
  }

  const header = profile ? (
    <header className="border-b border-gray-200 pb-6 mb-8">
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
          <a href={profile.social.website} className="hover:text-black">{t.website}</a>
        )}
      </div>
    </header>
  ) : null;

  const mainBlocks = chronological ? chronologicalBlocks() : sectionOrder.flatMap(sectionBlocks);

  return (
    <div className="py-8 px-4 print:p-0">
      <Paginated
        header={header}
        blocks={mainBlocks}
        pageLabel={t.pageOf}
        pageClassName="bg-white shadow-md print:shadow-none border border-gray-300 print:border-none p-12 print:p-10 text-zinc-800"
      />
    </div>
  );
}
