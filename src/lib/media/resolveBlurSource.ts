/**
 * resolveBlurSource — single-sourced blur backdrop URL resolver for
 * fullscreen video surrounds (borrow slot, lane slot, pager active page,
 * overlay clone). Guarantees the "blur + 0.55 scrim" surround rule
 * (see FeedSlide.BorrowedFullscreenSlot for the rule statement) never
 * degrades to solid black just because one field on the media row is empty.
 *
 * Fallback chain (ordered):
 *   1) mediaItem.thumbnailUrl        — the field already used everywhere
 *   2) mediaItem.posterUrl / .poster — draft/scheduled-post pipelines
 *   3) generateStreamThumbnailUrl(streamId) — derive from the CF Stream uid
 *   4) parse streamId from hlsUrl and derive from that
 *
 * If every rung is empty we return null AND emit a `[DECIDE] blurSource.missing`
 * log so we can quantify how often legacy content lacks any usable source.
 * The caller then falls back to scrim-over-slide-root (a genuine last resort).
 */

import { generateStreamThumbnailUrl } from '@/config/cloudflareStream';

export interface BlurSourceInput {
  postId?: string;
  mediaId?: string;
  thumbnailUrl?: string | null;
  posterUrl?: string | null;
  poster?: string | null;
  streamId?: string | null;
  hlsUrl?: string | null;
}

const HLS_STREAM_ID_RE = /\/([a-f0-9]{20,})\/manifest\/video\.m3u8/i;

export function resolveBlurSource(input: BlurSourceInput): string | null {
  const t = (input.thumbnailUrl ?? '').trim();
  if (t) return t;

  const p = (input.posterUrl ?? input.poster ?? '').trim();
  if (p) return p;

  const sid = (input.streamId ?? '').trim();
  if (sid) {
    try { return generateStreamThumbnailUrl(sid); } catch { /* fall through */ }
  }

  const hls = (input.hlsUrl ?? '').trim();
  if (hls) {
    const m = HLS_STREAM_ID_RE.exec(hls);
    if (m?.[1]) {
      try { return generateStreamThumbnailUrl(m[1]); } catch { /* fall through */ }
    }
  }

  // eslint-disable-next-line no-console
  console.info('[DECIDE]', 'blurSource.missing', {
    postId: input.postId,
    mediaId: input.mediaId,
  });
  return null;
}
