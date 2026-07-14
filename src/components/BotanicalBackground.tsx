function Leaf({
  x,
  y,
  rx = 7,
  ry = 15,
  rotate = 0,
}: {
  x: number;
  y: number;
  rx?: number;
  ry?: number;
  rotate?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <ellipse
        rx={rx}
        ry={ry}
        fill="#2d5a1b"
        fillOpacity={0.4}
        strokeWidth={1}
      />
      <line y1={-ry} y2={ry} strokeWidth={0.7} strokeOpacity={0.5} />
    </g>
  );
}

export function BotanicalBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden print:hidden"
    >
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
        fill="none"
        stroke="#2d5a1b"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <g opacity={0.3}>
          {/* ── Bottom-left vine ──────────────────────────────────── */}
          <path
            strokeWidth={1.5}
            d="M -20,920 C 25,855 10,780 52,715 C 94,650 138,638 120,568
               C 102,498 58,478 96,408 C 134,338 180,318 158,248"
          />
          {/* branches */}
          <path strokeWidth={1} d="M 52,715 C 88,692 125,680 152,658" />
          <path strokeWidth={1} d="M 96,408 C 136,388 170,382 198,370" />

          <Leaf x={52}  y={715} rotate={-25} />
          <Leaf x={152} y={658} rx={6} ry={12} rotate={5} />
          <Leaf x={120} y={568} rotate={-58} />
          <Leaf x={96}  y={408} rotate={-38} />
          <Leaf x={198} y={370} rx={6} ry={12} rotate={12} />
          <Leaf x={158} y={248} rotate={-52} />

          {/* ── Top-right vine ────────────────────────────────────── */}
          <path
            strokeWidth={1.5}
            d="M 1460,-20 C 1403,35 1422,112 1383,178 C 1344,244 1295,258 1311,322
               C 1327,386 1368,405 1342,470 C 1316,535 1266,548 1272,612"
          />
          {/* branches */}
          <path strokeWidth={1} d="M 1383,178 C 1348,206 1316,224 1288,250" />
          <path strokeWidth={1} d="M 1311,322 C 1275,347 1244,362 1215,372" />

          <Leaf x={1383} y={178} rotate={-148} />
          <Leaf x={1288} y={250} rx={6} ry={12} rotate={168} />
          <Leaf x={1311} y={322} rotate={-118} />
          <Leaf x={1215} y={372} rx={6} ry={12} rotate={-142} />
          <Leaf x={1342} y={470} rotate={-132} />
          <Leaf x={1272} y={612} rotate={-128} />
        </g>
      </svg>
    </div>
  );
}
