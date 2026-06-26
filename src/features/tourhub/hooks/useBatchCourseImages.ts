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
};

export interface BatchImageMap {
  /** Maps venue_name → thumbnail_image URL */
  get(venueName: string): string | null;
}

/**
 * Given an array of tournaments, batch-resolves course images.
 * 1. Check sr_course_map cache for all venue names
 * 2. Return a Map<venueName, imageUrl>
 */
export function useBatchCourseImages(tournaments: TourTournament[] | undefined) {
  // Collect unique venue names
  const venueNames = Array.from(
    new Set(
      (tournaments || [])
        .map(t => t.venue_name)
        .filter((n): n is string => !!n)
    )
  );

  return useQuery({
    queryKey: ['batch-course-images', venueNames.sort().join('|')],
    queryFn: async (): Promise<Map<string, string | null>> => {
      if (venueNames.length === 0) return new Map();

      const result = new Map<string, string | null>();

      // Apply static overrides first
      for (const name of venueNames) {
        if (VENUE_IMAGE_OVERRIDES[name]) {
          result.set(name, VENUE_IMAGE_OVERRIDES[name]);
        }
      }

      const uncachedNames = venueNames.filter(n => !result.has(n));
      if (uncachedNames.length === 0) return result;

      // Step 1: Check sr_course_map cache (bulk lookup)
      const { data: cached, error } = await supabase
        .from('sr_course_map')
        .select('sr_venue_name, golf_courses:golf_course_id(thumbnail_image)')
        .in('sr_venue_name', uncachedNames);

      if (!error && cached) {
        for (const row of cached as any[]) {
          if (row.golf_courses?.thumbnail_image) {
            result.set(row.sr_venue_name, row.golf_courses.thumbnail_image);
          }
        }
      }

      console.log(`[BatchCourseImages] ${result.size}/${venueNames.length} resolved from cache`);

      return result;
    },
    staleTime: 30 * 60 * 1000, // 30 min cache
    enabled: venueNames.length > 0,
  });
}
