import { groupSkillsByCategory, isLanguageSkill } from "@/lib/cv-content-types";
import type { CvContent, CvEducation, CvExperience, CvOther, CvProject } from "@/lib/cv-content-types";
import type { CvTheme } from "@/lib/cv-theme";
import { DEFAULT_SECTION_ORDER, type SectionKey } from "@/lib/cv-layouts";
import { buildTimeline, TIMELINE_TYPE_LABEL } from "@/lib/cv-timeline";
import { Paginated } from "./pagination/Paginated";
import type { PageBlock } from "./pagination/types";

const EUROPASS_BLUE = "#003399";

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "";
  if (/^\d{4}$/.test(dateStr)) return dateStr;
  const [year, month] = dateStr.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
  });
}

function formatBirthDate(date?: Date | null) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
}

// Two-column "date | content" row — the structural signature of the official Europass CV template.
function DatedRow({ dateLabel, children, accent }: { dateLabel: string; children: React.ReactNode; accent: string }) {
  return (
    <div className="flex gap-4 break-inside-avoid">
      <div className="w-20 shrink-0 text-xs font-medium pt-0.5 whitespace-pre-line" style={{ color: accent }}>
        {dateLabel}
      </div>
      <div className="flex-1 border-l pl-4" style={{ borderColor: accent + "33" }}>
        {children}
      </div>
    </div>
  );
}

function SectionTitle({ title, accent }: { title: string; accent: string }) {
  return (
    <h2
      className="text-xs font-bold uppercase tracking-wider pb-1 mb-3 border-b-2"
      style={{ color: accent, borderColor: accent }}
    >
      {title}
    </h2>
  );
}

function InfoRow({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-28 shrink-0 text-xs font-medium" style={{ color: accent }}>{label}</div>
      <div className="flex-1 text-xs text-zinc-700">{value}</div>
    </div>
  );
}

function TypeBadge({ label, accent }: { label: string; accent: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: accent + "99" }}>
      {label}
    </p>
  );
}

