/** Náhled k náhledu scény (stejný zdroj jako poster ve vieweru). */
export function supersplatPosterUrl(sceneId: string): string {
  return `https://s3-eu-west-1.amazonaws.com/images.playcanvas.com/splat/${sceneId}/v2/xl.webp`;
}

export function supersplatSceneIdFromEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const id = u.searchParams.get("id");
    return id && /^[a-f0-9]+$/i.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function canonicalSupersplatEmbedUrl(sceneId: string): string {
  return `https://superspl.at/s?id=${sceneId}`;
}
