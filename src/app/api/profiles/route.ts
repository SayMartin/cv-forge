import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/profiles — create a new profile for the current user
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const profileName = String(body.profileName ?? "").trim();
  if (!profileName) {
    return NextResponse.json({ error: "profileName is required" }, { status: 400 });
  }

  const profile = await prisma.profile.create({
    data: {
      userId: session.user.id,
      profileName,
      name: body.name ? String(body.name).trim() : null,
      headline: body.headline || null,
      bio: body.bio || null,
      email: body.email || null,
      phone: body.phone || null,
      location: body.location || null,
      linkedin: body.social?.linkedin || null,
      github: body.social?.github || null,
      website: body.social?.website || null,
      portfolio: body.social?.portfolio || null,
    },
  });

  return NextResponse.json({ id: profile.id });
}
