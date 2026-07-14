import { getContrastColor } from "@/lib/color-utils";

type Props = {
  sidebarColor?: string;
  accentColor?: string;
  selected?: boolean;
};

const DEFAULT_SIDEBAR = "#1e293b";
const DEFAULT_ACCENT = "#6366f1";

export function SlateThumb({ sidebarColor, accentColor, selected }: Props) {
  const sidebar = sidebarColor ?? DEFAULT_SIDEBAR;
  const accent = accentColor ?? DEFAULT_ACCENT;
  const sidebarText = getContrastColor(sidebar);
  const sidebarMuted =
    sidebarText === "#ffffff" ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.35)";
  const dotEmpty =
    sidebarText === "#ffffff" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)";

  return (
    <div
      style={{
        width: 120,
        height: 170,
        overflow: "hidden",
        background: "#fff",
        borderRadius: 4,
        border: selected ? `2px solid ${accent}` : "2px solid #e5e7eb",
        display: "flex",
        fontFamily: "sans-serif",
        boxSizing: "border-box",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: 42,
          background: sidebar,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "8px 5px 6px",
          gap: 3,
          flexShrink: 0,
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: dotEmpty,
            border: `2px solid ${accent}`,
            marginBottom: 3,
          }}
        />
        {/* Name lines */}
        <div style={{ width: "80%", height: 3.5, background: sidebarText === "#ffffff" ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.7)", borderRadius: 1 }} />
        <div style={{ width: "60%", height: 2.5, background: accent, borderRadius: 1, marginBottom: 4 }} />

        {/* Contact label */}
        <div style={{ width: "65%", height: 2.5, background: accent, borderRadius: 1 }} />
        <div style={{ width: "90%", height: 0.75, background: accent, borderRadius: 1, marginBottom: 2 }} />
        {[0.85, 0.7, 0.8, 0.65].map((w, i) => (
          <div key={i} style={{ width: `${w * 100}%`, height: 2, background: sidebarMuted, borderRadius: 1 }} />
        ))}

        {/* Skills label */}
        <div style={{ width: "60%", height: 2.5, background: accent, borderRadius: 1, marginTop: 4 }} />
        <div style={{ width: "90%", height: 0.75, background: accent, borderRadius: 1, marginBottom: 1 }} />

        {/* Category 1 */}
        <div style={{ width: "70%", height: 2, background: sidebarMuted, borderRadius: 1 }} />
        {[0.9, 0.75].map((w, i) => (
          <div key={i} style={{ width: "90%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ width: `${w * 55}%`, height: 2, background: sidebarText === "#ffffff" ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)", borderRadius: 1 }} />
            <div style={{ display: "flex", gap: 1 }}>
              {[0, 1, 2, 3, 4].map((d) => (
                <div key={d} style={{ width: 3, height: 3, borderRadius: "50%", background: d < (i === 0 ? 4 : 5) ? accent : dotEmpty }} />
              ))}
            </div>
          </div>
        ))}

        {/* Category 2 */}
        <div style={{ width: "65%", height: 2, background: sidebarMuted, borderRadius: 1, marginTop: 2 }} />
        {[0.8, 0.7].map((w, i) => (
          <div key={i} style={{ width: "90%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ width: `${w * 55}%`, height: 2, background: sidebarText === "#ffffff" ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)", borderRadius: 1 }} />
            <div style={{ display: "flex", gap: 1 }}>
              {[0, 1, 2, 3, 4].map((d) => (
                <div key={d} style={{ width: 3, height: 3, borderRadius: "50%", background: d < (i === 0 ? 3 : 4) ? accent : dotEmpty }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "7px 6px 5px", borderBottom: `1.5px solid ${accent}` }}>
          <div style={{ width: "50%", height: 2.5, background: accent, borderRadius: 1, marginBottom: 3 }} />
          <div style={{ width: "70%", height: 5.5, background: "#0f172a", borderRadius: 1, marginBottom: 2 }} />
          <div style={{ width: "85%", height: 2, background: "#cbd5e1", borderRadius: 1 }} />
        </div>

        {/* Experience section */}
        <div style={{ padding: "5px 6px", flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
          {/* Section header */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ width: "40%", height: 2.5, background: "#0f172a", borderRadius: 1 }} />
            <div style={{ width: 18, height: 1.5, background: accent, borderRadius: 1 }} />
          </div>

          {/* Exp entry 1 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ width: "60%", height: 3, background: "#0f172a", borderRadius: 1 }} />
              <div style={{ width: "22%", height: 2.5, background: "#94a3b8", borderRadius: 1 }} />
            </div>
            {/* Pills */}
            <div style={{ display: "flex", gap: 2 }}>
              {[14, 12, 16].map((w, i) => (
                <div key={i} style={{ width: w, height: 5, borderRadius: 10, background: "#f1f5f9" }} />
              ))}
            </div>
            {[0.9, 0.75, 0.85].map((w, i) => (
              <div key={i} style={{ width: `${w * 100}%`, height: 2, background: "#e2e8f0", borderRadius: 1 }} />
            ))}
          </div>

          <div style={{ height: 1, background: "#f1f5f9" }} />

          {/* Exp entry 2 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ width: "55%", height: 3, background: "#0f172a", borderRadius: 1 }} />
              <div style={{ width: "22%", height: 2.5, background: "#94a3b8", borderRadius: 1 }} />
            </div>
            <div style={{ display: "flex", gap: 2 }}>
              {[12, 14, 10].map((w, i) => (
                <div key={i} style={{ width: w, height: 5, borderRadius: 10, background: "#f1f5f9" }} />
              ))}
            </div>
            {[0.85, 0.7].map((w, i) => (
              <div key={i} style={{ width: `${w * 100}%`, height: 2, background: "#e2e8f0", borderRadius: 1 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
