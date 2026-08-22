import type { Metadata } from "next";
import { headers } from "next/headers";

export const metadata: Metadata = { title: "My CVs" };
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateCvForm } from "./CreateCvForm";
import { DuplicateCvButton } from "./DuplicateCvButton";

export default async function CvsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in?callbackUrl=/cvs");

  const cvs = await prisma.cV.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, targetRole: true, updatedAt: true },
  });

  return (
    <main className="py-12">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-(--cl-text)">
            My CVs
          </h1>
          <p className="text-sm text-(--cl-muted) mt-1">
            Each CV is a named selection of your saved entries.
          </p>
        </div>

        <CreateCvForm />

        {cvs.length === 0 ? (
          <p className="text-sm text-(--cl-muted)">
            No CVs yet — create one above.
          </p>
        ) : (
          <ul className="space-y-3">
            {cvs.map((cv) => (
              <li key={cv.id} className="flex items-center gap-2">
                <Link
                  href={`/cvs/${cv.id}`}
                  className="flex-1 flex items-center justify-between bg-white border border-(--cl-border) rounded-xl px-5 py-4 hover:border-(--cl-accent) transition-colors group"
                >
                  <div>
                    <span className="font-medium text-(--cl-text) group-hover:underline">
                      {cv.name}
                    </span>
                    {cv.targetRole && (
                      <p className="text-xs text-(--cl-muted) mt-0.5">{cv.targetRole}</p>
                    )}
                  </div>
                  <span className="text-xs text-(--cl-muted) shrink-0">
                    Updated{" "}
                    {new Date(cv.updatedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </Link>
                <DuplicateCvButton cvId={cv.id} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
