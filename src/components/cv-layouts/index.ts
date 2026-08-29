import type { CvContent } from "@/lib/cv-content-types";
import type { CvTheme } from "@/lib/cv-theme";
import { resolveLayoutId, type LayoutId, type SectionKey } from "@/lib/cv-layouts";
import { DefaultLayout } from "./DefaultLayout";
import { ModernLayout } from "./ModernLayout";
import { TealSidebarLayout } from "./TealSidebarLayout";
import { TerminalLayout } from "./TerminalLayout";
import { SlateLayout } from "./SlateLayout";
import { EuropassLayout } from "./EuropassLayout";

export type { CvTheme };

/**
 * `language` is the CV's own language — `Cv.language`, not the UI locale. It is
 * a raw `string` rather than a `Locale` because that is what the column gives:
 * validation belongs at the one place that reads it, `cvStrings()`.
 */
export type LayoutProps = {
  content: CvContent;
  theme?: CvTheme;
  sectionOrder?: SectionKey[];
  chronological?: boolean;
  language?: string;
};

// Add new layouts here as they are built. Keyed by `LayoutId` rather than by
// `string`, so an id added to LAYOUT_IDS without a component here is a compile
// error instead of a silent fall back to DefaultLayout at runtime.
const LAYOUT_COMPONENTS: Record<LayoutId, React.ComponentType<LayoutProps>> = {
  default: DefaultLayout,
  modern: ModernLayout,
  teal: TealSidebarLayout,
  terminal: TerminalLayout,
  slate: SlateLayout,
  europass: EuropassLayout,
};

export function getLayoutComponent(layoutId: string): React.ComponentType<LayoutProps> {
  // `resolveLayoutId` carries the fallback for an id the registry no longer
  // knows, so the lookup itself is total.
  return LAYOUT_COMPONENTS[resolveLayoutId(layoutId)];
}
