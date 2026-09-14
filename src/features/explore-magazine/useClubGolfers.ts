import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

import { isClubRecordCategory, type ClubRecordCategory } from './clubGolferRecords';

/**
 * GOLFERS AT THE VIEWER'S CLUB (BRIEF_EXPLORE_MAGAZINE PHASE C §4).
 *
 * THE MATCH IS A RESOLVED CLUB ID, NEVER home_club FREE TEXT.
 *
 * find_golfers_v1 cannot feed this shelf: it takes only p_query/p_limit and the
 * only club it returns is `up.home_club`, unstructured text (dumped in the C1
 * audit; the unapplied p_club_id proposal stays filed in
 * docs/sql/explore_phase_c_region_and_club.md). Matching on that text would put
 * members in the wrong club and read as a data bug, so it is not used here.
 *
 * PATH (a) OF §2 EXISTS AND IS BETTER THAN THE ROUNDS PATH. user_profiles
 * carries primary_club_id — the SAME resolved field useViewerScoreScope reads
 * for the viewer — and RLS lets an authenticated member read active profiles
 * ("Authenticated users can view active profiles", deleted_at IS NULL). So club
 * membership is an equality on a club UUID, and the club's courses are used only
 * for the REASON line, never for who belongs.
 *
 * THE VIEWER IS NEVER IN THEIR OWN SHELF.
 */

export interface ClubGolfer {
  userId: string;
  name: string;
  username: string | null;
  photoUrl: string | null;
  /** Distinct current all-time record categories held at this club's courses. */
  recordCategories: ClubRecordCategory[];
  /** 18-hole rounds tracked at this club's courses. */
  roundsHere: number;
  isNew: boolean;
}

const EMPTY: ClubGolfer[] = [];
const NEW_WINDOW_MS = 30 * 86_400_000;

export function useClubGolfers(viewerId: string | undefined, clubId: string | null, enabled: boolean) {
  const on = enabled && !!viewerId && !!clubId;
  const query = useQuery<ClubGolfer[]>({
    /* VIEWER-KEYED: the viewer is excluded from the result, so the answer is
       about one member and cannot be shared across accounts. */
    queryKey: ['explore-magazine', 'club-golfers', viewerId ?? 'anon', clubId ?? 'none'],
    enabled: on,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data: people, error: peopleError } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url, created_at')
        .eq('primary_club_id', clubId as string)
        .is('deleted_at', null)
        .neq('id', viewerId as string)
        .limit(40);
      if (peopleError) throw peopleError;
      const ids = (people ?? []).map((row) => row.id as string);
      if (ids.length === 0) return [];

      const { data: courses, error: courseError } = await supabase
        .from('golf_courses')
        .select('id')
        .eq('club_id', clubId as string);
      if (courseError) throw courseError;
      const courseIds = (courses ?? []).map((row) => row.id as string);

      /* THE REASON SOURCES. Both are scoped to this club's courses, so "3 rounds
         here" means here and nowhere else. With no club course they stay empty
         and the tiles fall through to "New this month" or the name alone.
         Legend reasons are ALL-TIME ONLY: a rolling 90-day lead is temporary
         state, not a golfer identity. */
      const [roundsResult, legendsResult] = await Promise.all([
        courseIds.length > 0
          ? supabase
              .from('gam_round_stats' as never)
              .select('user_id')
              .in('user_id', ids)
              .in('course_id', courseIds)
              .eq('holes_played', 18)
          : Promise.resolve({ data: [], error: null }),
        courseIds.length > 0
          ? supabase
              .from('gam_course_legends')
              /* Category is already on the same rows. Selecting it adds no read
                 and lets the tile reserve "the course record" exclusively for
                 the all-time gross record. */
              .select('user_id, category')
              .in('user_id', ids)
              .in('course_id', courseIds)
              .eq('rank', 1)
              .eq('is_current', true)
               .like('category', '%_all_time')
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (roundsResult.error) throw roundsResult.error;
      if (legendsResult.error) throw legendsResult.error;

      const tally = (rows: unknown) => {
        const out = new Map<string, number>();
        for (const row of ((rows ?? []) as Array<{ user_id: string | null }>)) {
          if (row.user_id) out.set(row.user_id, (out.get(row.user_id) ?? 0) + 1);
        }
        return out;
      };
      const rounds = tally(roundsResult.data);
      const recordCategories = new Map<string, ClubRecordCategory[]>();
      for (const row of ((legendsResult.data ?? []) as Array<{ user_id: string | null; category: string | null }>)) {
        if (!row.user_id || !isClubRecordCategory(row.category)) continue;
        const categories = recordCategories.get(row.user_id) ?? [];
        if (!categories.includes(row.category)) categories.push(row.category);
        recordCategories.set(row.user_id, categories);
      }
      const now = Date.now();

      return (people ?? [])
        .map((row) => {
          const created = row.created_at ? new Date(row.created_at as string).getTime() : NaN;
          return {
            userId: row.id as string,
            name: (row.display_name as string | null) || (row.username as string | null) || '',
            username: (row.username as string | null) ?? null,
            photoUrl: (row.profile_photo_url as string | null) ?? null,
            recordCategories: recordCategories.get(row.id as string) ?? [],
            roundsHere: rounds.get(row.id as string) ?? 0,
            isNew: Number.isFinite(created) && now - created <= NEW_WINDOW_MS,
          };
        })
        /* A NAMELESS PROFILE IS NOT A TILE. */
        .filter((row) => row.name.length > 0)
         /* §4 ORDER IS THE REASON STRENGTH: records, then rounds here, then new,
           then name so the rail is stable between renders. */
        .sort(
          (a, b) =>
            (b.recordCategories.length - a.recordCategories.length) ||
            (b.roundsHere - a.roundsHere) ||
            (Number(b.isNew) - Number(a.isNew)) ||
            a.name.localeCompare(b.name),
        )
        .slice(0, 16);
    },
  });

  return {
    golfers: query.data ?? EMPTY,
    /* A DISABLED QUERY IS READY AND EMPTY — readiness is isFetched, not
       isLoading, which a disabled query reports as false. */
    isFetched: on ? query.isFetched : true,
  };
}
