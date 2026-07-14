import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
import { generateObject } from "ai";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // Gemini PDF extraction can take 60–90 s

// ── Zod schema for AI extraction ───────────────────────────────────────────
const CvSchema = z.object({
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
      category: z
        .enum(["Language", "Framework", "Tool", "Platform", "Other"])
        .optional(),
      level: z.number().min(1).max(5).optional(),
    }),
  ),
  projects: z.array(
    z.object({
      title: z.string(),
      summary: z.string().optional(),
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // Parse multipart form — expect a single "file" field
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "A PDF file is required" },
      { status: 400 },
    );
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File too large (max 10 MB)" },
      { status: 400 },
    );
  }

  const pdfBuffer = await file.arrayBuffer();

  // Extract structured CV data with Gemini
  let cv: z.infer<typeof CvSchema>;
  try {
    const { object } = await generateObject({
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
- For skills, pick the most appropriate category: Language, Framework, Tool, Platform, Other.
- For entries that do not clearly fit experience, education, skills, or projects (e.g. certifications, awards, publications, volunteer work, courses), place them in the "other" array with a descriptive title and subtitle (issuer or organisation).`,
            },
          ],
        },
      ],
    });
    cv = object;
  } catch (err) {
    console.error("Gemini extraction error:", err);
    return NextResponse.json(
      { error: "AI extraction failed" },
      { status: 502 },
    );
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

      // Skills
      if (cv.skills.length) {
        await tx.skill.createMany({
          data: cv.skills.map((skill, i) => ({
            userId,
            name: skill.name,
            category: skill.category ?? null,
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
    console.error("Database write error:", err);
    return NextResponse.json(
      { error: "Failed to save imported content" },
      { status: 502 },
    );
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
