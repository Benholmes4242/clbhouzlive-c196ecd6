import { CLOUDFLARE_STREAM_SUBDOMAIN } from '@/media/constants';

/**
 * Cloudflare Stream animated thumbnail URL.
 *
 * Verified GIF sizes across 4 real Clbhouz videos (Nov 2026):
 *   fps=8, dur=3s, h=316 → ~900KB–2.9MB (over budget)
 *   fps=6, dur=2s, h=316 → ~460KB–1.5MB (within ~800KB typical budget)
 * So the defaults chosen here are `fps=6, duration=2s`. Height is clamped
 * to a 480px ceiling (mobile tile 2x is more than enough).
 */
export interface AnimatedThumbnailOptions {
  /** Start time in seconds. Default 1s (skips likely-black first frame). */
  timeSeconds?: number;
  /** Loop duration in seconds. Default 2. */
  durationSeconds?: number;
  /** Frames per second. Default 6. */
  fps?: number;
}

export function getAnimatedThumbnailUrl(
  streamId: string,
  heightPx: number,
  opts: AnimatedThumbnailOptions = {},
): string {
  const h = Math.max(120, Math.min(Math.round(heightPx), 480));
  const time = opts.timeSeconds ?? 1;
  const duration = opts.durationSeconds ?? 2;
  const fps = opts.fps ?? 6;
  return (
    `https://${CLOUDFLARE_STREAM_SUBDOMAIN}/${streamId}/thumbnails/thumbnail.gif` +
    `?time=${time}s&duration=${duration}s&fps=${fps}&height=${h}`
  );
}
