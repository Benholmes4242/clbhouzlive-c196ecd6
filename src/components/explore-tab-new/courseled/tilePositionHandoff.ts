/**
 * TILE -> VIEWER POSITION HANDOFF (BRIEF_MOMENT_TILE_AUTOPLAY section 3).
 *
 * The mechanism already exists and this file does not build a second one: it
 * writes into VideoEngine's own session-scoped `lastPos` map, under the exact
 * key the fullscreen viewer reads back.
 *
 * THE KEY, PROVEN ON BOTH SIDES:
 *   VIEWER  src/components/feed/FeedSlide.tsx:1585  `const ownerKey = ${post.id}:${i}`
 *           (i = media index) -> passed to FullscreenVideoSlot -> :483
 *           `resumeKey = ownerKey ?? ...` -> :490 `VideoEngine.getLastPos(resumeKey)`.
 *           The single-media path (:234) passes `${post.id}:0`, the same shape.
 *   TILE    momentResumeKey() below produces `${postId}:${mediaIndex}`.
 * So a tile at media index 2 writes `<post>:2` and the viewer's page 2 reads
 * `<post>:2`. No suffix disagreement, and nothing relies on getLastPos's bare
 * `${postId}:0` fallback.
 */

import { VideoEngine } from '@/video/VideoEngine';

/** `${postId}:${mediaIndex}` — the viewer's ownerKey shape, exactly. */
export function momentResumeKey(postId: string, mediaIndex: number | undefined): string {
  return `${postId}:${mediaIndex ?? 0}`;
}

/**
 * Hand a tile's live currentTime to the viewer.
 *
 * A LOOPING TILE DOES NOT POISON THE POSITION. currentTime is a position within
 * the CURRENT loop, which is the right place to resume from, so it is written
 * as-is. A tile caught just after wrapping reports ~0, and the viewer's
 * `t > 0 ? t : ...` test then treats it as "no resume" and opens at 0 — which
 * is where that tile actually was. The one thing worth suppressing is a
 * SUB-FRAME value: 0.02s is not a position a member perceives, and writing it
 * would replace a real earlier position with noise.
 */
export function handOffTilePosition(key: string, currentTime: number): void {
  if (!Number.isFinite(currentTime) || currentTime <= 0.05) return;
  try {
    VideoEngine.lastPos.set(key, currentTime);
  } catch {
    /* engine not booted — the viewer simply opens at 0 */
  }
}
