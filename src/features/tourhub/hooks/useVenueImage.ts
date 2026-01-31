/**
 * useVenueImage - Fetch course thumbnail images for tournament venues
 * Matches sr_tournament venue names to golf_courses via sr_course_map or smart name matching
 * 
 * Matching priority:
 * 1. Exact match via sr_course_map (canonical authority)
 * 2. Exact name match in golf_courses
 * 3. Smart fuzzy match (prefers shorter names / exact prefix matches)
 * 4. City-based fallback
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VenueImageResult {
  imageUrl: string | null;
  courseName: string | null;
  courseId: string | null;
}

/**
 * Normalize a venue/course name for comparison
 * Strips common suffixes and normalizes whitespace
 */
function normalizeName(name: string): string {
  return name
    .replace(/Golf Club|Golf Course|Country Club|Golf & Country Club|CC|GC|Resort|The /gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Score how well a course name matches a venue name
 * Higher score = better match
 */
function scoreMatch(venueName: string, courseName: string): number {
  const venueNorm = normalizeName(venueName);
  const courseNorm = normalizeName(courseName);
  
  // Exact match after normalization = perfect score
  if (venueNorm === courseNorm) return 1000;
  
  // Course name starts with venue name = very good
  if (courseNorm.startsWith(venueNorm)) return 900;
  
  // Venue name starts with course name = good
  if (venueNorm.startsWith(courseNorm)) return 800;
  
  // Contains match - prefer shorter course names (more specific)
  if (courseNorm.includes(venueNorm) || venueNorm.includes(courseNorm)) {
    // Shorter names score higher (max 700, minus length penalty)
    return Math.max(100, 700 - courseName.length);
  }
  
  return 0;
}

/**
 * Try to find a course image for a tournament venue
 */
export function useVenueImage(venueName: string | null, venueCity: string | null) {
  return useQuery({
    queryKey: ['venue-image', venueName, venueCity],
    queryFn: async (): Promise<VenueImageResult> => {
      if (!venueName) return { imageUrl: null, courseName: null, courseId: null };

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
      // TIER 2: Exact name match in golf_courses
      // ============================================================
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

      // ============================================================
      // TIER 3 & 4: DISABLED - Fuzzy matching leads to wrong images
      // If the venue isn't in sr_course_map or exact name match,
      // return null to trigger gradient fallback in UI
      // ============================================================
      // NOTE: Previously used fuzzy matching and city-based matching
      // but this caused venues like "Royal GC" in Bahrain to match
      // unrelated "Royal" courses in other countries.
      // 
      // To add a venue image, add a mapping to sr_course_map table.

      return { imageUrl: null, courseName: null, courseId: null };
    },
    enabled: !!venueName,
    staleTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
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
