import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-errors";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { seedKeyByName, type SeedCategoryKey } from "@/lib/skill-category-seed";
import { safeError } from "@/lib/log";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { PDFParse } from "pdf-parse";

const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
import { generateObject } from "ai";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // Gemini PDF extraction can take 60–90 s

// The whole PDF is sent to Gemini as a file, and Google bills document pages as
// tokens (~258 each). A page cap is therefore an upper bound on what one request
// can cost, not an opinion about how long a CV should be — ten lets senior CVs,
// Europass printouts and some academic ones through while still stopping the
// 200-page document that is the only single request able to get expensive.
//
// Note this bounds one call, not the bill: cost is driven by volume, so a
// per-user quota is what actually caps spending. That comes once the usage
// logging below says what the numbers really are.
const MAX_PAGES = 10;
const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10 MB

// ── Zod schema for AI extraction ───────────────────────────────────────────
//
// A function of the user's own category names rather than a module constant,
// because the category list is **user data**: seeded per locale, then renameable,
// reorderable and deletable. Constraining the model to a hardcoded English list
// and then resolving its answer against Swedish rows would leave every imported
// skill uncategorised — silently, since an unmatched name is a `null` categoryId
// rather than an error. That was already true for anyone who renamed a category;
// per-locale seeding would have made it the default for half the users.
function buildCvSchema(categoryNames: string[]) {
  // `z.enum` needs a non-empty tuple, and an account with no categories at all
  // is reachable — they can all be deleted. There the field falls back to a
  // plain optional string, which is a valid JSON Schema where `z.undefined()`
  // is not; the prompt tells the model to omit it, and anything it sends anyway
  // matches no row and resolves to `null`. Uncategorised is the only honest
  // outcome when the user has nowhere to put a skill.
  const category =
    categoryNames.length > 0
      ? z.enum(categoryNames as [string, ...string[]]).optional()
      : z.string().optional();

  return z.object({
  profile: z.object({
    name: z.string(),
    headline: z.string().optional(),
    bio: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    social: z
      .object({
        linkedin: z.string().url().optional(),
        github: z.string().url().optional(),
        website: z.string().url().optional(),
        portfolio: z.string().url().optional(),
      })
      .optional(),
  }),
  experience: z.array(
    z.object({
      company: z.string(),
      role: z.string(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      current: z.boolean().optional(),
      description: z.string().optional(),
      skills: z.array(z.string()).optional(),
    }),
  ),
  education: z.array(
    z.object({
      institution: z.string(),
      degree: z.string().optional(),
      field: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      current: z.boolean().optional(),
      description: z.string().optional(),
    }),
  ),
  skills: z.array(
    z.object({
      name: z.string(),
      category,
      level: z.number().min(1).max(5).optional(),
    }),
  ),
  projects: z.array(
    z.object({
      title: z.string(),
      summary: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      current: z.boolean().optional(),
      url: z.string().url().optional(),
      sourceUrl: z.string().url().optional(),
      skills: z.array(z.string()).optional(),
    }),
  ),
  other: z.array(
    z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      date: z.string().optional(),
      description: z.string().optional(),
      url: z.string().url().optional(),
    }),
  ),
  });
}

type CvExtraction = z.infer<ReturnType<typeof buildCvSchema>>;

// ── The category half of the prompt ────────────────────────────────────────
//
// Built from the user's own rows, and phrased with their own names. The
// disambiguation rules below are the ones that actually change the output —
// without the first, "Python" reliably lands under a spoken-languages heading —
// so they are worth carrying across a rename and across a translation.
//
// Each rule is emitted only if the categories it talks about are still present,
// matched by **seeded key**, never by English name. A category the user invented
// or renamed beyond recognition matches nothing and is simply offered to the
// model on its own merits, which is the correct amount to say about a heading
// only they understand.
type UserCategory = { id: string; name: string; kind: string };

