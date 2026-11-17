/**
 * V6 §3 Featured signals — existing table reads only, no RPCs:
 * - played any time: user_course_activity.has_played (the viewer's courses-played read);
 * - reviewed any time: course_ratings for the viewer (is_mock false);
 * - Top 100: ANY active list (World/GB&I/Europe/USA, slugs per RANK_LIST_BY_SLUG),
 *   counted once per course; inactive lists ignored (activeTop100CourseIds);
 * - connected: follows, personal↔personal, both directions (people the viewer
 *   follows via fetchCircleIds, plus followers; accepted friendships already
 *   carry a follow edge — see lib/social/circle.ts);
 * - liked: post_likes by the viewer on the window's counted posts.
 * The home course and unseen activity come from the section itself.
 * Each read fails soft: a failed signal scores nothing.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchCircleIds } from '@/lib/social/circle';
import { activeTop100CourseIds, type Top100MembershipRow } from './playedRings';

const ids = <T,>(rows: unknown, pick: (r: T) => string | null | undefined) => new Set(((rows ?? []) as T[]).map(pick).filter((v): v is string => !!v));

export function useFeaturedSignals(userId: string | undefined, courseIds: string[], postIds: string[]) {
  const on = !!userId;
  const played = useQuery({ queryKey: ['courses', 'featured-played', userId ?? null], enabled: on, retry: false, staleTime: 5 * 60_000, queryFn: async () => {
    const { data, error } = await supabase.from('user_course_activity' as never).select('course_id, has_played').eq('user_id', userId as string).eq('has_played', true);
    if (error) throw error;
    return ids<{ course_id: string }>(data, (r) => r.course_id);
  } });
  const reviewed = useQuery({ queryKey: ['courses', 'featured-reviewed', userId ?? null], enabled: on, retry: false, staleTime: 5 * 60_000, queryFn: async () => {
    const { data, error } = await supabase.from('course_ratings').select('course_id').eq('user_id', userId as string).eq('is_mock', false);
    if (error) throw error;
    return ids<{ course_id: string | null }>(data, (r) => r.course_id);
  } });
  const top100 = useQuery({ queryKey: ['courses', 'featured-top100', courseIds.join('|')], enabled: on && courseIds.length > 0, retry: false, staleTime: 10 * 60_000, queryFn: async () => {
    const { data, error } = await supabase.from('course_top100_memberships').select('course_id, top100_lists!inner(slug, is_active)').in('course_id', courseIds).eq('top100_lists.is_active', true);
    if (error) throw error;
    return activeTop100CourseIds(data as Top100MembershipRow[] | null);
  } });
  const connected = useQuery({ queryKey: ['courses', 'featured-connected', userId ?? null], enabled: on, retry: false, staleTime: 5 * 60_000, queryFn: async () => {
    const [following, followers] = await Promise.all([
      fetchCircleIds(userId as string),
      supabase.from('follows').select('follower_actor_id').eq('following_actor_id', userId as string).eq('follower_actor_type', 'personal').eq('following_actor_type', 'personal'),
    ]);
    if (followers.error) throw followers.error;
    const out = new Set(following);
    for (const r of (followers.data ?? []) as Array<{ follower_actor_id: string | null }>) if (r.follower_actor_id && r.follower_actor_id !== userId) out.add(r.follower_actor_id);
    return out as ReadonlySet<string>;
  } });
  const liked = useQuery({ queryKey: ['courses', 'featured-liked', userId ?? null, postIds.join('|')], enabled: on && postIds.length > 0, retry: false, staleTime: 60_000, queryFn: async () => {
    const { data, error } = await supabase.from('post_likes').select('post_id').eq('user_id', userId as string).in('post_id', postIds);
    if (error) throw error;
    return ids<{ post_id: string }>(data, (r) => r.post_id);
  } });
  const done = (q: { isFetched: boolean; isError: boolean; fetchStatus: string }, needed = true) => !needed || q.isFetched || q.isError || q.fetchStatus === 'idle';
  const ready = !on || (done(played) && done(reviewed) && done(top100, courseIds.length > 0) && done(connected) && done(liked, postIds.length > 0));
  return { played: played.data, reviewed: reviewed.data, top100: top100.data, connected: connected.data, likedPosts: liked.data, ready };
}
