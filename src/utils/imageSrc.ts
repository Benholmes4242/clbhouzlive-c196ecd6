/**
 * imageSrc — the one URL builder for post/avatar images.
 *
 * Images on media.clbhouz.co.uk are resized by Cloudflare Image
 * Transformations (zone-scoped on clbhouz.co.uk). `format=auto` negotiates on
 * the request's Accept header, so browsers receive AVIF/WebP — keep it.
 * Every other URL (blob:, data:, Stream thumbnails, other hosts) is returned
 * unchanged.
 */
const MEDIA_HOST = 'media.clbhouz.co.uk';

export const POST_IMAGE_WIDTHS = [480, 720, 1080, 1440] as const;

function parseMedia(url: string): URL | null {
  if (!url || url.startsWith('blob:') || url.startsWith('data:')) return null;
  try {
    const u = new URL(url);
    if (u.hostname !== MEDIA_HOST) return null;
    if (u.pathname.startsWith('/cdn-cgi/')) return null; // already transformed
    return u;
  } catch {
    return null;
  }
}

export function isTransformable(url: string | null | undefined): boolean {
  return !!url && parseMedia(url) !== null;
}

export function imageSrc(url: string, width: number): string;
export function imageSrc(url: string | null | undefined, width: number): string | undefined;
export function imageSrc(url: string | null | undefined, width: number): string | undefined {
  if (!url) return url ?? undefined;
  const u = parseMedia(url);
  if (!u) return url;
  const path = u.pathname.replace(/^\/+/, '');
  const w = Math.max(1, Math.round(width));
  return `${u.origin}/cdn-cgi/image/width=${w},format=auto,quality=80/${path}${u.search}`;
}

/** src/srcSet/sizes for a full-width post image. Non-media URLs get src only. */
export function postImageProps(url: string | null | undefined): {
  src: string | undefined;
  srcSet?: string;
  sizes?: string;
} {
  if (!url) return { src: undefined };
  if (!isTransformable(url)) return { src: url };
  return {
    src: imageSrc(url, 1080),
    srcSet: POST_IMAGE_WIDTHS.map((w) => `${imageSrc(url, w)} ${w}w`).join(', '),
    sizes: '100vw',
  };
}