function categoryRules(categories: UserCategory[]): string {
  if (categories.length === 0) {
    return "- The user has no skill categories, so omit `category` on every skill.";
  }

  const byKey = new Map<SeedCategoryKey, string>();
  for (const c of categories) {
    const key = seedKeyByName(c.name);
    if (key && !byKey.has(key)) byKey.set(key, c.name);
  }
  const q = (key: SeedCategoryKey) => {
    const name = byKey.get(key);
    return name ? `"${name}"` : null;
  };

  // The spoken-languages group is found by `kind`, not by name — that column
  // exists precisely so this survives a rename, and it is more reliable here
  // than the key lookup because it holds even for a category renamed to
  // something no locale seeds.
  const languageName = categories.find((c) => c.kind === "language")?.name ?? byKey.get("language");
  const programming = q("programming");
  const backend = q("backend");
  const frontend = q("frontend");
  const tools = q("tools");
  const devops = q("devops");
  const cloud = q("cloud");

  const rules: string[] = [
    `- For skills, pick the most appropriate category from this user's own list, using their exact wording: ${categories
      .map((c) => `"${c.name}"`)
      .join(", ")}. Use only these names; if none fits, omit \`category\`.`,
  ];

  if (languageName) {
    rules.push(
      `- "${languageName}" means spoken/natural languages only (e.g. English, Swedish, German)` +
        (programming
          ? ` — programming languages (e.g. Kotlin, Java, Python, TypeScript) must use ${programming}, never "${languageName}".`
          : `, never programming languages.`),
    );
  }
  if (backend && frontend) {
    rules.push(`- Frameworks and libraries go under ${backend} or ${frontend} by where they run.`);
  }
  if (tools) {
    rules.push(`- Editors, IDEs and ways of working go under ${tools}.`);
  }
  if (devops && cloud) {
    rules.push(
      `- ${devops} and ${cloud} split by tool versus platform: the practice and the tooling you run` +
        ` (e.g. Docker, Kubernetes, Terraform, CI/CD, Ansible, Nginx, Linux, monitoring, self-hosted servers)` +
        ` are ${devops}, while the vendor platform you deploy onto and its managed, serverless or edge products` +
        ` (e.g. AWS, Azure, GCP, Cloudflare Workers, Vercel, CDNs) are ${cloud}.`,
    );
  }

  return rules.join("\n");
}

