import type { CatalogModel } from "../types";
import { sketchfabEmbedUrl } from "./sketchfab";

export function catalogModelEmbedSrc(m: CatalogModel): string {
  if (m.supersplatEmbedUrl) return m.supersplatEmbedUrl;
  if (m.sketchfabId) return sketchfabEmbedUrl(m.sketchfabId);
  return "";
}

export function catalogModelEmbedKey(m: CatalogModel): string {
  return m.supersplatEmbedUrl ?? m.sketchfabId ?? m.id;
}
