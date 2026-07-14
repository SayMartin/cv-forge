import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { blobPut, blobDelete } from "@/lib/r2";

export const dynamic = "force-dynamic";

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

// GET /api/avatars → { images: string[] }
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const doc = await prisma.avatar.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json({ images: doc?.images ?? [] });
}

// POST /api/avatars — multipart upload; adds one image
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A file is required" }, { status: 400 });
  }

  const mimeType = file.type.split(";")[0].trim();
  if (!ALLOWED_TYPES.has(mimeType)) {
    return NextResponse.json({ error: "Only JPEG, PNG, and WebP images are supported" }, { status: 415 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400 });
  }

  // Check current count
  const existing = await prisma.avatar.findUnique({ where: { userId } });
  if (existing && existing.images.length >= MAX_IMAGES) {
    return NextResponse.json(
      { error: `Maximum of ${MAX_IMAGES} photos allowed` },
      { status: 400 },
    );
  }

  const ext = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  const key = `avatars/${userId}/${Date.now()}.${ext}`;
  const buffer = await file.arrayBuffer();

  let url: string;
  try {
    url = await blobPut(key, buffer, { contentType: mimeType });
  } catch (err) {
    console.error("[avatars] blobPut failed:", err);
    return NextResponse.json(
      { error: "Failed to upload image", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }

  let updated: Awaited<ReturnType<typeof prisma.avatar.upsert>>;
  try {
    updated = await prisma.avatar.upsert({
      where: { userId },
      create: { userId, images: [url] },
      update: { images: { push: url } },
    });
  } catch (err) {
    console.error("[avatars] prisma upsert failed:", err);
    return NextResponse.json(
      { error: "Failed to save image record", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }

  return NextResponse.json({ images: updated.images }, { status: 201 });
}

// PATCH /api/avatars { remove: url } — removes one image
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const body = await req.json().catch(() => null);
  const url = body?.remove;
  if (typeof url !== "string" || !url) {
    return NextResponse.json({ error: "Missing 'remove' URL" }, { status: 400 });
  }

  const doc = await prisma.avatar.findUnique({ where: { userId } });
  if (!doc || !doc.images.includes(url)) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  const newImages = doc.images.filter((u) => u !== url);

  const [updated] = await Promise.all([
    prisma.avatar.update({ where: { userId }, data: { images: newImages } }),
    blobDelete(url).catch(() => {}), // best-effort blob deletion
  ]);

  return NextResponse.json({ images: updated.images });
}
