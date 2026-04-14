/**
 * Vrátí #000 nebo #fff podle WCAG relativní svítivosti pozadí (sRGB).
 */
export function contrastingForeground(backgroundCss: string): "#000000" | "#ffffff" {
  const rgb = parseCssColor(backgroundCss);
  if (!rgb) return "#000000";
  const L = relativeLuminance(rgb.r, rgb.g, rgb.b);
  return L > 0.45 ? "#000000" : "#ffffff";
}

function parseCssColor(input: string): { r: number; g: number; b: number } | null {
  const s = input.trim();
  const rgb = s.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i,
  );
  if (rgb) {
    return { r: clampByte(+rgb[1]), g: clampByte(+rgb[2]), b: clampByte(+rgb[3]) };
  }
  const hex = s.match(/^#([\da-f]{3}|[\da-f]{6})$/i);
  if (!hex) return null;
  let h = hex[1];
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, n));
}

function linearize(channel255: number): number {
  const c = channel255 / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(r: number, g: number, b: number): number {
  const R = linearize(r);
  const G = linearize(g);
  const B = linearize(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}
