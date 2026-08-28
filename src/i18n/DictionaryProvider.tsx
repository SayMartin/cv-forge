"use client";

import { createContext, useContext } from "react";
import type { Dictionary } from "./dictionaries";

const DictionaryContext = createContext<Dictionary | null>(null);

/**
 * Makes the active dictionary available to every Client Component.
 *
 * Mounted once in `app/[lang]/layout.tsx`, which is a Server Component, so
 * `children` stay server-rendered — the provider wraps the tree without
 * dragging it across the boundary.
 *
 * A context rather than props: 32 components in this app are `"use client"`,
 * and the string-heavy ones are the worst candidates for drilling. `CvEditor`
 * already takes 27 props and `ContentTabs` fans 9 of them out to seven tabs;
 * threading a dictionary through all of that is a change to every signature in
 * the app for something every one of them needs.
 *
 * The whole dictionary is serialised into the Flight payload of every page.
 * That is cheap now and will grow as later steps add slices. If it ever stops
 * being cheap, the fix is to move the provider down into the route-group
 * layouts and hand each one only the slices its area uses — the `useDictionary`
 * call sites do not change.
 */
export function DictionaryProvider({
  dictionary,
  children,
}: {
  dictionary: Dictionary;
  children: React.ReactNode;
}) {
  return (
    <DictionaryContext value={dictionary}>{children}</DictionaryContext>
  );
}

/**
 * Throws rather than falling back to English when no provider is above it.
 *
 * A silent fallback is the worse failure: the page renders, looks plausible,
 * and shows English text to a Swedish user in exactly the one place someone
 * forgot to wrap — which is precisely the bug nobody reports and nobody finds.
 * There are no tests here, so failing loudly at the first render is the
 * substitute.
 */
export function useDictionary(): Dictionary {
  const dictionary = useContext(DictionaryContext);
  if (!dictionary) {
    throw new Error(
      "useDictionary() was called outside <DictionaryProvider>. It is mounted in app/[lang]/layout.tsx — a component reaching this error is rendering outside that tree.",
    );
  }
  return dictionary;
}
