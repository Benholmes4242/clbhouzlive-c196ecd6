import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * BRIEF_PROFILE_CLUBS_SECTION §3/§6 — the courses of every club on a profile.
 *
 * ONE QUERY, NOT N: the home club and every secondary club are resolved in a
 * single golf_courses read on club_id (the same path useClubWeekRounds uses),
 * then grouped client-side.
 */
export interface ClubCourse {
  id: string;
  name: string | null;
  thumbnail_image: string | null;
  country: string | null;
  region: string | null;
  sub_country: string | null;
}

export function useClubsCourses(clubIds: string[]) {
  const ids = [...new Set(clubIds.filter(Boolean))].sort();
  return useQuery<Record<string, ClubCourse[]>>({
    queryKey: ['profile-clubs-courses', ids.join(',')],
    enabled: ids.length > 0,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, name, thumbnail_image, country, region, sub_country, club_id')
        .in('club_id', ids)
        .order('name');
      if (error) throw error;
      const out: Record<string, ClubCourse[]> = {};
      for (const row of (data ?? []) as any[]) {
        (out[row.club_id] ??= []).push(row as ClubCourse);
      }
      return out;
    },
  });
}
