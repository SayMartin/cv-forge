type Props = {
  selected?: boolean;
};

export function DefaultThumb({ selected }: Props) {
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
        display: "flex",
        flexDirection: "column",
        gap: 0,
        boxSizing: "border-box",
      }}
    >
      {/* Header area */}
      <div
        style={{
          padding: "8px 8px 5px",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        {/* Name */}
        <div
          style={{
            width: "70%",
            height: 7,
            background: "#1a1a1a",
            borderRadius: 2,
            marginBottom: 4,
          }}
        />
        {/* Title */}
        <div
          style={{
            width: "50%",
            height: 4,
            background: "#9ca3af",
            borderRadius: 2,
          }}
        />
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", gap: 5, padding: "6px 8px" }}>
        {/* Left column */}
        <div
          style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}
        >
          {/* Section */}
          <div
            style={{
              width: "60%",
              height: 4,
              background: "#6b7280",
              borderRadius: 1,
            }}
          />
          <div
            style={{
              width: "100%",
              height: 3,
              background: "#e5e7eb",
              borderRadius: 1,
            }}
          />
          <div
            style={{
              width: "80%",
              height: 3,
              background: "#e5e7eb",
              borderRadius: 1,
            }}
          />
          <div
            style={{
              width: "90%",
              height: 3,
              background: "#e5e7eb",
              borderRadius: 1,
            }}
          />
          {/* Section */}
          <div
            style={{
              width: "55%",
              height: 4,
              background: "#6b7280",
              borderRadius: 1,
              marginTop: 4,
            }}
          />
          <div
            style={{
              width: "100%",
              height: 3,
              background: "#e5e7eb",
              borderRadius: 1,
            }}
          />
          <div
            style={{
              width: "70%",
              height: 3,
              background: "#e5e7eb",
              borderRadius: 1,
            }}
          />
          <div
            style={{
              width: "90%",
              height: 3,
              background: "#e5e7eb",
              borderRadius: 1,
            }}
          />
        </div>

        {/* Right column */}
        <div
          style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}
        >
          <div
            style={{
              width: "65%",
              height: 4,
              background: "#6b7280",
              borderRadius: 1,
            }}
          />
          <div
            style={{
              width: "100%",
              height: 3,
              background: "#e5e7eb",
              borderRadius: 1,
            }}
          />
          <div
            style={{
              width: "85%",
              height: 3,
              background: "#e5e7eb",
              borderRadius: 1,
            }}
          />
          <div
            style={{
              width: "60%",
              height: 3,
              background: "#e5e7eb",
              borderRadius: 1,
            }}
          />
          <div
            style={{
              width: "65%",
              height: 4,
              background: "#6b7280",
              borderRadius: 1,
              marginTop: 4,
            }}
          />
          <div
            style={{
              width: "90%",
              height: 3,
              background: "#e5e7eb",
              borderRadius: 1,
            }}
          />
          <div
            style={{
              width: "75%",
              height: 3,
              background: "#e5e7eb",
              borderRadius: 1,
            }}
          />
          <div
            style={{
              width: "100%",
              height: 3,
              background: "#e5e7eb",
              borderRadius: 1,
            }}
          />
        </div>
      </div>
    </div>
  );
}
