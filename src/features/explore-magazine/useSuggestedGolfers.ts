import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { fetchCircleIds } from '@/lib/social/circle';

/**
 * SUGGESTED GOLFERS, FOR A MEMBER WHO FOLLOWS NOBODY
 * (BRIEF_EXPLORE_SUGGESTED_GOLFERS §3).
 *
 * SOURCE: find_golfers_v1(p_query, p_limit) with a NULL query — the same
 * function the Find golfers sheet uses. It is deliberately NOT club-scoped:
 * a member with no circle may also have no club, and a club filter would leave
 * them with nothing.
 *
 * WHAT THE FUNCTION SUPPLIES for the reason line: display_name, username,
 * profile_photo_url, home_club (free text, the member's OWN stated club),
 * rounds_tracked (ALL-TIME 18-hole rounds), is_following, is_friend.
 *
 * WHAT IT DOES NOT SUPPLY, and how it is sourced instead — no line is invented:
 *  - ROUNDS THIS MONTH. rounds_tracked is all-time, and "{n} rounds this month"
 *    is a different claim. One batched gam_round_stats read over the suggested
 *    ids, 18 holes only, play_date inside the last 30 days.
 *  - A SHARED COURSE. Needs both sides, so it cannot come from a function that
 *    knows nothing about the viewer. The same batched read carries course_id,
 *    intersected with the viewer's own played courses.
 *  - A STRUCTURED CLUB. Only the free-text home_club exists. DISPLAYING it is
 *    honest (it is what the member typed about themselves); MATCHING on it is
 *    not, which is why useClubGolfers refuses it for membership. The minimal
 *    server change — a p_club_id filter and a resolved club name — stays filed,
 *    unapplied, in docs/sql/explore_phase_c_region_and_club.md.
 *
 * EXCLUDES the viewer and anyone they already follow. Belt and braces: this
 * shelf only mounts when the follow set is empty, but a stale read must never
 * suggest someone the member already has.
 */

export interface SuggestedGolfer {
  userId: string;
  name: string;
  username: string | null;
  photoUrl: string | null;
  /** Free text the member stated about themselves. Never used to match. */
  homeClub: string | null;
  /** 18-hole rounds inside the last 30 days. */
  roundsThisMonth: number;
  /** A course the viewer has also played, if any. */
  sharedCourseId: string | null;
}

const EMPTY: SuggestedGolfer[] = [];
const MONTH_MS = 30 * 86_400_000;
const RENDERED = 12;

interface FindGolfersMember {
  id: string;
  display_name: string | null;
  username: string | null;
  profile_photo_url: string | null;
  home_club: string | null;
  rounds_tracked: number | string | null;
  is_following: boolean | null;
}

export function useSuggestedGolfers(viewerId: string | undefined, enabled: boolean) {
  const on = enabled && !!viewerId;
  const query = useQuery<SuggestedGolfer[]>({
    queryKey: ['explore-magazine', 'suggested-golfers', viewerId ?? 'anon'],
    enabled: on,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as typeof supabase.rpc).call(
        supabase,
        'find_golfers_v1' as never,
        { p_query: null, p_limit: 30 } as never,
      );
      if (error) throw error;
      const members = ((data ?? {}) as { members?: FindGolfersMember[] }).members ?? [];

      const already = new Set(await fetchCircleIds(viewerId as string));
      const people = members.filter(
        (m) => m.id && m.id !== viewerId && !m.is_following && !already.has(m.id),
      );
      if (people.length === 0) return [];
      const ids = people.map((m) => m.id);

      const since = new Date(Date.now() - MONTH_MS).toISOString().slice(0, 10);
      const [theirs, mine] = await Promise.all([
        supabase
          .from('gam_round_stats')
          .select('user_id, course_id, play_date')
          .in('user_id', ids)
          .eq('holes_played', 18),
        supabase
          .from('gam_round_stats')
          .select('course_id')
          .eq('user_id', viewerId as string)
          .eq('holes_played', 18),
      ]);
      if (theirs.error) throw theirs.error;
      if (mine.error) throw mine.error;

      const viewerCourses = new Set(
        ((mine.data ?? []) as Array<{ course_id: string | null }>)
          .map((row) => row.course_id)
          .filter((id): id is string => !!id),
      );
      const monthCount = new Map<string, number>();
      const shared = new Map<string, string>();
      for (const row of (theirs.data ?? []) as Array<{
        user_id: string | null;
        course_id: string | null;
        play_date: string | null;
      }>) {
        if (!row.user_id) continue;
        if (row.play_date && row.play_date >= since) {
          monthCount.set(row.user_id, (monthCount.get(row.user_id) ?? 0) + 1);
        }
        if (row.course_id && viewerCourses.has(row.course_id) && !shared.has(row.user_id)) {
          shared.set(row.user_id, row.course_id);
        }
      }

      return people
        .map((m) => ({
          userId: m.id,
          name: (m.display_name || m.username || '').trim(),
          username: m.username ?? null,
          photoUrl: m.profile_photo_url ?? null,
          homeClub: (m.home_club ?? '')?.trim() || null,
          roundsThisMonth: monthCount.get(m.id) ?? 0,
          sharedCourseId: shared.get(m.id) ?? null,
        }))
        /* A NAMELESS PROFILE IS NOT A TILE. */
        .filter((row) => row.name.length > 0)
        /* §3 STRONGEST REASON FIRST, then round count. Club, then rounds this
           month, then a shared course, then the name alone. */
        .sort(
          (a, b) =>
            (Number(!!b.homeClub) - Number(!!a.homeClub)) ||
            (Number(b.roundsThisMonth > 0) - Number(a.roundsThisMonth > 0)) ||
            (Number(!!b.sharedCourseId) - Number(!!a.sharedCourseId)) ||
            (b.roundsThisMonth - a.roundsThisMonth) ||
            a.name.localeCompare(b.name),
        )
        .slice(0, RENDERED);
    },
  });

  return {
    golfers: query.data ?? EMPTY,
    /* A DISABLED QUERY IS READY AND EMPTY — readiness is isFetched. */
    isFetched: on ? query.isFetched : true,
  };
}

export default useSuggestedGolfers;
