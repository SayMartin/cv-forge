type Props = {
  sidebarColor?: string;
  accentColor?: string;
  selected?: boolean;
};

const EUROPASS_BLUE = "#003399";

export function EuropassThumb({ sidebarColor, selected }: Props) {
  const accent = sidebarColor ?? EUROPASS_BLUE;

  return (
    <div
      style={{
        width: 120,
        height: 170,
        overflow: "hidden",
        background: "#fff",
        borderRadius: 4,
        border: selected ? "2px solid #4f7c4f" : "2px solid #e5e7eb",
        fontFamily: "sans-serif",
        boxSizing: "border-box",
        padding: "8px 8px 6px",
      }}
    >
      {/* Header */}
      <div style={{ borderBottom: `2px solid ${accent}`, paddingBottom: 4, marginBottom: 5 }}>
        <div style={{ width: "60%", height: 5, background: accent, borderRadius: 1, marginBottom: 2 }} />
        <div style={{ width: "40%", height: 2.5, background: "#9ca3af", borderRadius: 1 }} />
      </div>

      {/* Personal info block */}
      <div style={{ marginBottom: 5 }}>
        <div style={{ width: "50%", height: 2.5, background: accent, borderRadius: 1, marginBottom: 2 }} />
        {[0.8, 0.7, 0.6].map((w, i) => (
          <div key={i} style={{ display: "flex", gap: 3, marginBottom: 1.5 }}>
            <div style={{ width: 14, height: 2, background: "#c7d2e0", borderRadius: 1 }} />
            <div style={{ width: `${w * 60}%`, height: 2, background: "#e5e7eb", borderRadius: 1 }} />
          </div>
        ))}
      </div>

      {/* Dated timeline sections (Europass signature: date column | content column) */}
      {[0.55, 0.45].map((label, si) => (
        <div key={si} style={{ marginBottom: 5 }}>
          <div style={{ width: `${label * 100}%`, height: 2.5, background: accent, borderRadius: 1, marginBottom: 2 }} />
          {[0, 1].map((row) => (
            <div key={row} style={{ display: "flex", gap: 3, marginBottom: 2 }}>
              <div style={{ width: 18, height: 2, background: accent, opacity: 0.5, borderRadius: 1 }} />
              <div style={{ flex: 1, borderLeft: `1px solid ${accent}55`, paddingLeft: 3, display: "flex", flexDirection: "column", gap: 1.5 }}>
                <div style={{ width: "80%", height: 2, background: "#4b5563", borderRadius: 1 }} />
                <div style={{ width: "60%", height: 2, background: "#e5e7eb", borderRadius: 1 }} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
