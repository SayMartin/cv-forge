"use client";

import { useRef, useLayoutEffect, useState } from "react";

// 210mm at 96 dpi — must match the layouts' `style={{ width: "210mm" }}`
const CV_WIDTH_PX = 210 * (96 / 25.4);

export function CvScaleWrapper({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [outerHeight, setOuterHeight] = useState<number | undefined>();

  useLayoutEffect(() => {
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;

    const update = () => {
      const s = Math.min(1, container.offsetWidth / CV_WIDTH_PX);
      setScale(s);
      setOuterHeight(s < 1 ? inner.scrollHeight * s : undefined);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(container);
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  return (
    // Outer: full viewport width; explicit height so footer sits correctly
    <div
      ref={containerRef}
      className="w-full overflow-hidden print:overflow-visible print:h-auto bg-(--cl-bg) print:bg-transparent"
      style={outerHeight != null ? { height: outerHeight } : undefined}
    >
      {/* Inner: fixed CV pixel width; centered on wide screens; scaled on narrow screens */}
      <div
        ref={innerRef}
        className="print:transform-none print:w-auto mx-auto"
        style={{
          width: CV_WIDTH_PX,
          transform: scale < 1 ? `scale(${scale})` : undefined,
          transformOrigin: scale < 1 ? "top left" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
