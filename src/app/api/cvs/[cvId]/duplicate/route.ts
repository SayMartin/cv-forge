import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-errors";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { DEFAULT_SECTION_ORDER } from "@/lib/cv-layouts";
import { MAX_CV_NAME } from "@/lib/cv-content-types";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ cvId: string }> };

// POST /api/cvs/[cvId]/duplicate — copy a CV and return the new one
export async function POST(req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return apiError("unauthorized", 401);

  const { cvId } = await params;
  const source = await prisma.cV.findUnique({ where: { id: cvId } });

  if (!source || source.userId !== session.user.id) {
    return apiError("not_found", 404);
  }

  // The copy's name is composed by the *client*, because this handler cannot be:
  // a Route Handler has no access to `next/root-params`, so it cannot know
  // whether the reader is looking at "Copy of …" or "Kopia av …". Same
  // constraint that put `dict.errors` on the client side.
  //
  // Validated rather than trusted, and with a fallback rather than a rejection:
  // the body is optional, so a direct `curl` and any client from before this
  // change still work and simply get the English default. `MAX_CV_NAME` matches
  // what the create and patch routes enforce.
  let requestedName: string | undefined;
  try {
    const body: unknown = await req.json();
    if (body && typeof body === "object") {
      const { name } = body as { name?: unknown };
      if (typeof name === "string" && name.trim()) {
        requestedName = name.trim().slice(0, MAX_CV_NAME);
      }
    }
  } catch {
    // No body, or not JSON. Neither is an error here — the name is optional.
  }

  // **Everything is copied except what identifies the row.**
  //
  // This used to be an allowlist naming each field to carry over, and it had
  // silently fallen four fields behind the schema: `chronological`,
  // `targetRole`, `coverLetter` and `skillGroups` were all missing, so a
  // duplicated CV lost its timeline mode, its target role, its whole cover
  // letter, and the entire per-CV skills arrangement — the one thing that takes
  // real work to rebuild. Nothing failed; the copy just came back emptier.
  //
  // Inverting it fixes the class of bug rather than the four instances. A
  // "duplicate" that has to be told about each new column falls behind again the
  // next time one is added; one that copies by default only needs telling what to
  // leave out. That list is not permanently closed — a future column that must
  // not be inherited, a share token say, gets an `undefined` here — but "does
  // this need excluding?" is a question you ask once about one new field, where
  // "did I remember to add it?" is a question nobody thinks to ask at all.
  const copy = await prisma.cV.create({
    data: {
      ...source,

      // Explicitly not inherited. `undefined` is Prisma's "not provided", so
      // each falls through to its own default — a fresh cuid and fresh
      // timestamps. Written here rather than destructured away above so the
      // exclusions sit next to the copy they are exclusions from.
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,

      name: requestedName ?? `Copy of ${source.name}`,

      // Prisma types a nullable Json column differently on the way in than on
      // the way out: reading gives `null`, writing wants `Prisma.DbNull` to mean
      // SQL NULL. The read value does not type-check on write.
      skillGroups: source.skillGroups ?? Prisma.DbNull,

      // The one field not copied verbatim: a row predating the `sectionOrder`
      // migration can hold an empty array, and a copy is a good moment to give
      // it the default rather than inherit the gap.
      sectionOrder: source.sectionOrder.length ? source.sectionOrder : DEFAULT_SECTION_ORDER,
    },
  });

  return NextResponse.json(copy, { status: 201 });
}
