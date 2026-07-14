/** Parse "#rrggbb" → [r, g, b] in 0–255 range */
function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** [r, g, b] (0–255) → "#rrggbb" */
function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((v) =>
        Math.round(Math.max(0, Math.min(255, v)))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

/** RGB (0–255) → HSL (all in 0–1 range) */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255,
    gn = g / 255,
    bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case rn:
      h = (gn - bn) / d + (gn < bn ? 6 : 0);
      break;
    case gn:
      h = (bn - rn) / d + 2;
      break;
    default:
      h = (rn - gn) / d + 4;
  }
  return [h / 6, s, l];
}

/** HSL (all in 0–1 range) → RGB (0–255) */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

/** Darken a hex color by reducing HSL lightness. `amount` is 0–1. */
export function darkenColor(hex: string, amount = 0.1): string {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  return rgbToHex(...hslToRgb(h, s, Math.max(0, l - amount)));
}

/** Lighten a hex color by increasing HSL lightness. `amount` is 0–1. */
export function lightenColor(hex: string, amount = 0.1): string {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  return rgbToHex(...hslToRgb(h, s, Math.min(1, l + amount)));
}

/**
 * Return "#ffffff" or "#1a1a1a" — whichever gives better contrast against `hex`.
 * Uses the W3C relative-luminance formula; crossover threshold ≈ 0.18.
 */
export function getContrastColor(hex: string): "#ffffff" | "#1a1a1a" {
  const [r, g, b] = hexToRgb(hex);
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return L > 0.18 ? "#1a1a1a" : "#ffffff";
}

/** Return an `rgba(r, g, b, alpha)` CSS string from a hex color. */
export function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Linear interpolation between two hex colors in RGB space. t = 0→hex1, t = 1→hex2. */
export function mixColors(hex1: string, hex2: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

/**
 * CSS gradient for a sidebar: symmetric ease-in-out edges, both lightening by the same amount.
 * Left (0–20%) and right (80–100%): lighten → base. Middle (20–80%): flat base.
 */
export function sidebarGradient(base: string): string {
  const highlight = lightenColor(base, 0.10);
  // Ease-in-out cubic approximation: progress at t=0.25, 0.5, 0.75 → 0.125, 0.5, 0.875
  const e1 = mixColors(highlight, base, 0.125);
  const e2 = mixColors(highlight, base, 0.5);
  const e3 = mixColors(highlight, base, 0.875);
  return [
    `${highlight} 0%`,
    `${e1} 5%`,
    `${e2} 10%`,
    `${e3} 15%`,
    `${base} 20%`,
    `${base} 80%`,
    `${e3} 85%`,
    `${e2} 90%`,
    `${e1} 95%`,
    `${highlight} 100%`,
  ].join(", ");
}
