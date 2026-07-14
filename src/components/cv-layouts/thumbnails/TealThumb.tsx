import {
  darkenColor,
  lightenColor,
  getContrastColor,
  hexToRgba,
} from "@/lib/color-utils";

type Props = {
  sidebarColor?: string;
  accentColor?: string;
  selected?: boolean;
};

const DEFAULT_TEAL = "#2d7d8a";

export function TealThumb({ sidebarColor, selected }: Props) {
  const teal = sidebarColor ?? DEFAULT_TEAL;
  const tealDark = darkenColor(teal, 0.09);
  const tealLight = lightenColor(teal, 0.09);
  const sidebarText = getContrastColor(teal);
  const mutedText =
    sidebarText === "#ffffff" ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.4)";
  const bgTint = hexToRgba(teal, 0.07);

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
          width: 40,
          background: `linear-gradient(to bottom, ${teal}, ${tealDark})`,
          display: "flex",
          flexDirection: "column",
          padding: "8px 4px 6px",
          gap: 3,
          flexShrink: 0,
        }}
      >
        {/* Profile photo placeholder */}
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: tealLight,
            margin: "0 auto 3px",
            border: `2px solid ${mutedText === "rgba(255,255,255,0.55)" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.15)"}`,
          }}
        />

        {/* Section header bar */}
        <div
          style={{
            width: "75%",
            height: 3,
            background:
              sidebarText === "#ffffff"
                ? "rgba(255,255,255,0.9)"
                : "rgba(0,0,0,0.75)",
            borderRadius: 1,
          }}
        />
        <div
          style={{
            width: "100%",
            height: 1,
            background: mutedText,
            marginBottom: 1,
          }}
        />

        {/* Contact rows */}
        {[0.85, 0.7, 0.8, 0.65].map((w, i) => (
          <div
            key={i}
            style={{
              width: `${w * 100}%`,
              height: 2.5,
              background: mutedText,
              borderRadius: 1,
            }}
          />
        ))}

        {/* Another section */}
        <div
          style={{
            width: "70%",
            height: 3,
            background:
              sidebarText === "#ffffff"
                ? "rgba(255,255,255,0.9)"
                : "rgba(0,0,0,0.75)",
            borderRadius: 1,
            marginTop: 3,
          }}
        />
        <div
          style={{
            width: "100%",
            height: 1,
            background: mutedText,
            marginBottom: 1,
          }}
        />
        {[0.9, 0.75, 0.6].map((w, i) => (
          <div
            key={i}
            style={{
              width: `${w * 100}%`,
              height: 2.5,
              background: mutedText,
              borderRadius: 1,
            }}
          />
        ))}

        {/* Another section */}
        <div
          style={{
            width: "65%",
            height: 3,
            background:
              sidebarText === "#ffffff"
                ? "rgba(255,255,255,0.9)"
                : "rgba(0,0,0,0.75)",
            borderRadius: 1,
            marginTop: 3,
          }}
        />
        <div
          style={{
            width: "100%",
            height: 1,
            background: mutedText,
            marginBottom: 1,
          }}
        />
        {[0.8, 0.7].map((w, i) => (
          <div
            key={i}
            style={{
              width: `${w * 100}%`,
              height: 2.5,
              background: mutedText,
              borderRadius: 1,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "0 0 0 0",
          gap: 0,
        }}
      >
        {/* Top header strip */}
        <div
          style={{
            background: bgTint,
            padding: "6px 6px 5px",
            borderBottom: `1.5px solid ${hexToRgba(teal, 0.2)}`,
          }}
        >
          <div
            style={{
              width: "70%",
              height: 5,
              background: tealDark,
              borderRadius: 1,
              marginBottom: 3,
            }}
          />
          <div
            style={{
              width: "55%",
              height: 3,
              background: "#9ca3af",
              borderRadius: 1,
            }}
          />
        </div>

        {/* Content sections */}
        <div
          style={{
            flex: 1,
            padding: "5px 6px",
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          {[
            { label: 0.4, lines: [1, 0.8, 0.65] },
            { label: 0.35, lines: [0.9, 0.7, 0.85] },
            { label: 0.45, lines: [0.75, 0.6] },
          ].map((section, si) => (
            <div key={si} style={{ marginBottom: 5 }}>
              {/* Section header with teal underline */}
              <div
                style={{
                  width: `${section.label * 100}%`,
                  height: 3,
                  background: teal,
                  borderRadius: 1,
                  marginBottom: 2,
                }}
              />
              <div
                style={{
                  width: "100%",
                  height: 0.75,
                  background: hexToRgba(teal, 0.3),
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
    </div>
  );
}
