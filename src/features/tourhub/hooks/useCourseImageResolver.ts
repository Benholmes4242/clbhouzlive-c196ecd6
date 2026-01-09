/**
 * useCourseImageResolver - Resolves SR venue names to golf_courses images
 * Uses deterministic + fuzzy matching with caching
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ResolvedCourse {
  golfCourseId: string;
  imageUrl: string | null;
  confidence: number;
  name: string;
}

interface VenueInput {
  venueName: string;
  venueCourseName?: string | null;
  city?: string | null;
  country?: string | null;
}

// Normalize name for matching
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '') // Remove apostrophes
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\b(golf|club|course|country|the|at|resort|lodge|cc|gc)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Calculate similarity score (simple token overlap)
function calculateSimilarity(a: string, b: string): number {
  const tokensA = new Set(normalizeName(a).split(' ').filter(Boolean));
  const tokensB = new Set(normalizeName(b).split(' ').filter(Boolean));
  
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  
  const intersection = [...tokensA].filter(t => tokensB.has(t)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  
  return intersection / union; // Jaccard similarity
}

export function useCourseImageResolver(venues: VenueInput[]) {
  return useQuery({
    queryKey: ['course-images', venues.map(v => v.venueName).join(',')],
    queryFn: async () => {
      if (!venues.length) return new Map<string, ResolvedCourse>();
      
      // First check cache
      const { data: cached } = await supabase
        .from('sr_course_map')
        .select('sr_venue_name, golf_course_id, confidence, golf_courses:golf_course_id(id, name, thumbnail_image)')
        .in('sr_venue_name', venues.map(v => v.venueName));
      
      const results = new Map<string, ResolvedCourse>();
      const uncached: VenueInput[] = [];
      
      // Process cached results
      cached?.forEach((row: any) => {
        if (row.golf_courses) {
          results.set(row.sr_venue_name, {
            golfCourseId: row.golf_courses.id,
            imageUrl: row.golf_courses.thumbnail_image,
            confidence: row.confidence,
            name: row.golf_courses.name,
          });
        }
      });
      
      // Find uncached venues
      venues.forEach(v => {
        if (!results.has(v.venueName)) {
          uncached.push(v);
        }
      });
      
      // Resolve uncached venues
      if (uncached.length > 0) {
        // Build search terms
        const searchTerms = uncached.flatMap(v => {
          const terms = [v.venueName];
          if (v.venueCourseName) terms.push(v.venueCourseName);
          return terms;
        });
        
        // Fetch potential matches (courses in same countries)
        const countries = [...new Set(uncached.map(v => v.country).filter(Boolean))];
        
        const { data: courses } = await supabase
          .from('golf_courses')
          .select('id, name, thumbnail_image, country')
          .in('country', countries.length ? countries as string[] : ['USA'])
          .limit(500);
        
        if (courses) {
          for (const venue of uncached) {
            const searchName = venue.venueCourseName || venue.venueName;
            const normalizedSearch = normalizeName(searchName);
            
            // Find best match
            let bestMatch: { course: typeof courses[0]; score: number } | null = null;
            
            for (const course of courses) {
              // Skip if different country
              if (venue.country && course.country !== venue.country) continue;
              
              const score = calculateSimilarity(searchName, course.name);
              
              // Boost score if city matches in name
              let boostedScore = score;
              if (venue.city && course.name.toLowerCase().includes(venue.city.toLowerCase())) {
                boostedScore += 0.15;
              }
              
              if (boostedScore > (bestMatch?.score || 0.5)) {
                bestMatch = { course, score: boostedScore };
              }
            }
            
            if (bestMatch && bestMatch.score >= 0.5) {
              results.set(venue.venueName, {
                golfCourseId: bestMatch.course.id,
                imageUrl: bestMatch.course.thumbnail_image,
                confidence: bestMatch.score,
                name: bestMatch.course.name,
              });
              
              // Cache the result
              supabase.from('sr_course_map').upsert({
                sr_venue_name: venue.venueName,
                sr_venue_course_name: venue.venueCourseName,
                sr_city: venue.city,
                sr_country: venue.country,
                golf_course_id: bestMatch.course.id,
                confidence: bestMatch.score,
                source: 'fuzzy',
              }, { onConflict: 'sr_venue_name,sr_city,sr_country' });
            }
          }
        }
      }
      
      return results;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    enabled: venues.length > 0,
  });
}

// Single venue lookup
export function useSingleCourseImage(venue: VenueInput | null) {
  const venues = venue ? [venue] : [];
  const { data, isLoading } = useCourseImageResolver(venues);
  
  return {
    courseImage: venue ? data?.get(venue.venueName) : undefined,
    isLoading,
  };
}
