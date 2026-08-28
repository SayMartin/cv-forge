import type { Metadata } from "next";
import { Suspense } from "react";
import { LanguageToggle } from "@/components/LanguageToggle";

/**
 * Group-level metadata for every auth page. Each route already has its own
 * metadata-only layout for the title (the pages themselves are client
 * components and cannot export `metadata`); those set only `title`, so
 * `robots` set here is inherited by all of them.
 *
 * A sign-in box has no search value and looks careless in a result list, so
 * the whole group is kept out of the index. `follow` stays on: the links out
 * of these pages are worth crawling. Note these routes are deliberately NOT
 * disallowed in robots.txt — a crawler forbidden from fetching a page never
 * reads the tag telling it not to index it.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/*
        These pages are the one part of the app with no navbar, so until now the
        language could not be changed from any of them — which is precisely the
        wrong place to lose it. Someone arriving at a sign-in box in a language
        they do not read has nowhere else to go.

        `fixed`, not a header row: every page in this group is its own
        `min-h-screen` centred card, and putting a bar above one would push the
        card past the viewport and produce a scrollbar on a page that has always
        fitted. Nothing here scrolls, so fixed and absolute look identical.

        `persist` stays false: nobody is signed in yet, so `POST /api/locale`
        would have no account row to write. The cookie is set by `proxy.ts` on
        the navigation the link triggers, which is all that is needed here — and
        `/api/locale/resume` picks the account preference back up on the way out.
      */}
      {/*
        The Suspense boundary is required, not decorative. `LanguageToggle`
        calls `useSearchParams()`, and without a boundary above it `next build`
        fails outright — "useSearchParams() should be wrapped in a suspense
        boundary" — rather than degrading. Each page already wraps its own form
        for the same reason; the toggle sits above those, in the layout, so it
        needs its own.

        The alternative — dropping `useSearchParams` here — is worse than it
        looks. The query string on these pages is load-bearing: `?callbackUrl=`
        on sign-in, `?verified=true`, and above all `?token=` on reset-password.
        Switching language must not discard a password-reset token.

        `null` as the fallback costs nothing today: these routes are rendered on
        demand, so the params are known on the server and the toggle is in the
        HTML. It would only ever be seen if the group became statically
        prerendered — and the toggle is fixed-position, overlaying nothing, so
        even then there is no layout to shift.
      */}
      <div className="fixed top-4 right-4 z-10">
        <Suspense fallback={null}>
          <LanguageToggle tone="light" />
        </Suspense>
      </div>
      {children}
    </>
  );
}
