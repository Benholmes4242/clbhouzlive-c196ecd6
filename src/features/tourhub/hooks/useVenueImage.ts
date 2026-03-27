/**
 * useVenueImage - Fetch course thumbnail images for tournament venues
 * Matches sr_tournament venue names to golf_courses via sr_course_map or smart name matching
 * 
 * Matching priority:
 * 1. Exact match via sr_course_map (canonical authority)
 * 2. Smart name match: exact → abbreviation-expanded exact → starts-with → expanded starts-with
 * 3. Fallback: null (triggers gradient/stock fallback in UI)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import innisbrookCopperhead from '@/assets/courses/innisbrook-copperhead.jpeg';
import steynCityJackNicklaus from '@/assets/courses/steyn-city-jack-nicklaus.jpg';
import sharonHeightsGCC from '@/assets/courses/sharon-heights-gcc.jpg';
import brokenSoundClub from '@/assets/courses/broken-sound-club.jpg';
import princeOfWalesCC from '@/assets/courses/prince-of-wales-cc.jpg';
import missionHillsHaikou from '@/assets/courses/mission-hills-haikou.jpg';
import theLandingsClub from '@/assets/courses/the-landings-club.jpg';

/**
 * Static venue image overrides for courses not yet in the database.
 * Maps sr_tournament venue_name → local asset import.
 */
const VENUE_IMAGE_OVERRIDES: Record<string, string> = {
  'Innisbrook Resort - Copperhead': innisbrookCopperhead,
  'The Club at Steyn City': steynCityJackNicklaus,
  'Sharon Heights Golf & Country Club': sharonHeightsGCC,
  'Broken Sound Club': brokenSoundClub,
  'Prince of Wales Country Club': princeOfWalesCC,
  'Mission Hills Resort Haikou': missionHillsHaikou,
  'The Landings Club': theLandingsClub,
};

interface VenueImageResult {
  imageUrl: string | null;
  courseName: string | null;
  courseId: string | null;
}

/**
 * Expand common golf venue abbreviations to full names for matching.
 */
function expandAbbreviations(name: string): string {
  return name
    .replace(/\bG\s*&\s*CC\b/gi, 'Golf & Country Club')
    .replace(/\bGCC\b/gi, 'Golf & Country Club')
    .replace(/\bCC\b/gi, 'Country Club')
    .replace(/\bGC\b/gi, 'Golf Club')
    .trim();
}

/**
 * Try to find a course image for a tournament venue
 */
export function useVenueImage(venueName: string | null, venueCity: string | null) {
  return useQuery({
    queryKey: ['venue-image', venueName, venueCity],
    queryFn: async (): Promise<VenueImageResult> => {
      if (!venueName) return { imageUrl: null, courseName: null, courseId: null };

      // TIER 0: Static overrides for courses not in the database
      if (VENUE_IMAGE_OVERRIDES[venueName]) {
        return {
          imageUrl: VENUE_IMAGE_OVERRIDES[venueName],
          courseName: venueName,
          courseId: null,
        };
      }

      // ============================================================
      // TIER 1: Exact match via sr_course_map (canonical authority)
      // ============================================================
      const { data: mappedCourse } = await supabase
        .from('sr_course_map')
        .select(`
          golf_course_id,
          golf_course:golf_courses!inner(
            id,
            name,
            thumbnail_image
          )
        `)
        .eq('sr_venue_name', venueName)
        .limit(1)
        .maybeSingle();

      if (mappedCourse?.golf_course) {
        const gc = mappedCourse.golf_course as any;
        if (gc.thumbnail_image) {
          return {
            imageUrl: gc.thumbnail_image,
            courseName: gc.name,
            courseId: gc.id,
          };
        }
      }

      // ============================================================
      // TIER 2: Smart name matching (multiple strategies)
      // ============================================================
      const expandedName = expandAbbreviations(venueName);

      // 2a. Exact name match
      const { data: exactMatch } = await supabase
        .from('golf_courses')
        .select('id, name, thumbnail_image')
        .eq('name', venueName)
        .not('thumbnail_image', 'is', null)
        .limit(1)
        .maybeSingle();

      if (exactMatch?.thumbnail_image) {
        return {
          imageUrl: exactMatch.thumbnail_image,
          courseName: exactMatch.name,
          courseId: exactMatch.id,
        };
      }

      // 2b. Expanded abbreviation exact match (e.g. "Riviera CC" → "Riviera Country Club")
      if (expandedName !== venueName) {
        const { data: expandedMatch } = await supabase
          .from('golf_courses')
          .select('id, name, thumbnail_image')
          .eq('name', expandedName)
          .not('thumbnail_image', 'is', null)
          .limit(1)
          .maybeSingle();

        if (expandedMatch?.thumbnail_image) {
          return {
            imageUrl: expandedMatch.thumbnail_image,
            courseName: expandedMatch.name,
            courseId: expandedMatch.id,
          };
        }
      }

      // 2c. Starts-with match (e.g. "Tiburon Golf Club" → "Tiburon Golf Club - Gold Course")
      const { data: startsWithMatch } = await supabase
        .from('golf_courses')
        .select('id, name, thumbnail_image')
        .ilike('name', `${venueName}%`)
        .not('thumbnail_image', 'is', null)
        .order('name', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (startsWithMatch?.thumbnail_image) {
        return {
          imageUrl: startsWithMatch.thumbnail_image,
          courseName: startsWithMatch.name,
          courseId: startsWithMatch.id,
        };
      }

      // 2d. Expanded starts-with match
      if (expandedName !== venueName) {
        const { data: expStartsMatch } = await supabase
          .from('golf_courses')
          .select('id, name, thumbnail_image')
          .ilike('name', `${expandedName}%`)
          .not('thumbnail_image', 'is', null)
          .order('name', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (expStartsMatch?.thumbnail_image) {
          return {
            imageUrl: expStartsMatch.thumbnail_image,
            courseName: expStartsMatch.name,
            courseId: expStartsMatch.id,
          };
        }
      }

      return { imageUrl: null, courseName: null, courseId: null };
    },
    enabled: !!venueName,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Static fallback images for when no venue image is found
 * High-quality golf course photography
 */
export const FALLBACK_COURSE_IMAGES = [
  'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1920&q=80', // Golf course at sunset
  'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=1920&q=80', // Links course
  'https://images.unsplash.com/photo-1592919505780-303950717480?w=1920&q=80', // Fairway
  'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=1920&q=80', // Green with flag
  'https://images.unsplash.com/photo-1600010948455-2a68d6f6c7e0?w=1920&q=80', // Mountain course
];

/**
 * Get a deterministic fallback image based on tournament name
 */
export function getFallbackCourseImage(tournamentName: string): string {
  const hash = tournamentName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return FALLBACK_COURSE_IMAGES[hash % FALLBACK_COURSE_IMAGES.length];
}
