/**
 * fsv2 public types.
 *
 * OpenOptions mirrors the v1 OpenOptions shape so callers can pass the same
 * object. Phase 1 reads a subset (posts, startIndex, mediaIndex/mediaId,
 * onClose, startPosition, openedFrom); the rest are accepted, stored, and
 * ignored — signature stays stable through Phase 2.
 *
 * `origin` and `borrow` from v1 are dropped by design: fsv2 has no FLIP and
 * no shared VideoEngine lanes.
 */

import type { FeedPost } from '@/components/media-system/types/media';

export interface Fsv2OpenOptions {
  posts: FeedPost[];
  startIndex?: number;

  /** Positional fallback; `mediaId` is authoritative when both present. */
  mediaIndex?: number;
  mediaId?: string | null;

  /** Required. Dev-warns and refuses the open when null/undefined/''. */
  openedFrom: string;

  onClose?: () => void;

  /** Resume seed for video, in seconds. */
  startPosition?: number;

  // ── Phase 2 fields (accepted, stored, not yet read) ─────────────────
  openCommentsInitially?: boolean;
  initialCommentId?: string | null;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  isFetchingNextPage?: boolean;
  readOnly?: boolean;
}
