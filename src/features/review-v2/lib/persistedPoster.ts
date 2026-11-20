/** Session-local posters stay in composer previews, never database writes or
 * readers. Reads filter stored values only and retain their surface's fallback;
 * writes supply a Stream thumbnail when no usable candidate remains. */
import { generateStreamThumbnailUrl } from '@/config/cloudflareStream';

export function isLocalPoster(url: string | null | undefined): boolean {
  return typeof url === 'string' && /^(blob:|data:|file:|capacitor:|filesystem:)/i.test(url);
}

export function usablePoster(url: string | null | undefined): string | null {
  return typeof url === 'string' && url.trim().length > 0 && !isLocalPoster(url) ? url : null;
}

export function persistedPoster(candidates: (string | null | undefined)[], streamId: string | null | undefined): string | null {
  const poster = candidates.map(usablePoster).find(candidate => candidate !== null);
  return poster ?? (streamId ? generateStreamThumbnailUrl(streamId) : null);
}