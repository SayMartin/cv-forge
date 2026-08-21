"use client";

import { useEffect } from "react";

const MESSAGE = "This CV has unsaved changes. Leave without saving?";

/** For navigation that does not go through a link — a select, a router.push. */
export function confirmLeave() {
  return confirm(MESSAGE);
}

/**
 * Warns before leaving a CV with unsaved edits.
 *
 * Two nets are needed. `beforeunload` covers reloads, closing the tab and links
 * out of the app, but Next's client router never fires it — an in-app link would
 * swap the page out silently. So links are caught during the capture phase,
 * before the router's own handler sees the click, which is the only point where
 * the navigation can still be stopped.
 */
export function useUnsavedChangesWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;

    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      // Browsers show their own wording; the assignment is what arms the prompt.
      event.returnValue = "";
    }

    function onClick(event: MouseEvent) {
      // Leave modified clicks alone: they open a new tab, so this page stays put
      // and nothing is at risk.
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = (event.target as HTMLElement | null)?.closest?.("a");
      const href = anchor?.getAttribute("href");
      if (!anchor || !href || href.startsWith("#") || anchor.target === "_blank") return;
      if (href === window.location.pathname + window.location.search) return;

      if (!confirmLeave()) {
        event.preventDefault();
        event.stopPropagation();
      }
    }

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);
}
