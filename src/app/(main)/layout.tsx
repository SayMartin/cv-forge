import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { NavBar } from "./NavBar";
import { BotanicalBackground } from "@/components/BotanicalBackground";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
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
        <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-base font-semibold tracking-widest uppercase text-white">
              CV Forge
            </p>
            <p className="text-sm text-(--cl-nav-muted) mt-1">
              Craft modern CVs with ease. Your career, your story, beautifully told.
            </p>
          </div>
          <div className="flex flex-col sm:items-end gap-1.5">
            <p className="text-sm text-(--cl-nav-muted)">
              &copy; {new Date().getFullYear()} CV Forge by Appfinningar.se. All rights reserved.
            </p>
            <a
              href="mailto:support@appfinningar.se"
              className="flex items-center gap-1.5 text-sm text-(--cl-nav-muted) hover:text-white transition-colors"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0" aria-hidden="true">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              support@appfinningar.se
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
