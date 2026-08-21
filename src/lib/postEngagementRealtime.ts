/**
 * postEngagementRealtime — the CONTENT half of the realtime notification path.
 *
 * THE FAULT THIS FIXES (BRIEF_REALTIME_COUNTS_AND_MENTION_TAP §A0): the live
 * `notifications` channel told the BADGE surfaces only. A like or a comment on
 * your post arrived as a toast while the count under the card sat still until
 * the app was force-restarted. The badge was live; the content was not.
 *
 * WHY THIS PATCHES AND DOES NOT INVALIDATE. The count on a card is
 * `post.commentCount` / `post.likeCount`, carried INSIDE the feed query's own
 * pages — there is no per-post count query to invalidate. Invalidating the feed
 * would refetch pages of rounds, media and enrichment on every notification,
 * which §A1 forbids and which is a worse bug than the one being fixed. So this
 * reads the two integers for ONE post and writes them into every registered
 * engagement cache with `patchEngagement`, exactly as the like mutation already
 * does. No refetch, no reorder, no per-post channel.
 *
 * ABSOLUTE, NEVER A DELTA. One comment that mentions the post's owner produces
 * TWO notification rows (a `comment` and a `mention`), so an increment would
 * count it twice. Truth from `posts` is idempotent.
 *
 * WHAT THIS DOES NOT COVER (§A3): `refetchOnMount: false` means an invalidation
 * of an UNMOUNTED query never acts. This path avoids that for the counts by
 * writing the cache directly, but the `comments-v2` invalidation below still
 * obeys it — a member sitting on another tab gets the counts, not a re-read
 * comment list. Full coverage is BRIEF_REFETCH_ON_MOUNT's job, not this one.
 */

import type { QueryClient } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { patchEngagement } from './engagementCache';
import { commentsKeys, commentsScope } from './queryKeys';

/** The notification row as it arrives on the realtime channel. */
export interface NotificationRealtimeRow {
  type?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  data?: Record<string, unknown> | null;
}

/**
 * The notification types that change a post's counts. Anything else — a legend,
 * a streak, a follow, a tour round-up — opens NO post read (ACCEPTANCE d).
 */
const POST_ENGAGEMENT_TYPES = new Set([
  'like',
  'comment',
  'reply',
  'comment_reply',
  'mention',
]);

/**
 * The post this notification is about, or null.
 *
 * MEASURED SHAPE, not a guess: `like` carries `data.post_id`; `comment` and
 * `reply` carry `data.post_id` plus `data.target_type: 'post'`; `mention`
 * carries `data.post_id` and `data.source_type: 'post'`. `entity_type: 'post'`
 * with `entity_id` is the fallback. A notification whose target is a round, a
 * course or a review resolves to null here and is left alone.
 */
export function postIdFromNotification(row: NotificationRealtimeRow): string | null {
  if (!row?.type || !POST_ENGAGEMENT_TYPES.has(row.type)) return null;

  const data = (row.data ?? {}) as Record<string, unknown>;
  const targetType = (data.target_type ?? data.source_type ?? row.entity_type) as
    | string
    | undefined;
  /* A mention in a REVIEW or a top-ten card carries no post_id; those rows fall
     through rather than being pushed onto the post path. */
  if (targetType && targetType !== 'post') return null;

  const postId = data.post_id ?? data.target_id ?? row.entity_id;
  return typeof postId === 'string' && postId.length > 0 ? postId : null;
}

/**
 * Read the two counts for one post and write them into every engagement cache.
 * Also invalidates that post's `comments-v2` family so an OPEN comment sheet
 * picks the new row up (the sheet's own channel already does this; this covers
 * the member who opens the sheet from the toast).
 */
export async function refreshPostEngagement(
  queryClient: QueryClient,
  postId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from('posts')
    .select('like_count, comment_count')
    .eq('id', postId)
    .maybeSingle();
  if (error || !data) return;

  patchEngagement(queryClient, postId, {
    likeCount: Number(data.like_count) || 0,
    commentCount: Number(data.comment_count) || 0,
  });

  queryClient.invalidateQueries({
    queryKey: commentsKeys.root(commentsScope('post', postId, null)),
    exact: false,
  });
}

/** Channel entry point: resolve the post, then refresh it. */
export function handleEngagementNotification(
  queryClient: QueryClient,
  row: NotificationRealtimeRow,
): void {
  const postId = postIdFromNotification(row);
  if (!postId) return;
  void refreshPostEngagement(queryClient, postId);
}
