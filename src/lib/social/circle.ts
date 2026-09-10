import { supabase } from '@/integrations/supabase/client';

/**
 * THE CIRCLE - ONE DEFINITION, WRITTEN DOWN (BRIEF_CIRCLE_DEFINITION §6c).
 *
 * A member's circle is the set of personal profiles they follow: rows in
 * `follows` where follower_actor_type and following_actor_type are both
 * 'personal'. Business follows are not circle members. Pending friend requests
 * are not circle members - a request is not consent. Accepted friendships
 * already carry a follow edge, created by auto_follow_on_friend_accept, so
 * user_friends is not a source of circle membership.
 *
 * EVERY ONE OF THOSE FOUR SENTENCES EXISTS BECAUSE WE GOT IT WRONG SOMEWHERE:
 *
 *  - `follows` and not `user_follows`: the two are a bidirectional mirror with
 *    named writers on both sides, so either is trustworthy, but only the
 *    actor-aware table can state that business edges are excluded rather than
 *    imply it by accident. (user_follows happens to hold personal edges only -
 *    "happens to" is not a definition.)
 *  - business follows excluded: useCircleSize counted every row of `follows`,
 *    so 48 members who follow a business and no golfer were told they had a
 *    circle. Every circle-keyed branch on Explore then took the wrong path and
 *    found nothing behind it.
 *  - pending requests excluded: board_pool() unioned user_friends with no
 *    status filter, so sending a friend request put your rounds on the
 *    recipient's board before they ever saw it. An authorisation gap, not a
 *    definition disagreement. 18 members had a circle board made entirely of
 *    people they had not agreed to follow.
 *  - user_friends dropped entirely: the follow edge already exists for every
 *    accepted friendship between two live members, so reading friendships can
 *    only add people the member did not choose.
 *
 * THE FIGURE, WITH ITS QUESTION: 53 of 101 members follow no golfers. Not
 * "follow nobody" - 48 of those 53 follow a business.
 *
 * The same predicate lives in the SQL of public.board_pool(); the two must stay
 * in step. Anything asking "who is in this member's circle?" or "does this
 * member have a circle at all?" goes through this file.
 */

/** The ids of the personal profiles this member follows. Never includes self. */
export async function fetchCircleIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('following_actor_id')
    .eq('follower_actor_id', userId)
    .eq('follower_actor_type', 'personal')
    .eq('following_actor_type', 'personal');
  if (error) throw error;
  const out = new Set<string>();
  for (const row of (data ?? []) as Array<{ following_actor_id: string | null }>) {
    if (row.following_actor_id && row.following_actor_id !== userId) out.add(row.following_actor_id);
  }
  return Array.from(out);
}

/**
 * HOW MANY GOLFERS DOES THIS MEMBER FOLLOW?
 *
 * A head count, same predicate, so "circle says yes / pool finds nobody" is not
 * a state this app can be in any more - both answers come from one definition.
 */
export async function fetchCircleCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('follows')
    .select('id', { count: 'exact', head: true })
    .eq('follower_actor_id', userId)
    .eq('follower_actor_type', 'personal')
    .eq('following_actor_type', 'personal');
  if (error) throw error;
  return count ?? 0;
}
