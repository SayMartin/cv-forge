import type { CvContent } from "@/lib/cv-content-types";
import type { CvTheme } from "@/lib/cv-theme";
import { DEFAULT_SECTION_ORDER, type SectionKey } from "@/lib/cv-layouts";
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
      <div className="w-28 shrink-0 text-[11px] font-medium pt-0.5" style={{ color: accent }}>
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
      <div className="w-28 shrink-0 text-[11px] font-medium" style={{ color: accent }}>{label}</div>
      <div className="flex-1 text-[11px] text-zinc-700">{value}</div>
    </div>
  );
}

export function EuropassLayout({
  content,
  theme,
  sectionOrder = DEFAULT_SECTION_ORDER,
}: {
  content: CvContent;
  theme?: CvTheme;
  sectionOrder?: SectionKey[];
}) {
  const { profile, experiences, educations, skills, projects, others } = content;
  const ACCENT = theme?.sidebarColor ?? EUROPASS_BLUE;

  const languageSkills = skills.filter((s) => s.category?.toLowerCase() === "language");
  const digitalSkills = skills.filter((s) => ["tool", "platform"].includes(s.category?.toLowerCase() ?? ""));
  const otherSkills = skills.filter((s) => {
    const c = s.category?.toLowerCase();
    return c !== "language" && c !== "tool" && c !== "platform";
  });

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
                {i === 0 && <SectionTitle title="Work experience" accent={ACCENT} />}
                <DatedRow dateLabel={dateStr} accent={ACCENT}>
                  <p className="font-bold text-zinc-800 text-[12px]">{job.role}</p>
                  <p className="text-zinc-600 text-[11px]">{job.company}</p>
                  {job.description && (
                    <p className="text-zinc-500 mt-1 text-[11px] leading-relaxed whitespace-pre-line">{job.description}</p>
                  )}
                  {job.skills && job.skills.length > 0 && (
                    <p className="text-[10px] text-zinc-400 mt-1">Skills used: {job.skills.join(", ")}</p>
                  )}
                </DatedRow>
              </div>
            ),
          };
        });

      case "education":
        return educations.map((edu, i) => {
          const dateStr = [formatDate(edu.startDate), edu.current ? "Present" : formatDate(edu.endDate)].filter(Boolean).join(" – ");
          return {
            id: `education-${edu.id}`,
            node: (
              <div className="mb-6">
                {i === 0 && <SectionTitle title="Education and training" accent={ACCENT} />}
                <DatedRow dateLabel={dateStr} accent={ACCENT}>
                  <p className="font-bold text-zinc-800 text-[12px]">
                    {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                  </p>
                  <p className="text-zinc-600 text-[11px]">{edu.institution}</p>
                  {edu.description && (
                    <p className="text-zinc-500 mt-1 text-[11px] leading-relaxed">{edu.description}</p>
                  )}
                </DatedRow>
              </div>
            ),
          };
        });

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
                          <p className="text-[11px] font-semibold text-zinc-700 mb-1.5">Language skills</p>
                          <table className="w-full text-[11px] border-collapse">
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
                          <p className="text-[9px] text-zinc-400 mt-1">
                            Levels: A1/A2 Basic user · B1/B2 Independent user · C1/C2 Proficient user (Common European Framework of Reference).
                          </p>
                        </div>
                      )}
                      {digitalSkills.length > 0 && (
                        <div>
                          <p className="text-[11px] font-semibold text-zinc-700 mb-1.5">Digital skills</p>
                          <div className="flex flex-wrap gap-1.5">
                            {digitalSkills.map((s) => (
                              <span key={s.id} className="text-[10px] px-2 py-0.5 rounded" style={{ background: ACCENT + "14", color: ACCENT }}>
                                {s.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {otherSkills.length > 0 && (
                        <div>
                          <p className="text-[11px] font-semibold text-zinc-700 mb-1.5">Other skills</p>
                          <div className="flex flex-wrap gap-1.5">
                            {otherSkills.map((s) => (
                              <span key={s.id} className="text-[10px] px-2 py-0.5 rounded" style={{ background: ACCENT + "14", color: ACCENT }}>
                                {s.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {profile?.drivingLicense && (
                        <div>
                          <p className="text-[11px] font-semibold text-zinc-700 mb-1">Driving licence</p>
                          <p className="text-[11px] text-zinc-700">{profile.drivingLicense}</p>
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
              <div>
                <p className="font-bold text-zinc-800 text-[12px]">{proj.title}</p>
                {proj.summary && <p className="text-zinc-500 mt-0.5 text-[11px] leading-relaxed">{proj.summary}</p>}
                <div className="flex gap-3 text-[10px] mt-1" style={{ color: ACCENT }}>
                  {proj.url && <a href={proj.url}>Live ↗</a>}
                  {proj.sourceUrl && <a href={proj.sourceUrl}>Source ⎇</a>}
                </div>
              </div>
            </div>
          ),
        }));

      case "other":
        return others.map((o, i) => ({
          id: `other-${o.id}`,
          node: (
            <div className="mb-6">
              {i === 0 && <SectionTitle title="Additional information" accent={ACCENT} />}
              <div>
                {o.date && <p className="text-[11px] font-semibold" style={{ color: ACCENT }}>{formatDate(o.date)}</p>}
                <p className="font-bold text-zinc-800 text-[12px]">
                  {o.title}{o.subtitle && ` — ${o.subtitle}`}
                </p>
                {o.description && (
                  <p className="text-zinc-500 mt-0.5 text-[11px] leading-relaxed">{o.description}</p>
                )}
              </div>
            </div>
          ),
        }));

      default:
        return [];
    }
  }

  const header = (
    <>
      <div className="flex items-start justify-between gap-6 pb-6 mb-6 border-b-4" style={{ borderColor: ACCENT }}>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: ACCENT }}>Curriculum Vitae</p>
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
          <p className="text-zinc-600 leading-relaxed text-[11px]">{profile.bio}</p>
        </section>
      )}
    </>
  );

  const mainBlocks = sectionOrder.flatMap(sectionBlocks);

  return (
    <div className="py-8 px-4 print:p-0">
      <Paginated
        header={header}
        blocks={mainBlocks}
        pageClassName="bg-white shadow-md print:shadow-none border border-gray-300 print:border-none px-10 py-10 text-sm"
        renderFooter={(page, count) => (
          <div className="absolute bottom-3 inset-x-0 text-center text-[10px] text-zinc-400 pointer-events-none select-none">
            Page {page} of {count}
          </div>
        )}
      />
    </div>
  );
}
