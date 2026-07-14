export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateProfileForm } from "./CreateProfileForm";

export const metadata: Metadata = { title: "Profiles" };

export default async function ProfilesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in?callbackUrl=/profiles");

  const profiles = await prisma.profile.findMany({
    where: { userId: session.user.id },
    orderBy: { profileName: "asc" },
  });

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-(--cl-text)">Profiles</h1>
          <p className="text-sm text-(--cl-muted) mt-1">
            Each profile is a persona you can attach to a CV.
          </p>
        </div>

        <CreateProfileForm />

        {profiles.length === 0 ? (
          <p className="text-sm text-(--cl-muted)">No profiles yet — create one above.</p>
        ) : (
          <ul className="space-y-3">
            {profiles.map((p) => (
              <li key={p.id}>
                <a
                  href="/content?tab=profiles"
                  className="flex items-center justify-between bg-white border border-(--cl-border) rounded-xl px-5 py-4 hover:border-(--cl-accent) transition-colors group"
                >
                  <div>
                    <p className="font-medium text-(--cl-text) group-hover:underline">
                      {p.profileName || <span className="text-(--cl-muted) italic">Unnamed profile</span>}
                    </p>
                    {p.name && (
                      <p className="text-xs text-(--cl-muted) mt-0.5">
                        {p.name}{p.headline ? ` — ${p.headline}` : ""}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-(--cl-muted)">Edit in Content →</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
