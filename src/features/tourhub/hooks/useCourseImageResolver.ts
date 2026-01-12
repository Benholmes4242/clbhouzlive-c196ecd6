/**
 * useCourseImageResolver - Resolves SR venue names to golf_courses images
 * Uses server-side ILIKE search + client-side scoring for best match
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ResolvedCourse {
  golfCourseId: string;
  imageUrl: string | null;
  confidence: number;
  name: string;
}

export interface VenueInput {
  venueName: string;
  venueCourseName?: string | null;
  city?: string | null;
  country?: string | null;
}

// Extract base name: strip variant suffixes like "- South Course", "- Black Course"
function courseBaseName(input: string): string {
  return input
    .toLowerCase()
    .replace(/\s*[-–]\s*.*$/, '') // Strip "- South Course" etc
    .replace(/\s*\(.*$/, '')       // Strip "(Championship)" etc
    .replace(/,.*$/, '')           // Strip ", The Bahamas" etc
    .trim();
}

// Normalize for matching: remove common words and punctuation
function courseNormalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(the|at|golf|club|course|resort|country|cc|gc)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Calculate similarity score using token overlap (Jaccard)
function calculateSimilarity(a: string, b: string): number {
  const normA = courseNormalize(courseBaseName(a));
  const normB = courseNormalize(courseBaseName(b));
  
  const tokensA = new Set(normA.split(' ').filter(Boolean));
  const tokensB = new Set(normB.split(' ').filter(Boolean));
  
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  
  const intersection = [...tokensA].filter(t => tokensB.has(t)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  
  return intersection / union;
}

// Boost score for primary/championship variants
function getVariantBoost(courseName: string): number {
  const lower = courseName.toLowerCase();
  if (lower.includes(' black ')) return 120;
  if (lower.includes(' south ')) return 100;
  if (lower.includes(' championship ')) return 90;
  if (lower.includes(' stadium ')) return 85;
  if (lower.includes(' players ')) return 80;
  if (lower.includes(' north ')) return 70;
  if (lower.includes(' gold ')) return 60;
  if (lower.includes(' links ')) return 50;
  return 0;
}

// Extract search keywords from venue name for ILIKE query
function getSearchKeywords(venueName: string): string[] {
  const base = courseBaseName(venueName);
  const normalized = courseNormalize(base);
  const tokens = normalized.split(' ').filter(t => t.length >= 3);
  
  // Return unique meaningful tokens (skip very common words)
  const skipWords = new Set(['the', 'and', 'golf', 'club', 'course', 'resort', 'country']);
  return [...new Set(tokens.filter(t => !skipWords.has(t)))];
}

// Server-side search for courses matching a venue
async function searchCoursesForVenue(venue: VenueInput): Promise<{
  courses: Array<{ id: string; name: string; thumbnail_image: string | null; country: string | null }>;
  searchTerms: string[];
}> {
  const keywords = getSearchKeywords(venue.venueName);
  
  if (keywords.length === 0) {
    return { courses: [], searchTerms: [] };
  }
  
  // Use the most distinctive keyword (usually the proper noun)
  // For "Tiburon Golf Club" -> "tiburon"
  // For "Torrey Pines" -> "torrey" or "pines"
  const primaryKeyword = keywords[0];
  
  console.log(`[CourseResolver] Server search for "${venue.venueName}" using keyword: "${primaryKeyword}"`);
  
  // Search using ILIKE for the primary keyword
  const { data, error } = await supabase
    .from('golf_courses')
    .select('id, name, thumbnail_image, country')
    .ilike('name', `%${primaryKeyword}%`)
    .limit(50);
  
  if (error) {
    console.error(`[CourseResolver] Search error:`, error);
    return { courses: [], searchTerms: [primaryKeyword] };
  }
  
  console.log(`[CourseResolver] Found ${data?.length || 0} courses matching "${primaryKeyword}"`);
  
  return { 
    courses: data || [], 
    searchTerms: [primaryKeyword] 
  };
}

// Find best match from search results
function findBestMatch(
  venue: VenueInput,
  courses: Array<{ id: string; name: string; thumbnail_image: string | null; country: string | null }>
): { course: typeof courses[0]; score: number } | null {
  if (courses.length === 0) return null;
  
  const isDebug = venue.venueName.toLowerCase().includes('tiburon') || 
                  venue.venueName.toLowerCase().includes('torrey');
  
  let bestMatch: { course: typeof courses[0]; score: number; combined: number } | null = null;
  const candidates: Array<{ name: string; score: number; boost: number; combined: number }> = [];
  
  for (const course of courses) {
    const score = calculateSimilarity(venue.venueName, course.name);
    const boost = getVariantBoost(course.name);
    
    // Check for exact base name match
    const venueBase = courseNormalize(courseBaseName(venue.venueName));
    const courseBase = courseNormalize(courseBaseName(course.name));
    const exactBaseMatch = venueBase === courseBase;
    const exactBonus = exactBaseMatch ? 100 : 0;
    
    // Variant match bonus (Gold Course matches "- Gold Course")
    let variantBonus = 0;
    if (venue.venueCourseName) {
      const vcLower = venue.venueCourseName.toLowerCase();
      const cLower = course.name.toLowerCase();
      if (cLower.includes(vcLower)) {
        variantBonus = 200; // Strong bonus for exact variant
      }
    }
    
    // Country match bonus
    const countryBonus = (!venue.country || course.country === venue.country) ? 10 : 0;
    
    const combined = score * 100 + boost + exactBonus + variantBonus + countryBonus;
    
    candidates.push({ name: course.name, score, boost, combined });
    
    if (!bestMatch || combined > bestMatch.combined) {
      bestMatch = { course, score, combined };
    }
  }
  
  if (isDebug) {
    candidates.sort((a, b) => b.combined - a.combined);
    console.log(`[CourseResolver] Candidates for "${venue.venueName}":`, candidates.slice(0, 5));
    if (bestMatch) {
      console.log(`[CourseResolver] ✓ Best: "${bestMatch.course.name}" (score: ${bestMatch.score.toFixed(2)}, combined: ${bestMatch.combined})`);
    }
  }
  
  // Accept match if we have reasonable confidence
  // With server-side search, we already know the name contains the keyword
  if (bestMatch && (bestMatch.score >= 0.3 || bestMatch.combined >= 100)) {
    return { course: bestMatch.course, score: bestMatch.score };
  }
  
  return null;
}

// Cache a successful match
async function cacheMatch(venue: VenueInput, courseId: string, confidence: number): Promise<void> {
  try {
    const { error } = await supabase.from('sr_course_map').upsert({
      sr_venue_name: venue.venueName,
      sr_venue_course_name: venue.venueCourseName || null,
      sr_city: venue.city || null,
      sr_country: venue.country || null,
      golf_course_id: courseId,
      confidence: confidence,
      source: confidence > 0.8 ? 'normalized' : 'fuzzy',
    }, { onConflict: 'sr_venue_name' });
    
    if (error) {
      console.warn(`[CourseResolver] Cache write failed:`, error.message);
    } else {
      console.log(`[CourseResolver] Cached: "${venue.venueName}" -> course ${courseId}`);
    }
  } catch (e) {
    console.warn(`[CourseResolver] Cache exception:`, e);
  }
}

export function useCourseImageResolver(venues: VenueInput[]) {
  return useQuery({
    queryKey: ['course-images-v2', venues.map(v => v.venueName).sort().join('|')],
    queryFn: async () => {
      if (!venues.length) return new Map<string, ResolvedCourse>();
      
      console.log('[CourseResolver] ===== RESOLUTION START =====');
      console.log('[CourseResolver] Venues to resolve:', venues.map(v => v.venueName));
      
      const results = new Map<string, ResolvedCourse>();
      const uncached: VenueInput[] = [];
      
      // Step 1: Check cache
      console.log('[CourseResolver] Step 1: Checking cache...');
      try {
        const { data: cached, error } = await supabase
          .from('sr_course_map')
          .select('sr_venue_name, golf_course_id, confidence, golf_courses:golf_course_id(id, name, thumbnail_image)')
          .in('sr_venue_name', venues.map(v => v.venueName));
        
        if (error) {
          console.warn('[CourseResolver] Cache query error:', error.message);
        } else {
          console.log(`[CourseResolver] Cache hits: ${cached?.length || 0}`);
          cached?.forEach((row: any) => {
            if (row.golf_courses) {
              console.log(`[CourseResolver] Cache hit: "${row.sr_venue_name}" -> "${row.golf_courses.name}"`);
              results.set(row.sr_venue_name, {
                golfCourseId: row.golf_courses.id,
                imageUrl: row.golf_courses.thumbnail_image,
                confidence: row.confidence,
                name: row.golf_courses.name,
              });
            }
          });
        }
      } catch (e) {
        console.warn('[CourseResolver] Cache check exception:', e);
      }
      
      // Find uncached venues
      for (const v of venues) {
        if (!results.has(v.venueName) && v.venueName) {
          uncached.push(v);
        }
      }
      
      console.log(`[CourseResolver] Step 2: Resolving ${uncached.length} uncached venues...`);
      
      // Step 2: Resolve uncached venues with server-side search
      for (const venue of uncached) {
        const { courses } = await searchCoursesForVenue(venue);
        
        if (courses.length > 0) {
          const match = findBestMatch(venue, courses);
          
          if (match) {
            results.set(venue.venueName, {
              golfCourseId: match.course.id,
              imageUrl: match.course.thumbnail_image,
              confidence: match.score,
              name: match.course.name,
            });
            
            // Cache for future lookups
            await cacheMatch(venue, match.course.id, match.score);
          } else {
            console.log(`[CourseResolver] ✗ No acceptable match for "${venue.venueName}"`);
          }
        } else {
          console.log(`[CourseResolver] ✗ No search results for "${venue.venueName}"`);
        }
      }
      
      console.log('[CourseResolver] ===== RESOLUTION COMPLETE =====');
      console.log('[CourseResolver] Results:', 
        Array.from(results.entries()).map(([k, v]) => `${k} -> ${v.name} (${v.imageUrl ? 'has image' : 'no image'})`).join(', ')
      );
      
      return results;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    enabled: venues.length > 0,
  });
}

// Single venue lookup convenience hook
export function useSingleCourseImage(venue: VenueInput | null) {
  const venues = venue ? [venue] : [];
  const { data, isLoading } = useCourseImageResolver(venues);
  
  return {
    courseImage: venue ? data?.get(venue.venueName) : undefined,
    isLoading,
  };
}
