/**
 * Doplní prázdné thumbnailUrl nebo (--refresh) znovu načte všechny náhledy ze Sketchfab API.
 *   npm run thumbnails:fetch
 *   npm run thumbnails:refresh-clovek
 * THUMB_DELAY_MS, SKETCHFAB_API_TOKEN — jako dřív.
 */
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../src/data");
const DELAY_MS = Number(process.env.THUMB_DELAY_MS || 400);
const SKETCHFAB_HEADERS = {};
if (process.env.SKETCHFAB_API_TOKEN) {
  SKETCHFAB_HEADERS.Authorization = `Token ${process.env.SKETCHFAB_API_TOKEN}`;
}

const UID_EMPTY_THUMB =
  /sketchfabId:\s*"([a-fA-F0-9]+)"\s*,\s*\r?\n(\s*)thumbnailUrl:\s*""/;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchThumbnail(uid) {
  const res = await fetch(`https://api.sketchfab.com/v3/models/${uid}`, {
    headers: SKETCHFAB_HEADERS,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const data = await res.json();
  const imgs = data.thumbnails?.images || [];
  if (!imgs.length) {
    throw new Error("žádné náhledy v odpovědi");
  }
  const by720 = imgs.find((i) => i.width === 720);
  const by256 = imgs.find((i) => i.width === 256);
  const pick = by720 || by256 || imgs[imgs.length - 1];
  if (!pick?.url) {
    throw new Error("chybí url náhledu");
  }
  return pick.url;
}

function escapeUrlForTs(url) {
  return url.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

async function processFile(relPath) {
  const filePath = join(DATA_DIR, relPath);
  let text = readFileSync(filePath, "utf8");
  if (!text.includes('thumbnailUrl: ""')) {
    return { file: relPath, filled: 0, failed: 0, skipped: true };
  }

  let filled = 0;
  let failed = 0;
  let searchFrom = 0;

  while (true) {
    const sub = text.slice(searchFrom);
    const m = UID_EMPTY_THUMB.exec(sub);
    if (!m) break;

    const absIndex = searchFrom + m.index;
    const uid = m[1];
    const indent = m[2];
    const matchLen = m[0].length;

    try {
      const thumbUrl = await fetchThumbnail(uid);
      const esc = escapeUrlForTs(thumbUrl);
      const replacement = `sketchfabId: "${uid}",\n${indent}thumbnailUrl: "${esc}"`;
      text = text.slice(0, absIndex) + replacement + text.slice(absIndex + matchLen);
      searchFrom = absIndex + replacement.length;
      filled++;
      console.log(`  ✓ ${uid.slice(0, 8)}… → ${thumbUrl.slice(0, 72)}…`);
    } catch (e) {
      console.warn(`  ✗ ${uid}: ${e.message}`);
      searchFrom = absIndex + matchLen;
      failed++;
    }

    await sleep(DELAY_MS);
  }

  if (filled > 0 || failed > 0) {
    writeFileSync(filePath, text, "utf8");
  }

  return { file: relPath, filled, failed, skipped: false };
}

const RE_MULTI_LINE_THUMB =
  /sketchfabId:\s*"([a-fA-F0-9]+)"\s*,\s*\r?\n(\s*)thumbnailUrl:\s*\r?\n(\s*)"[^"]*"/;
const RE_JSON_LINE_THUMB =
  /"sketchfabId":\s*"([a-fA-F0-9]+)"\s*,\s*\r?\n(\s*)"thumbnailUrl":\s*"[^"]*"/;

async function refreshAllThumbnailsInFile(relPath) {
  const filePath = join(DATA_DIR, relPath);
  let text = readFileSync(filePath, "utf8");
  let updated = 0;
  let failed = 0;

  const runPass = async (re, buildReplacement) => {
    let searchFrom = 0;
    while (true) {
      const sub = text.slice(searchFrom);
      const m = re.exec(sub);
      if (!m) break;
      const uid = m[1];
      const absIndex = searchFrom + m.index;
      const matchLen = m[0].length;
      try {
        const thumbUrl = await fetchThumbnail(uid);
        const esc = escapeUrlForTs(thumbUrl);
        const replacement = buildReplacement(m, uid, esc);
        text = text.slice(0, absIndex) + replacement + text.slice(absIndex + matchLen);
        searchFrom = absIndex + replacement.length;
        updated++;
        console.log(`  ✓ ${uid.slice(0, 8)}…`);
      } catch (e) {
        console.warn(`  ✗ ${uid}: ${e.message}`);
        searchFrom = absIndex + matchLen;
        failed++;
      }
      await sleep(DELAY_MS);
    }
  };

  await runPass(RE_MULTI_LINE_THUMB, (m, uid, esc) => {
    return `sketchfabId: "${uid}",\n${m[2]}thumbnailUrl:\n${m[3]}"${esc}"`;
  });
  await runPass(RE_JSON_LINE_THUMB, (m, uid, esc) => {
    return `"sketchfabId": "${uid}",\n${m[2]}"thumbnailUrl": "${esc}"`;
  });

  if (updated > 0) {
    writeFileSync(filePath, text, "utf8");
  }
  return { updated, failed };
}

const argv = process.argv.slice(2);
const refreshMode = argv.includes("--refresh");
const only = argv.filter((a) => !a.startsWith("-"));
const CLOVEK_FILES = [
  "kosterni-soustava.ts",
  "svalova-soustava.ts",
  "cesta-kysliku.ts",
  "clovek-boards-additions.ts",
];

async function main() {
  if (refreshMode) {
    const files = only.length ? only : CLOVEK_FILES;
    let total = 0;
    let fail = 0;
    console.log(`Obnova náhledů (--refresh): ${files.join(", ")}`);
    for (const f of files) {
      console.log(`\n${f}`);
      const r = await refreshAllThumbnailsInFile(f);
      total += r.updated;
      fail += r.failed;
    }
    console.log(`\nHotovo: aktualizováno ${total}, chyb ${fail}.`);
    return;
  }

  const files = only.length
    ? only
    : readdirSync(DATA_DIR).filter((f) => f.endsWith(".ts"));

  const targets = files.filter((f) => {
    if (!f.endsWith(".ts")) return false;
    const p = join(DATA_DIR, f);
    try {
      return readFileSync(p, "utf8").includes('thumbnailUrl: ""');
    } catch {
      return false;
    }
  });

  console.log(`Soubory s prázdným thumbnailUrl: ${targets.join(", ") || "(žádné)"}`);
  let totalFilled = 0;
  let totalFailed = 0;

  for (const f of targets) {
    console.log(`\n${f}`);
    const r = await processFile(f);
    totalFilled += r.filled;
    totalFailed += r.failed;
  }

  console.log(`\nHotovo: doplněno ${totalFilled} náhledů, neúspěch ${totalFailed}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
