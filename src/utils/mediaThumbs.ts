// utils/mediaThumbs.ts
export type Media = { id: string; type: "image" | "video"; url: string; thumbUrl?: string };
export type Thumb = { id?: string; displaySrc: string; kind: "user" | "ph" };

// Turn a Cloudflare Stream manifest into a poster image.
// IMPORTANT: Use fit=crop (NOT fit=cover) - Cloudflare Stream only supports: clip, scale, crop, fill, fillmax
export function streamPosterFrom(url?: string) {
  if (!url) return undefined;
  try { return url.replace(/\/manifest\/.*$/, "/thumbnails/thumbnail.jpg?time=1s&fit=crop"); }
  catch { return undefined; }
}

/**
 * Build a thumbnail URL for images with size constraints
 * Optimizes memory by loading resized versions instead of full-res
 */
export function buildImageThumbnailUrl(
  url: string | null | undefined,
  {
    width = 600,
    height = 600,
    fit = 'cover',
  }: { width?: number; height?: number; fit?: 'cover' | 'contain' } = {}
): string {
  if (!url) return '/placeholder.svg';

  // For blob URLs (local files), return as-is since we can't transform them
  if (url.startsWith('blob:')) return url;

  // Cloudflare Stream thumbnail endpoints do NOT support generic image transform params.
  // If we append width/height/fit, they can 400 and spam logs.
  const isStreamThumb =
    /\/thumbnails\/thumbnail\.jpg/i.test(url) &&
    (url.includes('videodelivery.net') || url.includes('cloudflarestream.com'));

  if (isStreamThumb) return url;

  const sep = url.includes('?') ? '&' : '?';

  // Add transformation params (works with Cloudflare R2/Images)
  return `${url}${sep}width=${width}&height=${height}&fit=${fit}`;
}

/**
 * Build a poster/thumbnail URL for videos
 * Returns a still frame instead of loading the video stream
 */
export function buildVideoPosterUrl(
  url: string | null | undefined,
  {
    width = 600,
    height = 600,
  }: { width?: number; height?: number } = {}
): string {
  if (!url) return '/placeholder.svg';

  // For blob URLs (local files), return as-is
  if (url.startsWith('blob:')) return url;

  // If this is already a Stream thumbnail URL, don't append generic params.
  if (/\/thumbnails\/thumbnail\.jpg/i.test(url)) return url;

  // Check if this is a Cloudflare Stream URL
  if (url.includes('cloudflarestream.com') || url.includes('customer-')) {
    return streamPosterFrom(url) || url;
  }

  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}width=${width}&height=${height}&fit=cover`;
}

// Ensure every item has a renderable image (image.url or video.thumbUrl).
export function normalizeMedia(items: Media[]): Media[] {
  return items
    .map(m => (m.type === "video" && !m.thumbUrl)
      ? { ...m, thumbUrl: streamPosterFrom(m.url) }
      : m
    )
    .filter(m => (m.type === "image" ? !!m.url : !!m.thumbUrl));
}

// Build a row using a shared `seen` set to prevent duplicates across the modal.
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