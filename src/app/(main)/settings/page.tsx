import type { Metadata } from "next";
import { headers } from "next/headers";

export const metadata: Metadata = { title: "Account Settings" };
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DeleteAccountSection } from "./DeleteAccountSection";
import { SignOutButton } from "@/app/(main)/SignOutButton";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const { name, email } = session.user;

  return (
    <main className="max-w-lg mx-auto px-6 py-12 space-y-10">
      <h1 className="text-2xl font-bold tracking-tight text-(--cl-text)">
        Account settings
      </h1>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-(--cl-muted)">
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

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-red-500">
          Danger zone
        </h2>
        <DeleteAccountSection email={email} />
      </section>
    </main>
  );
}
