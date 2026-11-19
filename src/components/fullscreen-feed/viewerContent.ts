/** Viewer content hydration owns batch reads for source-post actions and missing
 * review scores. Synthetic media identity never becomes a mutation target;
 * post engagement uses the feed's registered cache and actor matching. */
import type { FeedPost, MediaItem } from '@/components/media-system/types/media';
import { supabase } from '@/integrations/supabase/client';
import { isReactionByActor, resolveReactionActor } from '@/lib/reactionActor';

export function viewerPostId(post: FeedPost, item?: MediaItem | null): string | null {
  if (item?.memberShot) return item.memberShot.sourcePostId ?? null;
  if (post.id.startsWith('shots:') || post.id.startsWith('library:')) return null;
  return post.engagementTarget?.type === 'review' ? null : post.id;
}

export function viewerPostIds(posts: readonly FeedPost[]): string[] {
  return [...new Set(posts.flatMap(post => post.mediaItems.length
    ? post.mediaItems.flatMap(item => viewerPostId(post, item) ?? [])
    : viewerPostId(post) ?? []))].sort();
}

export async function readViewerPosts(ids: readonly string[], userId?: string, activeActor?: { type: string; id: string } | null) {
  if (!ids.length) return [];
  const [postRead, likeRead] = await Promise.all([
    supabase.from('posts').select('id, user_id, actor_type, actor_id, content, created_at, like_count, comment_count').in('id', [...ids]),
    (async () => userId ? await supabase.from('post_likes').select('post_id, user_id, actor_type, actor_id').in('post_id', [...ids]).eq('user_id', userId) : { data: [], error: null })(),
  ]);
  if (postRead.error) throw postRead.error;
  if (likeRead.error) throw likeRead.error;
  const actor = resolveReactionActor(activeActor, userId);
  return (postRead.data ?? []).map(row => ({
    id: row.id, userId: row.user_id, actorId: row.actor_id ?? row.user_id,
    actorType: row.actor_type === 'business' ? 'business' as const : 'personal' as const,
    caption: row.content ?? '', createdAt: row.created_at,
    likeCount: row.like_count ?? 0, commentCount: row.comment_count ?? 0,
    isLikedByMe: (likeRead.data ?? []).some(like => like.post_id === row.id && isReactionByActor(like, actor.type, actor.id)),
  }));
}

export function missingReviewScoreIds(posts: readonly FeedPost[]): string[] {
  return [...new Set(posts.flatMap(post => {
    const review = post.review;
    return post.isReview && review?.rating != null && review.reviewId &&
      (!review.breakdown || Object.values(review.breakdown).every(value => value == null)) ? [review.reviewId] : [];
  }))].sort();
}

export async function readViewerReviewScores(ids: readonly string[]) {
  if (!ids.length) return [];
  const { data, error } = await supabase.from('course_ratings')
    .select('id, design_score, condition_score, clubhouse_score, facilities_score').in('id', [...ids]);
  if (error) throw error;
  return (data ?? []).map(row => ({ id: row.id, breakdown: {
    design: row.design_score, conditions: row.condition_score,
    clubhouse: row.clubhouse_score, facilities: row.facilities_score,
  } }));
}