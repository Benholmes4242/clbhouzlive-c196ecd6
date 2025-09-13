export type Media = { id: string; type: "image" | "video"; url: string; thumbUrl?: string };
export type Thumb = { id?: string; displaySrc: string; kind: "user" | "ph" };

// Build a Cloudflare Stream poster from a manifest URL.
export function streamPosterFrom(url?: string) {
  if (!url) return undefined;
  try { return url.replace(/\/manifest\/.*$/, "/thumbnails/thumbnail.jpg"); }
  catch { return undefined; }
}

// Ensure each media item has a renderable image (image.url or video.thumbUrl).
export function normalizeMedia(items: Media[]): Media[] {
  return items
    .map(m => (m.type === "video" && !m.thumbUrl)
      ? { ...m, thumbUrl: streamPosterFrom(m.url) }
      : m
    )
    .filter(m => (m.type === "image" ? !!m.url : !!m.thumbUrl));
}

// Compose a row using a shared `seen` set (prevents duplicates across the modal).
export function composeThumbRowGlobal(
  user: Media[],
  placeholders: string[],
  N: number,
  seen: Set<string>
): Thumb[] {
  const clean = normalizeMedia(user).filter(m => {
    const key = m.id || m.thumbUrl || m.url; // stable across rows/types
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, N);

  const userThumbs: Thumb[] = clean.map(m => ({
    id: m.id,
    displaySrc: m.type === "video" ? (m.thumbUrl as string) : m.url,
    kind: "user",
  }));

  const need = Math.max(0, N - userThumbs.length);
  const phThumbs: Thumb[] = placeholders.slice(0, need).map(src => ({ displaySrc: src, kind: "ph" }));

  return [...userThumbs, ...phThumbs];
}