import { DefaultThumb } from "./DefaultThumb";
import { ModernThumb } from "./ModernThumb";
import { TealThumb } from "./TealThumb";
import { TerminalThumb } from "./TerminalThumb";
import { SlateThumb } from "./SlateThumb";

type Props = {
  layoutId: string;
  sidebarColor?: string;
  accentColor?: string;
  selected?: boolean;
};

export function LayoutThumb({
  layoutId,
  sidebarColor,
  accentColor,
  selected,
}: Props) {
  switch (layoutId) {
    case "modern":
      return (
        <ModernThumb
          sidebarColor={sidebarColor}
          accentColor={accentColor}
          selected={selected}
        />
      );
    case "teal":
      return (
        <TealThumb
          sidebarColor={sidebarColor}
          accentColor={accentColor}
          selected={selected}
        />
      );
    case "slate":
      return (
        <SlateThumb
          sidebarColor={sidebarColor}
          accentColor={accentColor}
          selected={selected}
        />
      );
    case "terminal":
      return (
        <TerminalThumb
          sidebarColor={sidebarColor}
          accentColor={accentColor}
          selected={selected}
        />
      );
    default:
      return <DefaultThumb selected={selected} />;
  }
}
