import { headers } from "next/headers";
import { LocaleLink } from "@/components/LocaleLink";
import { auth } from "@/lib/auth";
import { NavBar } from "./NavBar";
import { BotanicalBackground } from "@/components/BotanicalBackground";
import { getDictionary } from "@/i18n/server";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const { footer } = await getDictionary();
  const user = session
    ? {
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      }
    : null;

  return (
    <div className="flex flex-col min-h-screen">
      <BotanicalBackground />
      <div className="print:hidden">
        <NavBar user={user} />
      </div>
      <div className="flex-1">{children}</div>
      <footer className="bg-(--cl-nav) text-(--cl-nav-text) print:hidden">
        <div className="max-w-5xl mx-auto px-6 py-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-base font-semibold tracking-widest uppercase text-white">
              CV Forge
            </p>
            <p className="text-sm text-(--cl-nav-muted) mt-1">
              {footer.tagline}
            </p>
          </div>
          <div className="flex flex-col sm:items-end gap-1.5">
            <p className="text-sm text-(--cl-nav-muted)">
              &copy; {new Date().getFullYear()} Martin Persson &middot;{" "}
              <a
                href="https://appfinningar.se"
                className="underline underline-offset-2 hover:text-white transition-colors"
              >
                appfinningar.se
              </a>
            </p>
            <LocaleLink
              href="/privacy"
              className="text-sm text-(--cl-nav-muted) hover:text-white transition-colors"
            >
              {footer.privacy}
            </LocaleLink>
          </div>
        </div>
      </footer>
    </div>
  );
}
