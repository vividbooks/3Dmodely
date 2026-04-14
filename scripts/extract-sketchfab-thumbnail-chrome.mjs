/**
 * Z náhledů Sketchfabu vypočte průměr rohů (jako v useImageChromeColor) a zapíše mapu uid → rgb().
 * Spuštění: node scripts/extract-sketchfab-thumbnail-chrome.mjs
 * Výstup: src/data/sketchfabThumbChrome.generated.ts
 */
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA_DIR = join(ROOT, "src/data");
const OUT = join(DATA_DIR, "sketchfabThumbChrome.generated.ts");
const DELAY_MS = Number(process.env.CHROME_DELAY_MS || 120);

const RE_MULTI =
  /sketchfabId:\s*"([a-fA-F0-9]+)"\s*,\s*\r?\n(\s*)thumbnailUrl:\s*\r?\n(\s*)"([^"]+)"/g;
const RE_SINGLE =
  /sketchfabId:\s*"([a-fA-F0-9]+)"\s*,\s*\r?\n(\s*)thumbnailUrl:\s*"([^"]+)"/g;
const RE_JSON =
  /"sketchfabId":\s*"([a-fA-F0-9]+)"\s*,\s*\r?\n(\s*)"thumbnailUrl":\s*"([^"]+)"/g;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function collectMapFromFile(text, map) {
  const patterns = [
    { re: RE_MULTI, urlIndex: 4 },
    { re: RE_SINGLE, urlIndex: 3 },
    { re: RE_JSON, urlIndex: 3 },
  ];
  for (const { re, urlIndex } of patterns) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) {
      map.set(m[1], m[urlIndex]);
    }
  }
}

async function sampleChrome(buffer) {
  const meta = await sharp(buffer).metadata();
  const w = meta.width ?? 1;
  const h = meta.height ?? 1;
  const edge = Math.max(10, Math.min(40, Math.round(0.12 * Math.min(w, h))));
  const corners = edge;

  const rects = [
    { left: 0, top: 0, width: Math.min(edge, w), height: Math.min(edge, h) },
    {
      left: Math.max(0, w - corners),
      top: 0,
      width: Math.min(corners, w),
      height: Math.min(corners, h),
    },
    {
      left: 0,
      top: Math.max(0, h - corners),
      width: Math.min(corners, w),
      height: Math.min(corners, h),
    },
    {
      left: Math.max(0, w - corners),
      top: Math.max(0, h - corners),
      width: Math.min(corners, w),
      height: Math.min(corners, h),
    },
  ];

  let R = 0,
    G = 0,
    B = 0,
    N = 0;
  for (const rect of rects) {
    const { data, info } = await sharp(buffer)
      .extract(rect)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const ch = info.channels;
    for (let i = 0; i < data.length; i += ch) {
      R += data[i];
      G += data[i + 1];
      B += data[i + 2];
    }
    N += data.length / ch;
  }
  return `rgb(${Math.round(R / N)}, ${Math.round(G / N)}, ${Math.round(B / N)})`;
}

async function main() {
  const map = new Map();
  for (const f of readdirSync(DATA_DIR)) {
    if (!f.endsWith(".ts") || f === "sketchfabThumbChrome.generated.ts") continue;
    collectMapFromFile(readFileSync(join(DATA_DIR, f), "utf8"), map);
  }

  const entries = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const out = {};
  let ok = 0;
  let fail = 0;

  for (const [uid, url] of entries) {
    try {
      const res = await fetch(url, { headers: { Accept: "image/*" } });
      if (!res.ok) throw new Error(String(res.status));
      const buf = Buffer.from(await res.arrayBuffer());
      out[uid] = await sampleChrome(buf);
      ok++;
      console.log(`OK ${uid.slice(0, 8)}… → ${out[uid]}`);
    } catch (e) {
      console.warn(`FAIL ${uid}: ${e.message}`);
      fail++;
    }
    await sleep(DELAY_MS);
  }

  const lines = Object.entries(out)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `  "${k}": "${v}",`)
    .join("\n");

  const ts = `/* eslint-disable */
/** Automaticky generováno — node scripts/extract-sketchfab-thumbnail-chrome.mjs (${ok} ok, ${fail} chyb) */

export const SKETCHFAB_THUMB_CHROME: Record<string, string> = {
${lines}
};
`;

  writeFileSync(OUT, ts, "utf8");
  console.log(`\nZapsáno ${OUT} (${ok} barev).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
