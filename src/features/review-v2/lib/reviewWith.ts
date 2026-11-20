/** Review Played with mirrors postWith writes/reads; notifications belong only
 * to the database trigger. The temporary table cast preserves that shared
 * client contract until generated Supabase types include review_with. */
import { supabase } from '@/integrations/supabase/client';
import { fillMissingFaces } from '@/lib/members/readMemberFaces';
import { MAX_PLAYED_WITH } from '@/features/post-v2/lib/golfPostRules';
import type { PostWithError, PostWithPerson } from '@/features/post-v2/lib/postWith';

interface ReviewWithRow { review_id: string; user_id: string; created_at?: string }
interface ReviewWithQuery extends PromiseLike<{ data: ReviewWithRow[] | null; error: PostWithError | null }> {
  insert(rows: ReviewWithRow[]): ReviewWithQuery;
  delete(): ReviewWithQuery;
  select(columns: string): ReviewWithQuery;
  eq(column: string, value: string): ReviewWithQuery;
  in(column: string, values: readonly string[]): ReviewWithQuery;
  order(column: string): ReviewWithQuery;
}
export const reviewWithTable = () => (supabase as unknown as { from(table: 'review_with'): ReviewWithQuery }).from('review_with');
const errorFields = ({ code, message, details, hint }: PostWithError): PostWithError => ({ code, message, details, hint });

/** Written after the review exists. Never self, never past eight. */
export async function writeReviewWith(reviewId: string, authorId: string, userIds: readonly string[]): Promise<{ saved: string[]; error: PostWithError | null }> {
  const ids = [...new Set(userIds)].filter(id => id !== authorId).slice(0, MAX_PLAYED_WITH);
  if (!ids.length) return { saved: [], error: null };
  const { error } = await reviewWithTable().insert(ids.map(user_id => ({ review_id: reviewId, user_id })));
  if (error) { console.warn('[review-v2] review_with write failed:', error); return { saved: [], error: errorFields(error) }; }
  return { saved: ids, error: null };
}

export async function syncReviewWith(reviewId: string, authorId: string, prev: readonly string[], next: readonly string[]): Promise<PostWithError | null> {
  const removed = prev.filter(id => !next.includes(id));
  const added = next.filter(id => !prev.includes(id));
  if (removed.length) {
    const { error } = await reviewWithTable().delete().eq('review_id', reviewId).in('user_id', removed);
    if (error) { console.warn('[review-v2] review_with remove failed:', error); return errorFields(error); }
  }
  if (added.length) return (await writeReviewWith(reviewId, authorId, added.slice(0, Math.max(0, MAX_PLAYED_WITH - (prev.length - removed.length))))).error;
  return null;
}

export async function removeMeFromReview(reviewId: string, memberId: string): Promise<void> {
  const { data, error } = await reviewWithTable().delete().eq('review_id', reviewId).eq('user_id', memberId).select('review_id');
  if (error) throw error;
  if (!data?.length) throw new Error("You couldn't be removed from this review.");
}

export interface ReviewWithPerson extends Omit<PostWithPerson, 'postId'> { reviewId: string }

/** ONE read for a page of reviews, plus the same profile/face fallback as posts. */
export async function readReviewWith(reviewIds: readonly string[]): Promise<ReviewWithPerson[]> {
  if (!reviewIds.length) return [];
  const { data, error } = await reviewWithTable().select('review_id, user_id, created_at').in('review_id', reviewIds as string[]).order('created_at');
  if (error || !data?.length) return [];
  const rows = data as unknown as Array<{ review_id: string; user_id: string }>;
  const ids = [...new Set(rows.map(r => r.user_id))];
  const { data: visible } = await supabase.from('user_profiles').select('id, display_name, first_name, username, profile_photo_url').in('id', ids);
  const profiles = await fillMissingFaces(visible as Array<{ id: string; display_name: string | null; first_name?: string | null; username: string | null; profile_photo_url: string | null }> | null, ids, ['first_name']);
  const byId = new Map(profiles.map(p => [p.id, p]));
  return rows.map(r => {
    const p = byId.get(r.user_id);
    return { reviewId: r.review_id, userId: r.user_id, name: p?.display_name || p?.first_name || p?.username || 'Golfer', username: p?.username ?? null, avatarUrl: p?.profile_photo_url ?? null };
  });
}