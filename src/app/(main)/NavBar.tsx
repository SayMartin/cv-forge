"use client";

import { useState } from "react";
import Link from "next/link";
import { SignOutButton } from "./SignOutButton";
import { Logo } from "@/components/Logo";

type User = { name: string; email: string; role?: string | null };

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
            CV Creator
          </span>
        </Link>

        {/* Desktop links */}
        {user ? (
          <div className="hidden sm:flex items-center gap-5">
            <Link
              href="/cvs"
              className="text-sm text-(--cl-nav-text) hover:text-white transition-colors"
            >
              My CVs
            </Link>
            <Link
              href="/content"
              className="text-sm text-(--cl-nav-text) hover:text-white transition-colors"
            >
              My Content
            </Link>
            <Link
              href="/import"
              className="text-sm text-(--cl-nav-text) hover:text-white transition-colors"
            >
              Import PDF
            </Link>
            <span className="text-(--cl-nav-divider)">|</span>
            <span className="text-sm text-(--cl-nav-muted) max-w-40 truncate">
              {user.name}
            </span>
            <Link
              href="/settings"
              className="text-sm text-(--cl-nav-text) hover:text-white transition-colors"
            >
              Settings
            </Link>
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
              <span className="text-sm text-(--cl-nav-muted) truncate">
                {user.name}
              </span>
              <Link
                href="/cvs"
                onClick={close}
                className="text-sm text-(--cl-nav-text) hover:text-white transition-colors"
              >
                My CVs
              </Link>
              <Link
                href="/content"
                onClick={close}
                className="text-sm text-(--cl-nav-text) hover:text-white transition-colors"
              >
                My Content
              </Link>
              <Link
                href="/import"
                onClick={close}
                className="text-sm text-(--cl-nav-text) hover:text-white transition-colors"
              >
                Import PDF
              </Link>
              <Link
                href="/settings"
                onClick={close}
                className="text-sm text-(--cl-nav-text) hover:text-white transition-colors"
              >
                Settings
              </Link>
              <SignOutButton />
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
