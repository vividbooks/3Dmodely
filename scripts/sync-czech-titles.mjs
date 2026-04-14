/**
 * Aktualizuje title u modelů podle českých názvů z osnovy VividBoard (data.notes.chapter).
 * Spuštění: node scripts/sync-czech-titles.mjs
 */
import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => {
        if (res.statusCode >= 400)
          reject(new Error(`${res.statusCode} ${url} ${d.slice(0, 120)}`));
        else resolve(d);
      });
    }).on("error", reject);
  });
}

function decodeChapter(s) {
  if (!s || typeof s !== "string") return null;
  const t = s.replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
  return t || null;
}

function walkStrings(obj, cb) {
  if (typeof obj === "string") {
    cb(obj);
    return;
  }
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    obj.forEach((x) => walkStrings(x, cb));
    return;
  }
  for (const v of Object.values(obj)) walkStrings(v, cb);
}

/** Parsování z reálných HTML řetězců v JSON (ne ze stringify, kde jsou \\\"). */
function extractOrderedSfTitles(boardJson) {
  const pages = boardJson.content?.pages || [];
  const order = [];
  const seen = new Set();
  for (const page of pages) {
    const chapter = decodeChapter(page.data?.notes?.chapter);
    walkStrings(page, (s) => {
      if (!s.includes("sketchfab.com/models/")) return;
      const iframeRe = /<iframe([^>]+)>/gi;
      let im;
      while ((im = iframeRe.exec(s)) !== null) {
        const tag = im[1];
        const srcM = tag.match(/src=["']([^"']+)["']/i);
        if (!srcM) continue;
        const idM = srcM[1].match(/sketchfab\.com\/models\/([a-f0-9]+)\//i);
        if (!idM) continue;
        const sketchfabId = idM[1];
        if (seen.has(sketchfabId)) continue;
        seen.add(sketchfabId);
        const titleM = tag.match(/title=["']([^"']*)["']/i);
        const iframeTitle = titleM ? titleM[1].replace(/&amp;/g, "&") : null;
        const title = chapter || iframeTitle || "Model";
        order.push({ sketchfabId, title });
      }
    });
  }
  const counts = {};
  const map = {};
  for (const { sketchfabId, title } of order) {
    const base = title;
    counts[base] = (counts[base] || 0) + 1;
    const n = counts[base];
    map[sketchfabId] = n === 1 ? base : `${base} (${n})`;
  }
  return map;
}

async function fetchTitleMap(boardId) {
  const raw = await get(`https://api.vividboard.cz/boards/${boardId}?all=true`);
  const j = JSON.parse(raw);
  return extractOrderedSfTitles(j);
}

function extractModelsArray(content, boardId, boardKeyQuoted) {
  const marker = boardKeyQuoted ? `"id": "${boardId}"` : `id: "${boardId}"`;
  let idx = 0;
  const ranges = [];
  while ((idx = content.indexOf(marker, idx)) !== -1) {
    const modelsKey = content.indexOf("models: [", idx);
    const modelsKeyQ = content.indexOf('"models": [', idx);
    const mk =
      modelsKey === -1
        ? modelsKeyQ
        : modelsKeyQ === -1
          ? modelsKey
          : Math.min(modelsKey, modelsKeyQ);
    if (mk === -1 || mk > idx + 1200) {
      idx += marker.length;
      continue;
    }
    const arrStart = content.indexOf("[", mk);
    let depth = 0;
    let end = arrStart;
    for (let i = arrStart; i < content.length; i++) {
      const ch = content[i];
      if (ch === "[") depth++;
      else if (ch === "]") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    ranges.push({ start: arrStart, end: end + 1 });
    idx = end + 1;
  }
  return ranges;
}

function patchModelsSlice(slice, sfToTitle, style) {
  if (style === "quoted") {
    return slice.replace(
      /("title":\s*)"([^"]*)"(,\s*\n\s*"sketchfabId":\s*")([a-f0-9]+)(")/g,
      (m, pre, _old, mid, sfId, post) => {
        const t = sfToTitle[sfId];
        return t !== undefined ? `${pre}${JSON.stringify(t)}${mid}${sfId}${post}` : m;
      },
    );
  }
  return slice.replace(
    /(title:\s*)"([^"]*)"(,\s*\n\s*sketchfabId:\s*")([a-f0-9]+)(")/g,
    (m, pre, _old, mid, sfId, post) => {
      const t = sfToTitle[sfId];
      return t !== undefined ? `${pre}${JSON.stringify(t)}${mid}${sfId}${post}` : m;
    },
  );
}

/** Od nejpozdějších rozsahů, aby indexy zůstaly platné. */
function patchFileContent(content, boardIds, maps, style, boardKeyQuoted) {
  const allRanges = [];
  for (const bid of boardIds) {
    for (const r of extractModelsArray(content, bid, boardKeyQuoted))
      allRanges.push({ ...r, boardId: bid });
  }
  allRanges.sort((a, b) => b.start - a.start);
  let out = content;
  for (const { start, end, boardId } of allRanges) {
    const slice = out.slice(start, end);
    const sfToTitle = maps[boardId];
    if (!sfToTitle) continue;
    const patched = patchModelsSlice(slice, sfToTitle, style);
    out = out.slice(0, start) + patched + out.slice(end);
  }
  return out;
}

