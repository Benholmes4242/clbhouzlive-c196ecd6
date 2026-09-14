/**
 * A WRITE THAT NEVER HAPPENS LEAVES NO TRACE. A column that can be silently
 * skipped will be.
 *
 * This file exists because of an eight-week fault. The post-v2 upload
 * controller wrote poster_url with a conditional spread:
 *
 *     ...(posterUrl ? { poster_url: posterUrl } : {})
 *
 * poster_timestamp was NULL on every row after 2026-07-21 (no member picks a
 * frame), so posterUrl was always falsy, so the column was never written. No
 * error, no log, no failed request - just an absence that reads as a correct
 * state. 22 video rows landed with no still.
 *
 * ONE DEFINITION OF THE POSTER URL. Both upload paths (postUploadController
 * runVideo, and the legacy uploadPipeline) and the SQL backfill in
 * docs/sql/post_media_poster_backfill.sql must agree on this exact URL shape.
 * If it changes here, the backfill draft changes with it.
 *
 * Shape produced (via getThumbnailUrl, the single URL builder):
 *   https://<stream-subdomain>/<streamId>/thumbnails/thumbnail.jpg?height=<h>&fit=crop
 *   ...&time=<n>s   (only when a non-default frame time is used)
 */

import { getThumbnailUrl } from '@/utils/thumbnail';

/** Height the post composer writes. The legacy pipeline passes 720 to keep its
 *  deployed output byte-identical to what it has always written. */
export const POSTER_DEFAULT_HEIGHT = 1080;

export interface DerivePosterInput {
  streamId: string;
  /** Member's chosen frame, in seconds. Null/0 means they chose nothing. */
  posterTimestamp?: number | null;
  /** Clip duration, seconds. Used for the midpoint default (see below). */
  durationSeconds?: number | null;
  height?: number;
}

/**
 * Always returns a URL when a streamId exists. Never returns null - a video row
 * with a stream_id must never be written with a null poster_url.
 *
 * Frame choice: the member's picked timestamp wins. Otherwise the video
 * MIDPOINT (duration/2, floor, min 1s) - first-frame stills are usually a black
 * fade-in. This mirrors the legacy pipeline's behaviour exactly.
 */
export function derivePosterUrl({
  streamId,
  posterTimestamp,
  durationSeconds,
  height = POSTER_DEFAULT_HEIGHT,
}: DerivePosterInput): string {
  const chosen =
    typeof posterTimestamp === 'number' && posterTimestamp > 0 ? posterTimestamp : null;
  const midpoint =
    typeof durationSeconds === 'number' && durationSeconds > 0
      ? Math.max(1, Math.floor(durationSeconds / 2))
      : 1;
  const time = chosen ?? midpoint;
  return getThumbnailUrl({ streamId, height, time, fit: 'crop' });
}
