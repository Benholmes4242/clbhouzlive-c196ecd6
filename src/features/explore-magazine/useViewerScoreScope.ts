import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

/** Geography shared by Scores now and the Phase C county/world surfaces. */
export type ScoreScope = 'club' | 'county' | 'country' | 'world';

export interface ViewerScoreScope {
  primaryClubId: string | null;
  primaryClubName: string | null;
  county: string | null;
  country: string | null;
  countySource: 'primary_club' | 'most_played' | null;
  countrySource: 'profile' | 'primary_club' | null;
}

const EMPTY: ViewerScoreScope = {
  primaryClubId: null,
  primaryClubName: null,
  county: null,
  country: null,
  countySource: null,
  countrySource: null,
};

/**
 * Resolves the viewer's canonical club, county and country once. All course ids
 * are golf_courses ids: gam_round_stats.course_id joins them directly, with no
 * WHS mapping bridge.
 */
export function useViewerScoreScope(viewerId: string | undefined) {
  const query = useQuery<ViewerScoreScope>({
    queryKey: ['explore-magazine', 'viewer-score-scope', viewerId ?? 'anon'],
    enabled: !!viewerId,
    staleTime: 30 * 60_000,
    queryFn: async () => {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('primary_club_id, country')
        .eq('id', viewerId as string)
        .maybeSingle();
      if (profileError) throw profileError;

      const primaryClubId = profile?.primary_club_id ?? null;
      const [clubResult, playedResult] = await Promise.all([
        primaryClubId
          ? supabase
              .from('golf_courses')
              .select('id, name, region, sub_country, golf_clubs!inner(id, name)')
              .eq('club_id', primaryClubId)
              .order('name')
          : Promise.resolve({ data: [], error: null }),
        supabase
          .from('gam_round_stats' as never)
          .select('course_id')
          .eq('user_id', viewerId as string)
          .eq('holes_played', 18)
          .not('course_id', 'is', null),
      ]);
      if (clubResult.error) throw clubResult.error;
      if (playedResult.error) throw playedResult.error;

      type ClubCourse = {
        id: string;
        name: string;
        region: string | null;
        sub_country: string | null;
        golf_clubs: { id: string; name: string } | null;
      };
      const clubCourses = (clubResult.data ?? []) as unknown as ClubCourse[];
      const counts = new Map<string, number>();
      for (const row of ((playedResult.data ?? []) as unknown as Array<{ course_id: string | null }>)) {
        if (row.course_id) counts.set(row.course_id, (counts.get(row.course_id) ?? 0) + 1);
      }
      const mostPlayedId = Array.from(counts.entries())
        .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))[0]?.[0] ?? null;
      const clubCourse = clubCourses
        .slice()
        .sort((a, b) => ((counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0)) || a.name.localeCompare(b.name))[0] ?? null;

      let mostPlayed: { region: string | null; sub_country: string | null } | null = null;
      if (mostPlayedId && !clubCourse?.region) {
        const { data, error } = await supabase
          .from('golf_courses')
          .select('region, sub_country')
          .eq('id', mostPlayedId)
          .maybeSingle();
        if (error) throw error;
        mostPlayed = data;
      }

      const county = clubCourse?.region ?? mostPlayed?.region ?? null;
      const country = profile?.country ?? clubCourse?.sub_country ?? null;
      return {
        primaryClubId,
        primaryClubName: clubCourse?.golf_clubs?.name ?? null,
        county,
        country,
        countySource: clubCourse?.region ? 'primary_club' : mostPlayed?.region ? 'most_played' : null,
        countrySource: profile?.country ? 'profile' : clubCourse?.sub_country ? 'primary_club' : null,
      };
    },
  });

  return {
    scope: query.data ?? EMPTY,
    isFetched: viewerId ? query.isFetched : true,
    unresolved: !!query.error,
  };
}