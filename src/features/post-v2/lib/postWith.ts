/** PLAYED WITH — public.post_with (post_id, user_id) writes and reads.
 *
 * UNTYPED ON PURPOSE: post_with was created by Ben's hand-run SQL and is not
 * yet in the generated Supabase types, so every access goes through
 * `postWithTable()` below. When the types are regenerated, replace that one
 * cast with `supabase.from('post_with')`.
 *
 * NO CLIENT NOTIFICATION. A database trigger on post_with inserts creates the
 * 'tag' notification; the app sends nothing itself.
 *
 * RLS: the post's author inserts (never themselves, eight at most); the author
 * or the tagged member deletes.
 */
import { supabase } from '@/integrations/supabase/client';
import { MAX_PLAYED_WITH } from './golfPostRules';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const postWithTable = () => (supabase as any).from('post_with');

/** Written after the post row exists. Never self, never past eight. */
export async function writePostWith(postId: string, authorId: string, userIds: readonly string[]): Promise<void> {
  const ids = [...new Set(userIds)].filter((id) => id !== authorId).slice(0, MAX_PLAYED_WITH);
  if (!ids.length) return;
  const { error } = await postWithTable().insert(ids.map((user_id) => ({ post_id: postId, user_id })));
  if (error) console.warn('[post-v2] post_with write failed:', error);
}

/** Edit mode: bring the post's rows to exactly `next`. */
export async function syncPostWith(postId: string, authorId: string, prev: readonly string[], next: readonly string[]): Promise<void> {
  const removed = prev.filter((id) => !next.includes(id));
  const added = next.filter((id) => !prev.includes(id));
  if (removed.length) {
    const { error } = await postWithTable().delete().eq('post_id', postId).in('user_id', removed);
    if (error) console.warn('[post-v2] post_with remove failed:', error);
  }
  if (added.length) await writePostWith(postId, authorId, added.slice(0, Math.max(0, MAX_PLAYED_WITH - (prev.length - removed.length))));
}

/** A tagged member removes themselves. */
export async function removeMeFromPost(postId: string, memberId: string): Promise<void> {
  const { data, error } = await postWithTable().delete().eq('post_id', postId).eq('user_id', memberId).select('post_id');
  if (error) throw error;
  if (!data?.length) throw new Error("You couldn't be removed from this post.");
}

export interface PostWithPerson { postId: string; userId: string; name: string; avatarUrl: string | null }

/** ONE read for a whole page of posts (plus one profile read). */
export async function readPostWith(postIds: readonly string[]): Promise<PostWithPerson[]> {
  if (!postIds.length) return [];
  const { data, error } = await postWithTable().select('post_id, user_id, created_at').in('post_id', postIds as string[]).order('created_at');
  if (error || !data?.length) return [];
  const rows = data as Array<{ post_id: string; user_id: string }>;
  const ids = [...new Set(rows.map((r) => r.user_id))];
  const { data: profiles } = await supabase.from('user_profiles').select('id, display_name, first_name, username, profile_photo_url').in('id', ids);
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  return rows.map((r) => {
    const p = byId.get(r.user_id);
    return { postId: r.post_id, userId: r.user_id, name: p?.display_name || p?.first_name || p?.username || 'Golfer', avatarUrl: p?.profile_photo_url ?? null };
  });
}