export function EuropassLayout({
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
  const ACCENT = theme?.sidebarColor ?? EUROPASS_BLUE;

  // Spoken languages are pulled out by category *role*, not by heading text: the
  // Europass format requires them in their own CEFR table, so this filter must keep
  // matching "Language" even if the visible grouping changes around it.
  const languageSkills = skills.filter(isLanguageSkill);

  // Everything else is grouped and ordered by SKILL_CATEGORIES, so each category
  // becomes its own labelled block instead of collapsing into two fixed buckets.
  const skillGroups = groupSkillsByCategory(
    skills.filter((s) => !isLanguageSkill(s)),
  );

  // Pure "one entry's content" builders — reused both by the grouped-by-section
  // path (title fused into the first entry) and the chronological path (a
  // small type badge on every entry instead of a section title).
  function experienceEntry(job: CvExperience, badge?: boolean) {
    const dateStr = [formatDate(job.startDate), job.current ? "Present" : formatDate(job.endDate)].filter(Boolean).join(" –\n");
    return (
      <DatedRow dateLabel={dateStr} accent={ACCENT}>
        {badge && <TypeBadge label={TIMELINE_TYPE_LABEL.experience} accent={ACCENT} />}
        <p className="font-bold text-zinc-800 text-sm">{job.role}</p>
        <p className="text-zinc-600 text-sm">{job.company}</p>
        {job.description && (
          <p className="text-zinc-600 mt-1 text-sm leading-relaxed whitespace-pre-line">{job.description}</p>
        )}
        {job.url && (
          <p className="text-xs text-zinc-600 wrap-break-word mt-1">
            Live at: <a href={job.url} style={{ color: ACCENT }}>{job.url}</a>
          </p>
        )}
        {job.skills && job.skills.length > 0 && (
          <p className="text-xs text-zinc-600 mt-1">Skills used: {job.skills.join(", ")}</p>
        )}
      </DatedRow>
    );
  }

  function educationEntry(edu: CvEducation, badge?: boolean) {
    const dateStr = [formatDate(edu.startDate), edu.current ? "Present" : formatDate(edu.endDate)].filter(Boolean).join(" –\n");
    return (
      <DatedRow dateLabel={dateStr} accent={ACCENT}>
        {badge && <TypeBadge label={TIMELINE_TYPE_LABEL.education} accent={ACCENT} />}
        <p className="font-bold text-zinc-800 text-sm">
          {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
        </p>
        <p className="text-zinc-600 text-sm">{edu.institution}</p>
        {edu.description && (
          <p className="text-zinc-600 mt-1 text-sm leading-relaxed">{edu.description}</p>
        )}
      </DatedRow>
    );
  }

  function projectEntry(proj: CvProject, badge?: boolean) {
    const dateStr = [formatDate(proj.startDate), proj.current ? "Present" : formatDate(proj.endDate)].filter(Boolean).join(" –\n") || (proj.publishedAt ? formatDate(proj.publishedAt) : "");
    return (
      <DatedRow dateLabel={dateStr} accent={ACCENT}>
        {badge && <TypeBadge label={TIMELINE_TYPE_LABEL.projects} accent={ACCENT} />}
        <p className="font-bold text-zinc-800 text-sm">{proj.title}</p>
        {proj.summary && <p className="text-zinc-600 mt-0.5 text-sm leading-relaxed">{proj.summary}</p>}
        <div className="flex flex-col gap-0.5 text-xs mt-1">
          {proj.url && (
            <span className="text-zinc-600 wrap-break-word">
              Live at: <a href={proj.url} style={{ color: ACCENT }}>{proj.url}</a>
            </span>
          )}
          {proj.sourceUrl && (
            <span className="text-zinc-600 wrap-break-word">
              Source: <a href={proj.sourceUrl} style={{ color: ACCENT }}>{proj.sourceUrl}</a>
            </span>
          )}
        </div>
        {proj.skills && proj.skills.length > 0 && (
          <p className="text-xs text-zinc-600 mt-1">Skills used: {proj.skills.join(", ")}</p>
        )}
      </DatedRow>
    );
  }

  function otherEntry(o: CvOther, badge?: boolean) {
    return (
      <div>
        {badge && <TypeBadge label={TIMELINE_TYPE_LABEL.other} accent={ACCENT} />}
        {o.date && <p className="text-xs font-semibold" style={{ color: ACCENT }}>{formatDate(o.date)}</p>}
        <p className="font-bold text-zinc-800 text-sm">
          {o.title}{o.subtitle && ` — ${o.subtitle}`}
        </p>
        {o.url && (
          <p className="text-xs text-zinc-600 wrap-break-word mt-0.5">
            <a href={o.url} style={{ color: ACCENT }}>{o.url}</a>
          </p>
        )}
        {o.description && (
          <p className="text-zinc-600 mt-0.5 text-sm leading-relaxed">{o.description}</p>
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
              {i === 0 && <SectionTitle title="Work experience" accent={ACCENT} />}
              {experienceEntry(job)}
            </div>
          ),
        }));

      case "education":
        return educations.map((edu, i) => ({
          id: `education-${edu.id}`,
          node: (
            <div className="mb-6">
              {i === 0 && <SectionTitle title="Education and training" accent={ACCENT} />}
              {educationEntry(edu)}
            </div>
          ),
        }));

      case "skills":
        return skills.length > 0 || profile?.drivingLicense
          ? [
              {
                id: "skills",
                node: (
                  <div className="mb-6">
                    <SectionTitle title="Personal skills" accent={ACCENT} />
                    <div className="space-y-4">
                      {languageSkills.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-zinc-700 mb-1.5">Language skills</p>
                          <table className="w-full text-xs border-collapse">
                            <thead>
                              <tr className="border-b" style={{ borderColor: ACCENT + "33" }}>
                                <th className="text-left font-medium py-1 pr-4" style={{ color: ACCENT }}>Language</th>
                                <th className="text-left font-medium py-1" style={{ color: ACCENT }}>CEFR level</th>
                              </tr>
                            </thead>
                            <tbody>
                              {languageSkills.map((s) => (
                                <tr key={s.id} className="border-b border-zinc-100">
                                  <td className="py-1 pr-4 text-zinc-700">{s.name}</td>
                                  <td className="py-1 text-zinc-700">{s.cefrLevel ?? "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <p className="text-xs text-zinc-400 mt-1">
                            Levels: A1/A2 Basic user · B1/B2 Independent user · C1/C2 Proficient user (Common European Framework of Reference).
                          </p>
                        </div>
                      )}
                      {skillGroups.map(([category, items]) => (
                        <div key={category}>
                          <p className="text-xs font-semibold text-zinc-700 mb-1.5">{category}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {items.map((s) => (
                              <span key={s.id} className="text-xs px-2 py-0.5 rounded" style={{ background: ACCENT + "14", color: ACCENT }}>
                                {s.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                      {profile?.drivingLicense && (
                        <div>
                          <p className="text-xs font-semibold text-zinc-700 mb-1">Driving licence</p>
                          <p className="text-xs text-zinc-700">{profile.drivingLicense}</p>
                        </div>
                      )}
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
              {i === 0 && <SectionTitle title="Projects" accent={ACCENT} />}
              {projectEntry(proj)}
            </div>
          ),
        }));

      case "other":
        return others.map((o, i) => ({
          id: `other-${o.id}`,
          node: (
            <div className="mb-6">
              {i === 0 && <SectionTitle title="Additional information" accent={ACCENT} />}
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
      const title = i === 0 ? <SectionTitle title="Timeline" accent={ACCENT} /> : null;
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

  const header = (
    <>
      <div className="flex items-start justify-between gap-6 pb-6 mb-6 border-b-4" style={{ borderColor: ACCENT }}>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: ACCENT }}>Curriculum Vitae</p>
          <h1 className="text-2xl font-extrabold text-zinc-800 mt-1">{profile?.name ?? "Your Name"}</h1>
          {profile?.headline && <p className="text-sm text-zinc-500 mt-0.5">{profile.headline}</p>}
        </div>
        {content.avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={content.avatarUrl} alt={profile?.name ?? ""} className="w-24 h-24 object-cover rounded border" style={{ borderColor: ACCENT }} />
        )}
      </div>

      <section className="mb-6">
        <SectionTitle title="Personal information" accent={ACCENT} />
        <div className="space-y-1.5">
          {profile?.location && <InfoRow label="Address" value={profile.location} accent={ACCENT} />}
          {profile?.phone && <InfoRow label="Telephone" value={profile.phone} accent={ACCENT} />}
          {profile?.email && <InfoRow label="Email" value={profile.email} accent={ACCENT} />}
          {profile?.nationality && <InfoRow label="Nationality" value={profile.nationality} accent={ACCENT} />}
          {profile?.dateOfBirth && <InfoRow label="Date of birth" value={formatBirthDate(profile.dateOfBirth)} accent={ACCENT} />}
          {profile?.social?.linkedin && <InfoRow label="LinkedIn" value={profile.social.linkedin} accent={ACCENT} />}
          {profile?.social?.website && <InfoRow label="Website" value={profile.social.website} accent={ACCENT} />}
        </div>
      </section>

      {profile?.bio && (
        <section className="mb-6">
          <SectionTitle title="Profile summary" accent={ACCENT} />
          <p className="text-zinc-600 leading-relaxed text-sm">{profile.bio}</p>
        </section>
      )}
    </>
  );

  const mainBlocks = chronological ? chronologicalBlocks() : sectionOrder.flatMap(sectionBlocks);

  return (
    <div className="py-8 px-4 print:p-0">
      <Paginated
        header={header}
        blocks={mainBlocks}
        pageClassName="bg-white shadow-md print:shadow-none border border-gray-300 print:border-none px-10 py-10 text-sm"
      />
    </div>
  );
}