const JOBS = [
  {
    rel: "src/data/kosterni-soustava.ts",
    style: "ts",
    boardKeyQuoted: false,
    boardIds: ["7ad35020-c71b-4b96-9b7f-18d6ce6f0750"],
  },
  {
    rel: "src/data/svalova-soustava.ts",
    style: "ts",
    boardKeyQuoted: false,
    boardIds: ["d93a51af-4383-4e02-a84b-dc9f8aae8bef"],
  },
  {
    rel: "src/data/cesta-kysliku.ts",
    style: "ts",
    boardKeyQuoted: false,
    boardIds: ["28ad49ed-ae51-4fb8-98f9-e69f5f51d4f5"],
  },
  {
    rel: "src/data/vznik-zivota.ts",
    style: "ts",
    boardKeyQuoted: false,
    boardIds: [
      "66117f43-c21d-4e32-a290-7a092424a951",
      "7ef843d6-4736-4040-96a6-de9fe6210ca0",
      "726cec96-7ca6-406e-ba24-aeb94e78df53",
      "7c7ea511-8125-46d1-908d-b288788e15b7",
      "3b0e858a-a5de-41cd-ac86-21c4ffbcf042",
    ],
  },
  {
    rel: "src/data/bezobratli-zivocichove.ts",
    style: "ts",
    boardKeyQuoted: false,
    boardIds: [
      "00259d61-d2c1-4b17-9499-d4e2e604ace6",
      "ccf1ee6a-3a5f-4f9a-a624-82b78f8703eb",
      "f7704a92-6494-4cfa-bc3f-1a193044ad90",
      "8f8d3215-6f56-43f1-9b7c-ac6588c98371",
      "62d13baf-7bc4-4a80-a96c-4b6df43afd1b",
      "776ae797-7c6a-4d74-8bd3-7ad5fe329032",
      "2da89f76-c5f7-4fb6-9336-163ff1830c5c",
      "20763d14-9257-4ac4-aa0c-10d991a998b4",
    ],
  },
  {
    rel: "src/data/obratlovci.ts",
    style: "ts",
    boardKeyQuoted: false,
    boardIds: [
      "640abaea-425c-4afd-93fc-9972d7fb30ff",
      "54369657-2272-47f6-adad-26535fc82ee2",
      "6a0f3a86-0f80-4f47-ba8c-9f5770cef355",
      "b5816ec5-84e2-4199-9a1d-f081dfd251f5",
      "2120a3e6-1082-499e-a0b4-9574105e05ee",
      "c4198ec8-4157-488c-ba28-f768f9708ef4",
      "2e5dcdda-ac38-4fa1-8da4-a47dd0bdbc14",
      "65485299-c167-4e7a-9565-399fb0c1ddef",
      "ae9033ad-a05e-4e77-888a-2dbe2910b019",
      "9616ac3f-1288-4698-b05f-7f78d6632140",
      "e2f95c35-c0a4-4900-875e-36e88faa6c69",
      "0bcc635d-334d-44f7-adc6-6656ca05bc91",
      "7dcc3b45-b043-4edf-98c6-0f1b2263fc04",
    ],
  },
  {
    rel: "src/data/clovek-boards-additions.ts",
    style: "quoted",
    boardKeyQuoted: true,
    boardIds: [
      "1746a596-7fea-4591-bdb6-07d1b63b2559",
      "f2a0ff00-f77f-4c38-908a-1324186ecbc7",
      "b69c6a0f-dace-45eb-900f-6a06e963c63a",
      "74152adb-c489-4d80-a525-149cc15ab58b",
      "3c1df5ea-b25f-4493-aefd-8a86acb21e3f",
      "526079c6-d7f1-4243-a67d-21c3a382251c",
      "44c02e29-8c3b-430a-ae32-e184bd581b39",
      "a72f2098-dc2e-4046-bfcb-5867fdebbc4a",
      "644e1c83-9275-4e84-ad2a-b3f2d50077c9",
      "c7057342-a84e-438c-9e94-2a479757b0a4",
    ],
  },
];

const allIds = [...new Set(JOBS.flatMap((j) => j.boardIds))];
console.error("Fetching", allIds.length, "boards (sequential)…");
const maps = {};
for (const id of allIds) {
  const m = await fetchTitleMap(id);
  maps[id] = m;
  console.error(id, Object.keys(m).length, "models");
}

for (const job of JOBS) {
  const fp = path.join(root, job.rel);
  let content = fs.readFileSync(fp, "utf8");
  const style = job.style === "quoted" ? "quoted" : "ts";
  content = patchFileContent(
    content,
    job.boardIds,
    maps,
    style,
    job.boardKeyQuoted,
  );
  fs.writeFileSync(fp, content);
  console.error("patched", job.rel);
}

console.error("done");
