import type { CvContent } from "@/lib/cv-content-types";
import type { CvTheme } from "@/lib/cv-theme";
import type { SectionKey } from "@/lib/cv-layouts";
import { DefaultLayout } from "./DefaultLayout";
import { ModernLayout } from "./ModernLayout";
import { TealSidebarLayout } from "./TealSidebarLayout";
import { TerminalLayout } from "./TerminalLayout";
import { SlateLayout } from "./SlateLayout";
import { EuropassLayout } from "./EuropassLayout";

export type { CvTheme };

export type LayoutProps = { content: CvContent; theme?: CvTheme; sectionOrder?: SectionKey[] };

// Add new layouts here as they are built.
// The key must match the `id` in CV_LAYOUTS registry (src/lib/cv-layouts.ts).
const LAYOUT_COMPONENTS: Record<string, React.ComponentType<LayoutProps>> = {
  default: DefaultLayout,
  modern: ModernLayout,
  teal: TealSidebarLayout,
  terminal: TerminalLayout,
  slate: SlateLayout,
  europass: EuropassLayout,
};

export function getLayoutComponent(layoutId: string): React.ComponentType<LayoutProps> {
  return LAYOUT_COMPONENTS[layoutId] ?? DefaultLayout;
}
