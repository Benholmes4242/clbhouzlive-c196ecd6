/**
 * MOMENT QUEUE — the post list the fullscreen viewer receives from the browse
 * surfaces (Discover's community section, the /community page, creator cards).
 *
 * THE DEFECT THIS CLOSES. Moments are per-MEDIA: one photo or clip of a
 * multi-media post is what earned the tile. The viewer, however, only targets
 * a specific media item on the slide the member TAPPED (SnapFeed passes
 * `mediaId` at `startIndex` and nothing else) — every other slide falls back to
 * `mediaItems[0]`. On the Clubhouse feed that is correct, because the feed's
 * posts are already grouped so item 0 IS the lead. On these surfaces it meant
 * swiping onto a post whose item 0 is a photo showed the photo, so the clip
 * that earned the tile never mounted the fullscreen lane and never autoplayed.
 *
 * THE QUEUE IS DEDUPED BY POST — a post is one slide, as in the feed, so slide
 * keys stay unique — and each queued post is ROTATED so the media that earned
 * its highest-ranked tile leads. Rotation, not filtering: the rest of the
 * post's media is still reachable in the viewer's horizontal pager, and
 * rotation preserves the author's relative order rather than re-sorting it.
 */
import type { FeedPost } from '@/components/media-system/types/media';
import type { Moment } from '@/components/explore-tab-new/courseled/hooks/useMomentsOfTheWeek';

/** Rotate `mediaItems` so `mediaId` leads. Unknown id → post unchanged. */
export function leadWithMedia(post: FeedPost, mediaId?: string | null): FeedPost {
  const items = post.mediaItems ?? [];
  if (!mediaId || items.length < 2) return post;
  const at = items.findIndex((m) => m.id === mediaId);
  if (at <= 0) return post;
  return { ...post, mediaItems: [...items.slice(at), ...items.slice(0, at)] };
}

/**
 * Ranked moments → the viewer's queue, one entry per post, each leading with
 * the media of that post's FIRST (best-ranked) moment in the list.
 */
export function buildMomentQueue(moments: Moment[]): FeedPost[] {
  const seen = new Set<string>();
  const out: FeedPost[] = [];
  for (const m of moments) {
    if (seen.has(m.post.id)) continue;
    seen.add(m.post.id);
    out.push(leadWithMedia(m.post, m.mediaId));
  }
  return out;
}
