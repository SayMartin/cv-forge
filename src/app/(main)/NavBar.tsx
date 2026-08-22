"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "./SignOutButton";
import { Logo } from "@/components/Logo";

type User = { name: string; email: string; role?: string | null };

// The current section, marked in both the desktop row and the mobile drawer.
//
// The marker is `--cl-nav-muted` olive, not `--cl-accent`: the accent (#2d5a1b)
// is darker than the nav itself (#1b2f0e) and would be invisible there. Colour
// alone would not carry it either — links are cream and go white on hover, so
// "active = white" is both too small a step to notice and indistinguishable from
// a hover. Hence a marker bar plus the weight change.
//
// The inactive state keeps a transparent border of the same width so nothing
// shifts when the marker appears.
function NavLink({
  href,
  onClick,
  drawer = false,
  children,
}: {
  href: string;
  onClick?: () => void;
  drawer?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Prefix match so /cvs stays marked while editing or previewing a CV
  // (/cvs/<id>, /cvs/<id>/view), which are that section, not separate places.
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`text-sm transition-colors ${drawer ? "border-l-2 pl-3" : "border-b-2 py-0.5"} ${
        active
          ? "border-(--cl-nav-muted) text-white font-medium"
          : "border-transparent text-(--cl-nav-text) hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}

export function NavBar({ user }: { user: User | null }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="bg-(--cl-nav)">
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <nav className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
        <Link
          href="/"
          onClick={close}
          className="flex items-center gap-2 text-(--cl-nav-text) hover:text-white transition-colors"
        >
          <Logo size={26} />
          <span className="font-semibold text-sm tracking-widest uppercase">
            CV Forge
          </span>
        </Link>

        {/* Desktop links */}
        {user ? (
          <div className="hidden sm:flex items-center gap-5">
            <NavLink href="/cvs">My CVs</NavLink>
            <NavLink href="/content">My Content</NavLink>
            <NavLink href="/import">Import PDF</NavLink>
            {/* Drawn, not a "|" glyph: the character's thickness belongs to the
                font and cannot be widened. 2px against the 14px nav text, and
                h-4 sits between the text's x-height and its line box so it reads
                as a divider rather than a full-height rule. aria-hidden because
                a pipe read aloud is noise in the middle of the navigation.

                --cl-nav-text, the nav's own cream, rather than --cl-nav-divider
                (#3d5a2b): dark green on the nav's darker green is about 1.7:1 and
                stayed invisible however wide it was drawn. At the same brightness
                as the link text it still does not compete with it — 2×16px of
                cream is a fraction of the ink in a word. */}
            <span aria-hidden="true" className="w-0.5 h-4 bg-(--cl-nav-text) shrink-0" />
            <span className="text-sm text-(--cl-nav-muted) max-w-40 truncate">
              {user.name}
            </span>
            <NavLink href="/settings">Settings</NavLink>
            <SignOutButton />
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-sm text-(--cl-nav-text) hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="text-sm bg-(--cl-accent) text-white rounded-lg px-3 py-1.5 hover:bg-(--cl-accent-hov) transition-colors"
            >
              Sign up
            </Link>
          </div>
        )}

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          className="sm:hidden flex flex-col gap-1.5 p-1 text-(--cl-nav-text)"
        >
          <span
            className={`block w-5 h-0.5 bg-current transition-transform origin-center duration-200 ${open ? "rotate-45 translate-y-2" : ""}`}
          />
          <span
            className={`block w-5 h-0.5 bg-current transition-opacity duration-200 ${open ? "opacity-0" : ""}`}
          />
          <span
            className={`block w-5 h-0.5 bg-current transition-transform origin-center duration-200 ${open ? "-rotate-45 -translate-y-2" : ""}`}
          />
        </button>
      </nav>

      {/* ── Mobile drawer ───────────────────────────────────────── */}
      {open && (
        <div className="sm:hidden border-t border-(--cl-nav-divider) px-6 py-4 flex flex-col gap-4">
          {user ? (
            <>
              {/* pl-3 on the non-link rows too: the links carry a 2px marker
                  border and its padding, so without this the name and Sign out
                  would hang 14px to the left of every link in the list. */}
              <span className="text-sm text-(--cl-nav-muted) truncate pl-3">
                {user.name}
              </span>
              <NavLink href="/cvs" onClick={close} drawer>My CVs</NavLink>
              <NavLink href="/content" onClick={close} drawer>My Content</NavLink>
              <NavLink href="/import" onClick={close} drawer>Import PDF</NavLink>
              <NavLink href="/settings" onClick={close} drawer>Settings</NavLink>
              <div className="pl-3">
                <SignOutButton />
              </div>
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                onClick={close}
                className="text-sm text-(--cl-nav-text) hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                onClick={close}
                className="text-sm bg-(--cl-accent) text-white rounded-lg px-3 py-1.5 text-center hover:bg-(--cl-accent-hov) transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
