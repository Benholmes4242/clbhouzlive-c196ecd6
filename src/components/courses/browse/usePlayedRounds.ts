/**
 * Reads for What's been played (BRIEF_PLAYED_RINGS_AND_AREA_TABS §1). Rounds come
 * from get_recent_rounds ('everyone', '14'), paged to total_count and capped at
 * 500; one golf_courses read for the grouped ids; the viewer's home course is
 * the first golf_courses row of their canonical club (user_profiles.primary_club_id,
 * via useViewerHomeClubId — home_club_id is deprecated and never written).
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useViewerHomeClubId } from '@/components/explore-tab-new/courseled/hooks/useGolfThisWeek';
import type { HomePlace, PlacedCourse } from './playedRings';

export const PLAYED_ROUND_CAP = 500;
const PAGE = 100;

export interface PlayedRoundRow {
  whs_score_id: string;
  course_id: string | null;
  course_name: string | null;
  play_date: string;
  user_id: string;
  display_name: string | null;
  profile_photo_url: string | null;
  gross_score: number | null;
  total_count: number;
}
export interface PlayedCourse extends PlacedCourse { name: string; imageUrl: string | null }

export async function fetchPlayedRounds(): Promise<PlayedRoundRow[]> {
  const out: PlayedRoundRow[] = [];
  for (let offset = 0; offset < PLAYED_ROUND_CAP; offset += PAGE) {
    const { data, error } = await supabase.rpc('get_recent_rounds', {
      p_scope: 'everyone', p_window: '14', p_limit: Math.min(PAGE, PLAYED_ROUND_CAP - offset), p_offset: offset,
    });
    if (error) throw error;
    const rows = (data ?? []) as PlayedRoundRow[];
    out.push(...rows);
    const total = rows[0]?.total_count ?? 0;
    if (rows.length === 0 || out.length >= total) break;
  }
  return out.slice(0, PLAYED_ROUND_CAP);
}

const COURSE_COLS = 'id, name, thumbnail_image, region, sub_country, country, continent, latitude, longitude';
type CourseRow = { id: string; name: string; thumbnail_image: string | null; region: string | null; sub_country: string | null; country: string | null; continent: string | null; latitude: number | null; longitude: number | null };
const toCourse = (c: CourseRow): PlayedCourse => ({
  id: c.id, name: c.name, imageUrl: c.thumbnail_image ?? null, region: c.region || null, subCountry: c.sub_country || null,
  country: c.country || null, continent: c.continent || null, lat: c.latitude ?? null, lng: c.longitude ?? null,
});

export function usePlayedRounds(userId: string | undefined) {
  const rounds = useQuery({ queryKey: ['courses', 'played-rounds', 'everyone', '14'], queryFn: fetchPlayedRounds, staleTime: 60_000 });
  const ids = useMemo(() => Array.from(new Set((rounds.data ?? []).map((r) => r.course_id).filter((v): v is string => !!v))).sort(), [rounds.data]);
  const courses = useQuery({
    queryKey: ['courses', 'played-courses', ids.join('|')],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from('golf_courses').select(COURSE_COLS).in('id', ids);
      if (error) throw error;
      return new Map(((data ?? []) as CourseRow[]).map((c) => [c.id, toCourse(c)]));
    },
  });
  const homeClub = useViewerHomeClubId(userId);
  const home = useQuery({
    queryKey: ['courses', 'played-home', homeClub.clubId],
    enabled: !!homeClub.clubId,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<HomePlace | null> => {
      const { data, error } = await supabase.from('golf_courses').select(COURSE_COLS).eq('club_id', homeClub.clubId as string).limit(1);
      if (error) throw error;
      const c = (data ?? [])[0] as CourseRow | undefined;
      return c ? { lat: c.latitude ?? null, lng: c.longitude ?? null, region: c.region || null, subCountry: c.sub_country || null, country: c.country || null, continent: c.continent || null } : null;
    },
  });
  const homeReady = !userId || (homeClub.ready && (!homeClub.clubId || home.isFetched || home.isError));
  return { rounds, courses, ids, home: homeClub.clubId ? home.data ?? null : null, homeReady };
}
