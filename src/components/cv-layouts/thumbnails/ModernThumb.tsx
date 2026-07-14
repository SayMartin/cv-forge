import { darkenColor, getContrastColor } from "@/lib/color-utils";

type Props = {
  sidebarColor?: string;
  accentColor?: string;
  selected?: boolean;
};

const DEFAULT_SIDEBAR = "#2d2d2d";
const DEFAULT_ACCENT = "#c9a84c";

export function ModernThumb({ sidebarColor, accentColor, selected }: Props) {
  const sidebar = sidebarColor ?? DEFAULT_SIDEBAR;
  const accent = accentColor ?? DEFAULT_ACCENT;
  const sidebarDark = darkenColor(sidebar, 0.09);
  const sidebarText = getContrastColor(sidebar);
  const mutedSidebarText =
    sidebarText === "#ffffff" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)";

  return (
    <div
      style={{
        width: 120,
        height: 170,
        overflow: "hidden",
        background: "#fff",
        borderRadius: 4,
        border: selected ? "2px solid #4f7c4f" : "2px solid #e5e7eb",
        display: "flex",
        fontFamily: "sans-serif",
        boxSizing: "border-box",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: 42,
          background: `linear-gradient(to bottom, ${sidebar}, ${sidebarDark})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "8px 4px 6px",
          gap: 4,
          position: "relative",
          flexShrink: 0,
        }}
      >
        {/* Avatar circle */}
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: accent,
            marginBottom: 4,
            border: `1.5px solid ${accent}`,
          }}
        />
        {/* Name line */}
        <div
          style={{
            width: "80%",
            height: 4,
            background:
              sidebarText === "#ffffff"
                ? "rgba(255,255,255,0.85)"
                : "rgba(0,0,0,0.7)",
            borderRadius: 1,
          }}
        />
        {/* Title line */}
        <div
          style={{
            width: "65%",
            height: 3,
            background: mutedSidebarText,
            borderRadius: 1,
          }}
        />

        {/* Section separator */}
        <div
          style={{
            width: "70%",
            height: 1,
            background: mutedSidebarText,
            marginTop: 4,
            marginBottom: 2,
          }}
        />

        {/* Contact rows — dot + line */}
        {[0.8, 0.65, 0.75, 0.6].map((w, i) => (
          <div
            key={i}
            style={{
              width: "85%",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <div
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: accent,
                flexShrink: 0,
              }}
            />
            <div
              style={{
                flex: 1,
                height: 2.5,
                background: mutedSidebarText,
                borderRadius: 1,
                maxWidth: `${w * 100}%`,
              }}
            />
          </div>
        ))}

        {/* Section label */}
        <div
          style={{
            width: "70%",
            height: 1,
            background: mutedSidebarText,
            marginTop: 4,
            marginBottom: 2,
          }}
        />
        {/* Dot ratings */}
        {[1, 0.8, 0.6].map((fill, i) => (
          <div
            key={i}
            style={{
              width: "85%",
              display: "flex",
              gap: 2,
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "45%",
                height: 2.5,
                background: mutedSidebarText,
                borderRadius: 1,
              }}
            />
            <div style={{ display: "flex", gap: 1, marginLeft: "auto" }}>
              {[0, 1, 2, 3, 4].map((d) => (
                <div
                  key={d}
                  style={{
                    width: 3,
                    height: 3,
                    borderRadius: "50%",
                    background: d < fill * 5 ? accent : mutedSidebarText,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "8px 6px 6px",
          gap: 0,
        }}
      >
        {/* Row 1 header */}
        <div
          style={{
            width: "70%",
            height: 6,
            background: "#1a1a1a",
            borderRadius: 1,
            marginBottom: 3,
          }}
        />
        <div
          style={{
            width: "50%",
            height: 3,
            background: "#9ca3af",
            borderRadius: 1,
            marginBottom: 2,
          }}
        />
        {/* Accent underline */}
        <div
          style={{
            width: "100%",
            height: 1.5,
            background: accent,
            marginBottom: 5,
          }}
        />

        {/* Section + text lines */}
        {[
          { label: 0.4, lines: [1, 0.75, 0.9] },
          { label: 0.35, lines: [0.85, 0.65] },
          { label: 0.4, lines: [1, 0.8, 0.7] },
        ].map((section, si) => (
          <div key={si} style={{ marginBottom: 5 }}>
            <div
              style={{
                width: `${section.label * 100}%`,
                height: 3.5,
                background: "#4b5563",
                borderRadius: 1,
                marginBottom: 3,
              }}
            />
            {section.lines.map((w, li) => (
              <div
                key={li}
                style={{
                  width: `${w * 100}%`,
                  height: 2.5,
                  background: "#e5e7eb",
                  borderRadius: 1,
                  marginBottom: 2,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
