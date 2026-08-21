import Link from "next/link";
import { Children, type ReactNode } from "react";

// A trail of places, not a row of buttons. Each child is one segment and the
// separators are drawn between them, so a segment can be plain text, a link, or
// an interactive control such as the CV switcher — the editor needs its title
// and its switcher to be the same element rather than two competing ones.
export function Breadcrumbs({ children }: { children: ReactNode }) {
  const segments = Children.toArray(children);

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-2 min-w-0">
        {segments.map((segment, i) => (
          <li key={i} className="flex items-center gap-2 min-w-0">
            {i > 0 && (
              <span aria-hidden="true" className="text-(--cl-border) select-none">
                /
              </span>
            )}
            {segment}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function CrumbLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm text-(--cl-muted) hover:text-(--cl-text) transition-colors whitespace-nowrap"
    >
      {children}
    </Link>
  );
}

// The page you are on. aria-current tells a screen reader the trail ends here,
// which is the whole reason a breadcrumb beats a lone back arrow.
export function CrumbCurrent({ children }: { children: ReactNode }) {
  return (
    <span aria-current="page" className="text-sm font-medium text-(--cl-text) truncate">
      {children}
    </span>
  );
}
