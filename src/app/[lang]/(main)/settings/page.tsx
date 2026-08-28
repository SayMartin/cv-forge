import type { Metadata } from "next";
import { headers } from "next/headers";
import { LocaleLink } from "@/components/LocaleLink";

export const metadata: Metadata = { title: "Account Settings" };
import { redirect } from "next/navigation";
import { localePath } from "@/i18n/server";
import { auth } from "@/lib/auth";
import { DeleteAccountSection } from "./DeleteAccountSection";
import { SignOutButton } from "@/app/[lang]/(main)/SignOutButton";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect(await localePath("/sign-in"));

  const { name, email } = session.user;

  return (
    <main className="max-w-3xl mx-auto px-4 py-12 space-y-10">
      <h1 className="text-2xl font-bold tracking-tight text-(--cl-text)">
        Account settings
      </h1>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-(--cl-muted)">
          Your account
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

      {/* Directly above the delete button on purpose: this is the moment
          someone wants to know what deleting actually removes. */}
      <p className="text-sm text-(--cl-muted)">
        What is stored about you, who else can reach it, and exactly what deleting your account
        removes is described in the{" "}
        <LocaleLink href="/privacy" className="text-(--cl-accent) underline underline-offset-2">
          privacy policy
        </LocaleLink>
        .
      </p>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-red-500">
          Danger zone
        </h2>
        <DeleteAccountSection email={email} />
      </section>
    </main>
  );
}
