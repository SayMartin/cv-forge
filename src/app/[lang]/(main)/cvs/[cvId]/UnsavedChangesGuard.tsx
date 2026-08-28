"use client";

import { useEffect } from "react";

/**
 * For navigation that does not go through a link — a select, a router.push.
 *
 * Takes the message rather than owning it: this file is a pair of listeners
 * with no dictionary of its own, and the caller that knows about the unsaved
 * CV is also the one holding the strings. Passing it in also keeps the hook and
 * this function saying the same thing, since both are handed the same key.
 */
export function confirmLeave(message: string) {
  return confirm(message);
}

/**
 * Warns before leaving a CV with unsaved edits.
 *
 * Two nets are needed. `beforeunload` covers reloads, closing the tab and links
 * out of the app, but Next's client router never fires it — an in-app link would
 * swap the page out silently. So links are caught during the capture phase,
 * before the router's own handler sees the click, which is the only point where
 * the navigation can still be stopped.
 *
 * `message` reaches only the capture-phase prompt. Browsers stopped letting a
 * page word the `beforeunload` dialog years ago and show their own text, already
 * in the user's language — which is why nothing is passed to it below.
 */
export function useUnsavedChangesWarning(dirty: boolean, message: string) {
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

      if (!confirmLeave(message)) {
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
    // `message` is read inside the listener, so a language switch has to
    // re-register it — the toggle is an anchor, and this guard is what stops it.
  }, [dirty, message]);
}
