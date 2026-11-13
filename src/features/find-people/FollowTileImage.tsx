/** Settled source priority and failure walk live here; no autoplay or player
 * is allowed. URL-keyed failures survive unrelated rail renders. */
import { useState } from 'react';
import type { FollowTileMedia } from './useFollowTileMedia';
export function useFollowTileSource(media: FollowTileMedia | undefined, cover: string | undefined, settled: boolean) {
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set());
  const source = !settled ? null : media?.image_url && !failed.has(media.image_url)
    ? { url: media.image_url, media } : cover && !failed.has(cover) ? { url: cover, media: null } : null;
  return { source, fail: () => { if (source) setFailed(prev => new Set(prev).add(source.url)); } };
}