// ── Helper: title → slug ───────────────────────────────────────────────────
function toSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── POST /api/cv-import ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return apiError("unauthorized", 401);
  }
  const userId = session.user.id;

  // Parse multipart form — expect a single "file" field
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return apiError("invalid_form_data", 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.type !== "application/pdf") {
    return apiError("pdf_required", 400);
  }

  if (file.size > MAX_PDF_SIZE) {
    return apiError("pdf_too_large", 400, { maxMb: MAX_PDF_SIZE / 1024 / 1024 });
  }

  const pdfBuffer = await file.arrayBuffer();

  // Count pages locally, before anything reaches Google. A file rejected here
  // costs nothing at all.
  let pageCount: number;
  const parser = new PDFParse({ data: pdfBuffer });
  try {
    pageCount = (await parser.getInfo()).total;
  } catch (err) {
    console.error("[cv-import] could not read PDF:", safeError(err));
    return apiError("pdf_unreadable", 400);
  } finally {
    // Holds a pdf.js worker; leaking one per request would pile up.
    await parser.destroy().catch(() => {});
  }

  if (pageCount > MAX_PAGES) {
    return apiError("pdf_too_many_pages", 400, { count: pageCount, max: MAX_PAGES });
  }

  // The user's own categories, read once: they constrain the model's `category`
  // enum, they are quoted back to it in the prompt, and they resolve its answer
  // to row ids further down. Reading them here rather than inside the
  // transaction keeps the model call outside the transaction, which matters —
  // Gemini can take 60–90 s.
  const categories = await prisma.skillCategory.findMany({
    where: { userId },
    select: { id: true, name: true, kind: true },
    orderBy: { order: "asc" },
  });
  const CvSchema = buildCvSchema(categories.map((c) => c.name));

  // Extract structured CV data with Gemini
  let cv: CvExtraction;
  try {
    const { object, usage } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: CvSchema,
      prompt: [
        {
          role: "user",
          content: [
            {
              type: "file",
              data: pdfBuffer,
              mediaType: "application/pdf",
            },
            {
              type: "text",
              text: `You are a CV parser. Extract all structured information from the attached PDF and return it as JSON matching the provided schema exactly.

Rules:
- Dates must be in YYYY-MM-DD format (use YYYY-01-01 if only year is given).
- If a position is the current job set current=true and omit endDate.
- Skill levels: 1=beginner, 2=basic, 3=intermediate, 4=advanced, 5=expert. Infer from context.
- Only include URLs that are explicitly present in the document — do not invent them.
- Keep description fields concise (2–4 sentences max).
${categoryRules(categories)}
- For entries that do not clearly fit experience, education, skills, or projects (e.g. certifications, awards, publications, volunteer work, courses), place them in the "other" array with a descriptive title and subtitle (issuer or organisation).
- Projects may optionally have a start/end date or just an end date, using the same date rules as experience — if a project is ongoing set current=true and omit endDate.`,
            },
          ],
        },
      ],
    });
    cv = object;

    // What one import actually costs, per import. Until this exists any figure
    // for a per-user quota is a guess — the quota's number should come from a
    // few weeks of these lines, not from a price list.
    console.log(
      `[cv-import] usage userId=${userId} pages=${pageCount} ` +
        `in=${usage?.inputTokens ?? "?"} out=${usage?.outputTokens ?? "?"} ` +
        `total=${usage?.totalTokens ?? "?"}`,
    );
  } catch (err) {
    console.error("[cv-import] Gemini extraction error:", safeError(err));
    return apiError("extraction_failed", 502);
  }

  // Write to Neon in a single transaction
  try {
    await prisma.$transaction(async (tx) => {
      // Profile — upsert so re-importing doesn't duplicate
      await tx.profile.create({
        data: {
          userId,
          profileName: "Imported",
          name: cv.profile.name,
          headline: cv.profile.headline ?? null,
          bio: cv.profile.bio ?? null,
          email: cv.profile.email ?? null,
          phone: cv.profile.phone ?? null,
          location: cv.profile.location ?? null,
          linkedin: cv.profile.social?.linkedin ?? null,
          github: cv.profile.social?.github ?? null,
          website: cv.profile.social?.website ?? null,
          portfolio: cv.profile.social?.portfolio ?? null,
        },
      });

      // Experience
      if (cv.experience.length) {
        await tx.experience.createMany({
          data: cv.experience.map((exp) => ({
            userId,
            company: exp.company,
            role: exp.role,
            startDate: exp.startDate ?? null,
            endDate: exp.endDate ?? null,
            current: exp.current ?? false,
            description: exp.description ?? null,
            skills: exp.skills ?? [],
          })),
        });
      }

      // Education
      if (cv.education.length) {
        await tx.education.createMany({
          data: cv.education.map((edu) => ({
            userId,
            institution: edu.institution,
            degree: edu.degree ?? null,
            field: edu.field ?? null,
            startDate: edu.startDate ?? null,
            endDate: edu.endDate ?? null,
            current: edu.current ?? false,
            description: edu.description ?? null,
          })),
        });
      }

      // The model was constrained to these very names, so the lookup should
      // always hit. It is still written to tolerate a miss: the categories were
      // read before a call that can take 90 s, and the user may have renamed one
      // in another tab meanwhile. A miss leaves the skill uncategorised rather
      // than failing the whole import.
      if (cv.skills.length) {
        const categoryIdByName = new Map(
          categories.map((c) => [c.name.toLowerCase(), c.id]),
        );

        await tx.skill.createMany({
          data: cv.skills.map((skill, i) => ({
            userId,
            name: skill.name,
            categoryId: skill.category
              ? categoryIdByName.get(skill.category.toLowerCase()) ?? null
              : null,
            level: skill.level ?? null,
            order: i + 1,
          })),
        });
      }

      // Projects — skipDuplicates handles re-imports and duplicate-title collisions
      if (cv.projects.length) {
        const seenSlugs = new Set<string>();
        const projectData = cv.projects.map((proj) => {
          let slug = toSlug(proj.title);
          let n = 1;
          while (seenSlugs.has(slug)) slug = `${toSlug(proj.title)}-${n++}`;
          seenSlugs.add(slug);
          return {
            userId,
            title: proj.title,
            slug,
            summary: proj.summary ?? null,
            startDate: proj.startDate ?? null,
            endDate: proj.endDate ?? null,
            current: proj.current ?? false,
            url: proj.url ?? null,
            sourceUrl: proj.sourceUrl ?? null,
            skills: proj.skills ?? [],
          };
        });
        await tx.project.createMany({ data: projectData, skipDuplicates: true });
      }

      // Other
      if (cv.other.length) {
        await tx.other.createMany({
          data: cv.other.map((item, i) => ({
            userId,
            title: item.title,
            subtitle: item.subtitle ?? null,
            date: item.date ?? null,
            description: item.description ?? null,
            url: item.url ?? null,
            order: i + 1,
          })),
        });
      }
    });
  } catch (err) {
    console.error("[cv-import] Database write error:", safeError(err));
    return apiError("import_save_failed", 502);
  }

  return NextResponse.json({
    ok: true,
    summary: {
      experience: cv.experience.length,
      education: cv.education.length,
      skills: cv.skills.length,
      projects: cv.projects.length,
      other: cv.other.length,
    },
  });
}
