"use client";

import { Fragment, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { PageBlock } from "./types";

const PAGE_HEIGHT_MM = 297;

type PaginatedProps = {
  /** Page width, e.g. "210mm". Do not put width/height/display/position in pageClassName — Paginated owns those. */
  width?: string;
  /** Rendered only on page 1, above the blocks. Counted against the page-1 height budget. */
  header?: ReactNode;
  /** Atomic content units to distribute across as many pages as they need. Never split across a page boundary. */
  blocks: PageBlock[];
  /** Visual-only classes: border, shadow, background, padding, text size/color. */
  pageClassName: string;
  renderFooter: (page: number, pageCount: number) => ReactNode;
  /** Sidebar-family layouts only: rendered unpaginated, identically, on every page. */
  sidebar?: (isFirstPage: boolean) => ReactNode;
  sidebarClassName?: string;
  sidebarStyle?: CSSProperties;
  /** Sidebar-family layouts only: wrapper classes for the main (paginated) column. */
  mainClassName?: string;
};

export function Paginated({
  width = "210mm",
  header,
  blocks,
  pageClassName,
  renderFooter,
  sidebar,
  sidebarClassName,
  sidebarStyle,
  mainClassName,
}: PaginatedProps) {
  const [pages, setPages] = useState<PageBlock[][] | null>(null);
  const blockRefs = useRef(new Map<string, HTMLDivElement | null>());
  const budgetFirstRef = useRef<HTMLDivElement | null>(null);
  const budgetRestRef = useRef<HTMLDivElement | null>(null);

  const blocksKey = blocks.map((b) => b.id).join("|");

  useLayoutEffect(() => {
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
  }, [blocksKey]);

  function renderMain(isFirstPage: boolean, content: ReactNode) {
    const inner = (
      <>
        {isFirstPage && header}
        {content}
      </>
    );
    return sidebar ? <div className={mainClassName}>{inner}</div> : inner;
  }

  const flexDirection = sidebar ? "row" : "column";

  // Hidden, portaled measurement pass — must escape any ancestor CSS
  // `transform` (e.g. the on-screen scale-to-fit wrapper), since a transformed
  // ancestor becomes the containing block for `position: fixed` descendants
  // and would otherwise scale our measurements.
  const probe =
    pages === null && typeof document !== "undefined"
      ? createPortal(
          <div style={{ position: "fixed", top: 0, left: -99999, visibility: "hidden", pointerEvents: "none" }} aria-hidden>
            {/* Page-1 budget: how much vertical room is left after the header */}
            <div className={pageClassName} style={{ width, height: `${PAGE_HEIGHT_MM}mm`, display: "flex", flexDirection }}>
              {sidebar && <aside style={sidebarStyle} className={sidebarClassName}>{sidebar(true)}</aside>}
              <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }} className={sidebar ? mainClassName : undefined}>
                {header}
                <div ref={budgetFirstRef} style={{ flex: 1, minHeight: 0 }} />
              </div>
            </div>
            {/* Rest-page budget: full page, no header */}
            <div className={pageClassName} style={{ width, height: `${PAGE_HEIGHT_MM}mm`, display: "flex", flexDirection }}>
              {sidebar && <aside style={sidebarStyle} className={sidebarClassName}>{sidebar(false)}</aside>}
              <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }} className={sidebar ? mainClassName : undefined}>
                <div ref={budgetRestRef} style={{ flex: 1, minHeight: 0 }} />
              </div>
            </div>
            {/* Block heights, measured at the true column width */}
            <div className={pageClassName} style={{ width, height: "auto", display: "flex", flexDirection }}>
              {sidebar && <aside style={sidebarStyle} className={sidebarClassName}>{sidebar(false)}</aside>}
              <div className={sidebar ? mainClassName : undefined}>
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
              </div>
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
        <div className={`relative ${pageClassName}`} style={{ width, display: "flex", flexDirection }}>
          {sidebar && <aside style={sidebarStyle} className={sidebarClassName}>{sidebar(true)}</aside>}
          {renderMain(
            true,
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
            style={{ width, height: `${PAGE_HEIGHT_MM}mm`, display: "flex", flexDirection }}
          >
            {sidebar && <aside style={sidebarStyle} className={sidebarClassName}>{sidebar(i === 0)}</aside>}
            {renderMain(
              i === 0,
              pageBlocks.map((b) => <Fragment key={b.id}>{b.node}</Fragment>),
            )}
            {renderFooter(i + 1, pages.length)}
          </div>
          {i < pages.length - 1 && (
            <div className="print:hidden h-7 bg-gray-200 flex items-center justify-center">
              <span className="text-[9px] font-medium tracking-widest uppercase text-gray-400">Page {i + 2}</span>
            </div>
          )}
        </Fragment>
      ))}
    </div>
  );
}
