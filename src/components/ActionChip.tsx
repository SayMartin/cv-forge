import type { MouseEvent, ReactNode } from "react";
import { LocaleLink } from "@/components/LocaleLink";

// The app's small secondary action: "Edit", "Delete", "All/None", "My Content →".
//
// These used to be bare `text-xs` labels in `--cl-muted` — legible as text, but
// nothing about them said "target". A section heading or a dense list row gives
// them a semibold title and a rule to compete with, and colour alone lost that
// competition; it is the same reason NavBar draws a marker bar for the active
// link instead of relying on a colour step.
//
// So: a border, `text-sm` (the app's floor — nothing is set smaller), and a hover
// that fills the chip rather than only recolouring the label, which makes the hit
// area visible as an area before it is clicked.
//
// Renders a `<Link>` when `href` is given and a `<button>` otherwise, so the two
// never drift apart in a header where one of each sits side by side.

type Tone = "accent" | "danger" | "danger-strong";

const BASE =
  "inline-flex items-center gap-1 shrink-0 whitespace-nowrap rounded-md border " +
  "px-2 py-0.5 text-sm font-medium transition-colors";

// `accent` and `danger` both start from the same neutral border. A row of chips
// that were red at rest would read as a row of warnings; a Delete repeated once
// per entry earns its red on approach, not at a glance down a list of twenty.
//
// `danger-strong` is for the opposite case: a page's single destructive action,
// where there is no repetition to mute and being found is the whole point. It
// carries the red in the frame as well as the label. Use it once per page.
// A chip that is also a choice: the avatar picker's "None". Filled rather than
// merely outlined, because "chosen" has to survive sitting next to a ring-marked
// 48px photo — an outline alone was not visible as a state at that size.
//
// The unselected half is deliberately the ordinary `accent` tone rather than a
// muted variant. Greying an unchosen option makes it look disabled, which is the
// bug this replaced: `text-(--cl-muted)` on the "None" button read as "you may
// not pick this" instead of "you have not picked this".
const SELECTED =
  "border-(--cl-accent) bg-(--cl-accent) text-white " +
  "hover:border-(--cl-accent-hov) hover:bg-(--cl-accent-hov)";

const TONES: Record<Tone, string> = {
  accent:
    "border-(--cl-border) text-(--cl-accent) hover:border-(--cl-accent) hover:bg-(--cl-pill)",
  danger:
    "border-(--cl-border) text-red-500 hover:border-red-400 hover:text-red-600 hover:bg-red-50",
  "danger-strong":
    "border-red-300 text-red-500 hover:border-red-400 hover:text-red-600 hover:bg-red-50",
};

type Props = {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  title?: string;
  /** Renders a Link instead of a button. */
  href?: string;
  /** Takes the event so handlers that call preventDefault still fit. */
  onClick?: (e: MouseEvent) => void;
  disabled?: boolean;
  /**
   * Marks the chip as a toggle and gives it a filled "chosen" state. Passing it
   * at all (even `false`) makes the button announce itself as pressable state
   * rather than as a plain action.
   */
  selected?: boolean;
};

export function ActionChip({
  children,
  tone = "accent",
  className = "",
  title,
  href,
  onClick,
  disabled,
  selected,
}: Props) {
  const classes = `${BASE} ${selected ? SELECTED : TONES[tone]} ${className}`;

  if (href) {
    return (
      <LocaleLink href={href} className={classes} title={title} onClick={onClick}>
        {children}
      </LocaleLink>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={selected}
      className={`${classes} disabled:opacity-40 disabled:pointer-events-none`}
    >
      {children}
    </button>
  );
}
