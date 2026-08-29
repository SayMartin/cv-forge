import type { Metadata } from "next";
import { metaDictionary } from "@/lib/seo";
import { headers } from "next/headers";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/cvs">): Promise<Metadata> {
  return { title: metaDictionary((await params).lang).meta.cvs };
}
import { redirect } from "next/navigation";
import { INTL_LOCALES } from "@/i18n/config";
import { format } from "@/i18n/format";
import { getDictionary, getLocale, localePath } from "@/i18n/server";
import { LocaleLink } from "@/components/LocaleLink";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateCvForm } from "./CreateCvForm";
import { DuplicateCvButton } from "./DuplicateCvButton";

export default async function CvsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect(await localePath("/sign-in?callbackUrl=/cvs"));

  const items = await prisma.cV.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, targetRole: true, updatedAt: true },
  });

  const locale = await getLocale();
  const { cvs } = await getDictionary();

  // This date is *UI*, not CV content — it is when the row was last touched, so
  // it follows the language the reader is browsing in. The CV's own dates are a
  // separate question answered by `Cv.language` in a later step.
  const formatDate = new Intl.DateTimeFormat(INTL_LOCALES[locale], {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <main className="py-12">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-(--cl-text)">
            {cvs.title}
          </h1>
          <p className="text-sm text-(--cl-muted) mt-1">{cvs.subtitle}</p>
        </div>

        <CreateCvForm />

        {items.length === 0 ? (
          <p className="text-sm text-(--cl-muted)">{cvs.empty}</p>
        ) : (
          <ul className="space-y-3">
            {items.map((cv) => (
              <li key={cv.id} className="flex items-center gap-2">
                <LocaleLink
                  href={`/cvs/${cv.id}`}
                  className="flex-1 flex items-center justify-between bg-white border border-(--cl-border) rounded-xl px-5 py-4 hover:border-(--cl-accent) transition-colors group"
                >
                  <div>
                    <span className="font-medium text-(--cl-text) group-hover:underline">
                      {cv.name}
                    </span>
                    {cv.targetRole && (
                      <p className="text-sm text-(--cl-muted) mt-0.5">{cv.targetRole}</p>
                    )}
                  </div>
                  <span className="text-sm text-(--cl-muted) shrink-0">
                    {format(cvs.updated, {
                      date: formatDate.format(cv.updatedAt),
                    })}
                  </span>
                </LocaleLink>
                <DuplicateCvButton cvId={cv.id} cvName={cv.name} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
