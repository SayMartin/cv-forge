import type { Metadata } from "next";

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
  return <>{children}</>;
}
