import type { Metadata } from "next";
import { headers } from "next/headers";
import { LocaleLink } from "@/components/LocaleLink";

export const metadata: Metadata = { title: "Account Settings" };
import { redirect } from "next/navigation";
import { RichText } from "@/i18n/format";
import { getDictionary, localePath } from "@/i18n/server";
import { auth } from "@/lib/auth";
import { DeleteAccountSection } from "./DeleteAccountSection";
import { LanguageSection } from "./LanguageSection";
import { SignOutButton } from "@/app/[lang]/(main)/SignOutButton";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect(await localePath("/sign-in"));

  const { name, email } = session.user;
  const { settings } = await getDictionary();

  return (
    <main className="max-w-3xl mx-auto px-4 py-12 space-y-10">
      <h1 className="text-2xl font-bold tracking-tight text-(--cl-text)">
        {settings.title}
      </h1>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-(--cl-muted)">
          {settings.account.heading}
        </h2>
        <div className="bg-white rounded-xl border border-(--cl-border) p-5 text-sm space-y-3">
          <div className="space-y-1">
            <p className="font-medium text-(--cl-text)">{name}</p>
            <p className="text-(--cl-muted)">{email}</p>
          </div>
          <div className="border-t border-(--cl-border) pt-3">
            <SignOutButton variant="page" />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-(--cl-muted)">
          {settings.language.title}
        </h2>
        <LanguageSection />
      </section>

      {/* Directly above the delete button on purpose: this is the moment
          someone wants to know what deleting actually removes. */}
      <p className="text-sm text-(--cl-muted)">
        <RichText
          template={settings.privacyNotice}
          values={{
            privacyPolicy: (
              <LocaleLink
                href="/privacy"
                className="text-(--cl-accent) underline underline-offset-2"
              >
                {settings.privacyPolicy}
              </LocaleLink>
            ),
          }}
        />
      </p>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-red-500">
          {settings.dangerZone}
        </h2>
        <DeleteAccountSection email={email} />
      </section>
    </main>
  );
}
