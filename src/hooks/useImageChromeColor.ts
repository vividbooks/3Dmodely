import { useEffect, useState } from "react";

function intrinsicSize(source: CanvasImageSource): { w: number; h: number } {
  if (typeof ImageBitmap !== "undefined" && source instanceof ImageBitmap) {
    return { w: source.width, h: source.height };
  }
  if (source instanceof HTMLImageElement) {
    const w = source.naturalWidth;
    const h = source.naturalHeight;
    return { w: w > 0 ? w : 1, h: h > 0 ? h : 1 };
  }
  if (source instanceof HTMLCanvasElement) {
    return { w: source.width, h: source.height };
  }
  return { w: 1, h: 1 };
}

function averageRect(
  source: CanvasImageSource,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
): { r: number; g: number; b: number; n: number } | null {
  try {
    sw = Math.max(1, Math.floor(sw));
    sh = Math.max(1, Math.floor(sh));
    const canvas = document.createElement("canvas");
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
    const data = ctx.getImageData(0, 0, sw, sh).data;
    let r = 0,
      g = 0,
      b = 0;
    const px = sw * sh;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }
    return { r, g, b, n: px };
  } catch {
    return null;
  }
}

function sampleCardChromeColor(source: CanvasImageSource): string | null {
  const { w: iw, h: ih } = intrinsicSize(source);
  if (iw < 2 || ih < 2) return null;

  const edge = Math.max(10, Math.min(40, Math.round(0.12 * Math.min(iw, ih))));
  const corners = edge;

  const samples: Array<{ r: number; g: number; b: number; n: number }> = [];

  const topLeft = averageRect(source, 0, 0, Math.min(edge, iw), Math.min(edge, ih));
  if (topLeft) samples.push(topLeft);

  const tr = averageRect(source, iw - corners, 0, corners, corners);
  if (tr) samples.push(tr);
  const bl = averageRect(source, 0, ih - corners, corners, corners);
  if (bl) samples.push(bl);
  const br = averageRect(source, iw - corners, ih - corners, corners, corners);
  if (br) samples.push(br);

  if (samples.length === 0) return null;

  let R = 0,
    G = 0,
    B = 0,
    N = 0;
  for (const s of samples) {
    R += s.r;
    G += s.g;
    B += s.b;
    N += s.n;
  }

  return `rgb(${Math.round(R / N)}, ${Math.round(G / N)}, ${Math.round(B / N)})`;
}

async function sampleColorFromImageUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (typeof createImageBitmap === "function") {
      const bitmap = await createImageBitmap(blob);
      try {
        return sampleCardChromeColor(bitmap);
      } finally {
        bitmap.close();
      }
    }
    const objUrl = URL.createObjectURL(blob);
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("img"));
        img.src = objUrl;
      });
      return sampleCardChromeColor(img);
    } finally {
      URL.revokeObjectURL(objUrl);
    }
  } catch {
    return null;
  }
}

/**
 * Barva patičky z náhledu. Pokud existuje předpočet ze skriptu (Node + Sharp), použije se vždy —
 * v prohlížeči jinak často spadne CORS / canvas a zůstane šedý fallback.
 */
export function useImageChromeColor(
  imageUrl: string | undefined,
  fallback: string,
  precomputed?: string | null,
): string {
  const seed = precomputed && precomputed.length > 0 ? precomputed : fallback;
  const [color, setColor] = useState(seed);

  useEffect(() => {
    if (precomputed && precomputed.length > 0) {
      setColor(precomputed);
      return;
    }

    if (!imageUrl) {
      setColor(fallback);
      return;
    }

    let cancelled = false;

    const run = async () => {
      const sampled = await sampleColorFromImageUrl(imageUrl);
      if (!cancelled) setColor(sampled ?? fallback);
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [imageUrl, fallback, precomputed]);

  return color;
}
