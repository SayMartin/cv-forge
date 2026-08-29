"use client";

import { Fragment, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { format } from "@/i18n/format";
import type { PageBlock } from "./types";

const PAGE_HEIGHT_MM = 297;
const DEFAULT_FOOTER_CLASSNAME =
  "absolute bottom-3 inset-x-0 text-center text-xs text-zinc-400 pointer-events-none select-none";

type PaginatedProps = {
  /** Page width, e.g. "210mm". Do not put width/height/display/position in pageClassName — Paginated owns those. */
  width?: string;
  /**
   * Full page-width content, page 1 only, rendered ABOVE the sidebar/main row
   * (e.g. a header bar that spans both columns). Rare — most layouts should
   * use `header` instead, which sits inside the main column.
   */
  topHeader?: ReactNode;
  /** Rendered only on page 1, inside the main column, above the blocks. Counted against the page-1 height budget. */
  header?: ReactNode;
  /** Atomic content units to distribute across as many pages as they need. Never split across a page boundary. */
  blocks: PageBlock[];
  /** Visual-only classes: border, shadow, background, padding, text size/color. */
  pageClassName: string;
  /**
   * The page footer, as a `format()` template with `{page}` and `{pages}`.
   *
   * A prop rather than an import, and **required** rather than defaulted to the
   * English wording. This is the one client file in the CV renderer, so
   * importing `cv-strings.ts` here would pull every language of every heading
   * into the browser bundle to produce one line. And a default would be an
   * English string that silently survives a layout forgetting to pass its own —
   * required makes that a compile error at all six call sites.
   */
  pageLabel: string;
  /** Classes for the "Page X of Y" footer. Defaults to the shared style used by every layout today. */
  footerClassName?: string;
  /**
   * Sidebar-family layouts only: content rendered unpaginated, identically, on every page —
   * pre-rendered as plain JSX (not a function) since a Server Component layout can only pass
   * JSX/plain data across into this Client Component, never callbacks.
   */
  sidebarFirst?: ReactNode;
  sidebarRest?: ReactNode;
  sidebarClassName?: string;
  sidebarStyle?: CSSProperties;
  /** Sidebar-family layouts only: wrapper classes for the main (paginated) column. */
  mainClassName?: string;
};

export function Paginated({
  width = "210mm",
  topHeader,
  header,
  blocks,
  pageClassName,
  pageLabel,
  footerClassName = DEFAULT_FOOTER_CLASSNAME,
  sidebarFirst,
  sidebarRest,
  sidebarClassName,
  sidebarStyle,
  mainClassName,
}: PaginatedProps) {
  const hasSidebar = sidebarFirst !== undefined || sidebarRest !== undefined;
  const hasTopHeader = topHeader !== undefined;
  const [pages, setPages] = useState<PageBlock[][] | null>(null);
  // Gates the hidden probe. Must start `false` on both server and the
  // client's first render (they must match to avoid a hydration mismatch),
  // then flip `true` only after mount, once safely past hydration.
  const [mounted, setMounted] = useState(false);
  const blockRefs = useRef(new Map<string, HTMLDivElement | null>());
  const budgetFirstRef = useRef<HTMLDivElement | null>(null);
  const budgetRestRef = useRef<HTMLDivElement | null>(null);

  const blocksKey = blocks.map((b) => b.id).join("|");

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!mounted) return;
    const budgetFirst = budgetFirstRef.current?.clientHeight ?? 0;
    const budgetRest = budgetRestRef.current?.clientHeight ?? budgetFirst;

    const result: PageBlock[][] = [[]];
    let budget = budgetFirst;
    let used = 0;

    for (const block of blocks) {
      const height = blockRefs.current.get(block.id)?.getBoundingClientRect().height ?? 0;
      const currentPage = result[result.length - 1];
      const isFirstOnPage = currentPage.length === 0;
      // Never split a block: only start a new page between blocks, and only
      // once the current page already has something on it.
      if (!isFirstOnPage && used + height > budget) {
        result.push([]);
        budget = budgetRest;
        used = 0;
      }
      result[result.length - 1].push(block);
      used += height;
    }

    setPages(result);
    // Re-measure whenever the actual set of blocks changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, blocksKey]);

  // sidebarFirst appears on page 1, sidebarRest only on page 2 — never
  // repeated further, so it doesn't look duplicated on CVs long enough to
  // spill onto a 3rd+ page.
  function renderSidebar(pageIndex: number) {
    if (!hasSidebar) return null;
    const content = pageIndex === 0 ? sidebarFirst : pageIndex === 1 ? sidebarRest : null;
    return (
      <aside style={sidebarStyle} className={sidebarClassName}>
        {content}
      </aside>
    );
  }

  function renderMain(isFirstPage: boolean, content: ReactNode) {
    const inner = (
      <>
        {isFirstPage && header}
        {content}
      </>
    );
    return hasSidebar ? <div className={mainClassName}>{inner}</div> : inner;
  }

  function renderFooter(page: number, pageCount: number) {
    return (
      <div className={footerClassName}>
        {format(pageLabel, { page, pages: pageCount })}
      </div>
    );
  }

  // The sidebar/main row's own direction. When there's a `topHeader`, this row
  // is nested one level deeper (below the full-width header) instead of being
  // the page's direct flex children.
  const rowDirection = hasSidebar ? "row" : "column";
  const outerDirection = hasTopHeader ? "column" : rowDirection;

  function pageInner(pageIndex: number, mainContent: ReactNode) {
    const isFirstPage = pageIndex === 0;
    const row = (
      <>
        {renderSidebar(pageIndex)}
        {renderMain(isFirstPage, mainContent)}
      </>
    );
    if (!hasTopHeader) return row;
    return (
      <>
        {isFirstPage && topHeader}
        <div style={{ display: "flex", flexDirection: rowDirection, flex: 1, minHeight: 0 }}>{row}</div>
      </>
    );
  }

  // Hidden, portaled measurement pass — must escape any ancestor CSS
  // `transform` (e.g. the on-screen scale-to-fit wrapper), since a transformed
  // ancestor becomes the containing block for `position: fixed` descendants
  // and would otherwise scale our measurements.
  const probe =
    mounted && pages === null && typeof document !== "undefined"
      ? createPortal(
          <div style={{ position: "fixed", top: 0, left: -99999, visibility: "hidden", pointerEvents: "none" }} aria-hidden>
            {/* Page-1 budget: how much vertical room is left after the header */}
            <div className={pageClassName} style={{ width, height: `${PAGE_HEIGHT_MM}mm`, display: "flex", flexDirection: outerDirection }}>
              {pageInner(
                0,
                <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }} className={hasSidebar ? mainClassName : undefined}>
                  <div ref={budgetFirstRef} style={{ flex: 1, minHeight: 0 }} />
                </div>,
              )}
            </div>
            {/* Rest-page budget: full page, no header */}
            <div className={pageClassName} style={{ width, height: `${PAGE_HEIGHT_MM}mm`, display: "flex", flexDirection: outerDirection }}>
              {pageInner(
                1,
                <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }} className={hasSidebar ? mainClassName : undefined}>
                  <div ref={budgetRestRef} style={{ flex: 1, minHeight: 0 }} />
                </div>,
              )}
            </div>
            {/* Block heights, measured at the true column width */}
            <div className={pageClassName} style={{ width, height: "auto", display: "flex", flexDirection: outerDirection }}>
              {pageInner(
                1,
                <div className={hasSidebar ? mainClassName : undefined}>
                  {blocks.map((b) => (
                    <div
                      key={b.id}
                      ref={(el) => {
                        blockRefs.current.set(b.id, el);
                      }}
                      style={{ display: "flow-root" }}
                    >
                      {b.node}
                    </div>
                  ))}
                </div>,
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  if (pages === null) {
    // Fallback shown only until the layout effect above resolves — never
    // visible in a printed/exported PDF, since printing always happens well
    // after hydration + measurement.
    return (
      <div style={{ width }} className="mx-auto">
        {probe}
        <div className={`relative ${pageClassName}`} style={{ width, display: "flex", flexDirection: outerDirection }}>
          {pageInner(
            0,
            blocks.map((b) => <Fragment key={b.id}>{b.node}</Fragment>),
          )}
          {renderFooter(1, 1)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width }} className="mx-auto">
      {pages.map((pageBlocks, i) => (
        <Fragment key={i}>
          <div
            className={`relative ${pageClassName} ${i > 0 ? "print:break-before-page" : ""}`}
            style={{ width, height: `${PAGE_HEIGHT_MM}mm`, display: "flex", flexDirection: outerDirection }}
          >
            {pageInner(
              i,
              pageBlocks.map((b) => <Fragment key={b.id}>{b.node}</Fragment>),
            )}
            {renderFooter(i + 1, pages.length)}
          </div>
          {i < pages.length - 1 && (
            <div className="print:hidden h-7 bg-gray-200 flex items-center justify-center">
              <span className="text-xs font-medium tracking-widest uppercase text-gray-400">Page {i + 2}</span>
            </div>
          )}
        </Fragment>
      ))}
    </div>
  );
}
