export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 22 28"
      width={Math.round(size * (22 / 28))}
      height={size}
      fill="none"
      aria-hidden="true"
    >
      <style>{`
        .logo-svg { --c: #2d5a1b; --cf: #3a7222 }
        @media (prefers-color-scheme: dark) {
          .logo-svg { --c: #7dc45a; --cf: #5aaa30 }
        }
      `}</style>
      <g className="logo-svg">
        {/* Page body */}
        <path
          d="M 2,7 L 14,7 L 20,13 L 20,26 L 2,26 Z"
          fill="var(--cf)"
          fillOpacity={0.35}
          stroke="var(--c)"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        {/* Leaf replacing corner fold */}
        <path
          d="M 14,7 C 13,4 15.5,1.5 17.5,1.5 C 19.5,1.5 21,5 20,13 Z"
          fill="var(--cf)"
          fillOpacity={0.85}
          stroke="var(--c)"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        {/* Leaf centre vein */}
        <path
          d="M 17.5,1.5 L 17,8"
          stroke="var(--c)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeOpacity={0.7}
        />
        {/* CV content lines */}
        <path
          d="M 5,16 L 16.5,16"
          stroke="var(--c)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="M 5,19.5 L 16.5,19.5"
          stroke="var(--c)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="M 5,23 L 12,23"
          stroke="var(--c)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
