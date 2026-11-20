/** A local blob: or data: frame is for the composer's own preview tile only
 * and is never saved or displayed from the database. Review poster writes and
 * readers share this boundary so session-local frames cannot escape it. */
import { generateStreamThumbnailUrl } from '@/config/cloudflareStream';

export function persistedPoster(candidates: (string | null | undefined)[], streamId: string | null | undefined): string | null {
  const poster = candidates.find(candidate => candidate?.startsWith('https://') || candidate?.startsWith('http://'));
  return poster ?? (streamId ? generateStreamThumbnailUrl(streamId) : null);
}