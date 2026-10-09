/**
 * useBatchCourseImages — Resolves course images for many tournaments in 1-2 queries
 * Replaces per-card useSingleCourseImage calls (N→1 reduction)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TourTournament } from './useTourHubData';
import innisbrookCopperhead from '@/assets/courses/innisbrook-copperhead.jpeg';
import steynCityJackNicklaus from '@/assets/courses/steyn-city-jack-nicklaus.jpg';
import sharonHeightsGCC from '@/assets/courses/sharon-heights-gcc.jpg';
import brokenSoundClub from '@/assets/courses/broken-sound-club.jpg';
import princeOfWalesCC from '@/assets/courses/prince-of-wales-cc.jpg';
import missionHillsHaikou from '@/assets/courses/mission-hills-haikou.jpg';
import hazeltineNational from '@/assets/courses/hazeltine-national-golf-club.jpg.asset.json';
import sedgefieldCC from '@/assets/courses/sedgefield-country-club.jpg.asset.json';
import clubAtIndianCreek from '@/assets/courses/club-at-indian-creek.jpg.asset.json';
import canyonMeadowsGCC from '@/assets/courses/canyon-meadows-gcc.jpg.asset.json';

/**
 * Static venue image overrides for courses not yet in the database.
 */
const VENUE_IMAGE_OVERRIDES: Record<string, string> = {
  'Innisbrook Resort - Copperhead': innisbrookCopperhead,
  'The Club at Steyn City': steynCityJackNicklaus,
  'Sharon Heights Golf & Country Club': sharonHeightsGCC,
  'Broken Sound Club': brokenSoundClub,
  'Prince of Wales Country Club': princeOfWalesCC,
  'Mission Hills Resort Haikou': missionHillsHaikou,
  'Hazeltine National Golf Club': hazeltineNational.url,
  'Sedgefield Country Club': sedgefieldCC.url,
  'The Club at Indian Creek': clubAtIndianCreek.url,
  'Canyon Meadows G&CC': canyonMeadowsGCC.url,
  'Canyon Meadows Golf & Country Club': canyonMeadowsGCC.url,
};

/**
 * BRIEF_TOURNAMENT_VENUE_ONE_RESOLUTION — keyed by TOURNAMENT ID.
 * (a) Tournaments with sr_tournaments.golf_course_id read that course's
 *     thumbnail directly (same column as "View course") — no matching, no cache.
 * (b) Only tournaments with no golf_course_id fall back to sr_course_map by
 *     venue_name; (c) VENUE_IMAGE_OVERRIDES apply only inside (b).
 */
export function useBatchCourseImages(
  tournaments: Array<Pick<TourTournament, 'id' | 'venue_name'>> | undefined,
) {
  const rows = (tournaments || []).filter((t) => !!t?.id);
  const key = rows.map((t) => `${t.id}:${t.venue_name ?? ''}`).sort().join('|');

  return useQuery({
    queryKey: ['batch-course-images-v3', key],
    queryFn: async (): Promise<Map<string, string | null>> => {
      const result = new Map<string, string | null>();
      if (rows.length === 0) return result;
      const lookupRows = rows;

      const { data: links } = await supabase
        .from('sr_tournaments')
        .select('id, golf_course_id')
        .in('id', lookupRows.map((t) => t.id));
      const courseIdByTournament = new Map<string, string>();
      for (const l of (links ?? []) as Array<{ id: string; golf_course_id: string | null }>) {
        if (l.golf_course_id) courseIdByTournament.set(l.id, l.golf_course_id);
      }

      // (a) Direct by id.
      const courseIds = Array.from(new Set(courseIdByTournament.values()));
      if (courseIds.length > 0) {
        const { data: courses } = await supabase
          .from('golf_courses')
          .select('id, thumbnail_image')
          .in('id', courseIds);
        const img = new Map<string, string | null>();
        for (const c of (courses ?? []) as Array<{ id: string; thumbnail_image: string | null }>) {
          img.set(c.id, c.thumbnail_image ?? null);
        }
        for (const [tid, cid] of courseIdByTournament) result.set(tid, img.get(cid) ?? null);
      }

      // (b) Fallback only for tournaments with no golf_course_id.
      const fallback = lookupRows.filter((t) => !courseIdByTournament.has(t.id) && t.venue_name);
      const pending: typeof fallback = [];
      for (const t of fallback) {
        const o = VENUE_IMAGE_OVERRIDES[t.venue_name as string];
        if (o) result.set(t.id, o);
        else pending.push(t);
      }
      if (pending.length > 0) {
        const names = Array.from(new Set(pending.map((t) => t.venue_name as string)));
        const { data: cached } = await supabase
          .from('sr_course_map')
          .select('sr_venue_name, golf_courses:golf_course_id(thumbnail_image)')
          .in('sr_venue_name', names);
        const byName = new Map<string, string>();
        for (const row of (cached ?? []) as any[]) {
          if (row.golf_courses?.thumbnail_image) byName.set(row.sr_venue_name, row.golf_courses.thumbnail_image);
        }
        for (const t of pending) {
          const u = byName.get(t.venue_name as string);
          if (u) result.set(t.id, u);
        }
      }
      return result;
    },
    staleTime: 30 * 60 * 1000,
    enabled: rows.length > 0,
  });
}
