type Props = {
  sidebarColor?: string;
  accentColor?: string;
  selected?: boolean;
};

const DEFAULT_SIDEBAR = "#0f172a";
const DEFAULT_ACCENT = "#3fb950";
const PAGE_BG = "#0d1117";
const HEADER_BG = "#161b22";
const CARD_BG = "#161b22";
const BORDER = "#30363d";
const TEXT_MUTED = "#8b949e";
const TEXT_LINK = "#79c0ff";

export function TerminalThumb({ sidebarColor, accentColor, selected }: Props) {
  const sidebar = sidebarColor ?? DEFAULT_SIDEBAR;
  const accent = accentColor ?? DEFAULT_ACCENT;

  return (
    <div
      style={{
        width: 120,
        height: 170,
        overflow: "hidden",
        background: PAGE_BG,
        borderRadius: 4,
        border: selected ? `2px solid ${accent}` : "2px solid #30363d",
        display: "flex",
        flexDirection: "column",
        fontFamily: "monospace",
        boxSizing: "border-box",
      }}
    >
      {/* Header band */}
      <div
        style={{
          background: HEADER_BG,
          borderBottom: `1px solid ${BORDER}`,
          padding: "5px 6px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexShrink: 0,
        }}
      >
        {/* Left: name + title */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ width: 32, height: 4, background: "#f0f6fc", borderRadius: 1 }} />
          <div style={{ width: 24, height: 3, background: accent, borderRadius: 1 }} />
        </div>
        {/* Right: contact lines */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-end" }}>
          {[20, 16, 18].map((w, i) => (
            <div key={i} style={{ width: w, height: 2.5, background: TEXT_MUTED, borderRadius: 1 }} />
          ))}
        </div>
      </div>

      {/* Body: sidebar + main */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
        <div
          style={{
            width: 38,
            background: sidebar,
            borderRight: `1px solid ${BORDER}`,
            flexShrink: 0,
            padding: "5px 4px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {/* Avatar circle */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 2 }}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "#21262d",
                border: `1.5px solid ${accent}`,
              }}
            />
          </div>

          {/* Section label */}
          <div style={{ width: 22, height: 2.5, background: accent, borderRadius: 1 }} />

          {/* Contact rows */}
          {[18, 22, 16].map((w, i) => (
            <div key={i} style={{ width: w, height: 2, background: TEXT_MUTED, borderRadius: 1 }} />
          ))}

          {/* Divider */}
          <div style={{ height: 1, background: BORDER, margin: "1px 0" }} />

          {/* Section label */}
          <div style={{ width: 26, height: 2.5, background: accent, borderRadius: 1 }} />

          {/* Skill tags */}
          {[
            [TEXT_LINK, TEXT_LINK],
            [accent, accent],
            ["#ffa657"],
          ].map((row, ri) => (
            <div key={ri} style={{ display: "flex", gap: 2 }}>
              {row.map((color, ci) => (
                <div
                  key={ci}
                  style={{
                    height: 6,
                    width: 14,
                    borderRadius: 1,
                    background: "#21262d",
                    border: `0.5px solid ${BORDER}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div style={{ width: 8, height: 2, background: color, borderRadius: 0.5 }} />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Main */}
        <div
          style={{
            flex: 1,
            background: PAGE_BG,
            padding: "5px 5px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {/* Profile comment block */}
          <div
            style={{
              background: CARD_BG,
              borderLeft: `2px solid ${accent}`,
              padding: "3px 4px",
              borderRadius: 1,
            }}
          >
            {[28, 22, 18].map((w, i) => (
              <div
                key={i}
                style={{
                  width: w,
                  height: 2,
                  background: TEXT_MUTED,
                  borderRadius: 1,
                  marginBottom: i < 2 ? 2 : 0,
                }}
              />
            ))}
          </div>

          {/* Section label */}
          <div style={{ width: 28, height: 2.5, background: accent, borderRadius: 1 }} />

          {/* Experience entry 1 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ width: 28, height: 3, background: "#f0f6fc", borderRadius: 1 }} />
              <div style={{ width: 16, height: 2.5, background: TEXT_MUTED, borderRadius: 1 }} />
            </div>
            <div style={{ width: 22, height: 2, background: TEXT_LINK, borderRadius: 1 }} />
            {/* Tags */}
            <div style={{ display: "flex", gap: 2 }}>
              {[12, 10, 14].map((w, i) => (
                <div
                  key={i}
                  style={{
                    width: w,
                    height: 5,
                    borderRadius: 1,
                    background: CARD_BG,
                    border: `0.5px solid ${BORDER}`,
                  }}
                />
              ))}
            </div>
            {/* Bullets */}
            {[28, 22].map((w, i) => (
              <div key={i} style={{ width: w, height: 2, background: TEXT_MUTED, borderRadius: 1 }} />
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: BORDER }} />

          {/* Experience entry 2 (abbreviated) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ width: 24, height: 3, background: "#f0f6fc", borderRadius: 1 }} />
              <div style={{ width: 14, height: 2.5, background: TEXT_MUTED, borderRadius: 1 }} />
            </div>
            <div style={{ width: 18, height: 2, background: TEXT_LINK, borderRadius: 1 }} />
            {[26, 20].map((w, i) => (
              <div key={i} style={{ width: w, height: 2, background: TEXT_MUTED, borderRadius: 1 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
