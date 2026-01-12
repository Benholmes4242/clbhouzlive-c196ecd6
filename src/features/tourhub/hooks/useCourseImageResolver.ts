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

// Generic words that appear in many course names - deprioritize as keywords
const GENERIC_WORDS = new Set([
  'the', 'at', 'of', 'and', 'golf', 'club', 'course', 'courses', 'resort', 
  'country', 'national', 'plantation', 'links', 'hills', 'valley', 'beach',
  'ocean', 'bay', 'lake', 'lakes', 'park', 'springs', 'creek', 'ridge',
  'north', 'south', 'east', 'west', 'royal', 'grand', 'blue', 'green',
  'white', 'black', 'red', 'gold', 'silver', 'championship', 'stadium',
  'players', 'international', 'municipal', 'public', 'private', 'inn', 'hotel'
]);

// Words that are likely proper nouns / distinctive names
function isDistinctiveWord(word: string): boolean {
  return word.length >= 4 && !GENERIC_WORDS.has(word);
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

// Normalize for matching: remove common suffixes and punctuation
// "Country Club", "Golf Club", "Golf Course" are treated as equivalent
function courseNormalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    // Strip common suffixes for comparison
    .replace(/\b(country\s*club|golf\s*club|golf\s*course|golf\s*resort|cc|gc)\b/g, ' ')
    .replace(/\b(the|at|of|and|golf|club|course|resort|country)\b/g, ' ')
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

// Extract search keywords from venue name, prioritizing distinctive proper nouns
function getSearchKeywords(venueName: string): { distinctive: string[]; generic: string[] } {
  const base = courseBaseName(venueName);
  const tokens = base
    .replace(/[^a-z0-9\s]/gi, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(t => t.length >= 3);
  
  const distinctive: string[] = [];
  const generic: string[] = [];
  
  for (const token of tokens) {
    if (isDistinctiveWord(token)) {
      distinctive.push(token);
    } else if (!GENERIC_WORDS.has(token) || token.length >= 5) {
      generic.push(token);
    }
  }
  
  // Dedupe while preserving order
  return {
    distinctive: [...new Set(distinctive)],
    generic: [...new Set(generic)],
  };
}

// Server-side search for courses matching a venue using multiple keywords
async function searchCoursesForVenue(venue: VenueInput): Promise<{
  courses: Array<{ id: string; name: string; thumbnail_image: string | null; country: string | null }>;
  searchTerms: string[];
}> {
  const { distinctive, generic } = getSearchKeywords(venue.venueName);
  
  // Priority: distinctive words first, then fall back to generic
  const allKeywords = [...distinctive, ...generic];
  
  if (allKeywords.length === 0) {
    console.log(`[CourseResolver] ✗ No keywords for "${venue.venueName}"`);
    return { courses: [], searchTerms: [] };
  }
  
  console.log(`[CourseResolver] Keywords for "${venue.venueName}":`, 
    { distinctive, generic, using: allKeywords.slice(0, 3) });
  
  // Search with up to 3 keywords in parallel, combining results
  const keywordsToSearch = allKeywords.slice(0, 3);
  const allCourses = new Map<string, { id: string; name: string; thumbnail_image: string | null; country: string | null }>();
  
  const searchPromises = keywordsToSearch.map(async (keyword) => {
    const { data, error } = await supabase
      .from('golf_courses')
      .select('id, name, thumbnail_image, country')
      .ilike('name', `%${keyword}%`)
      .limit(30);
    
    if (error) {
      console.error(`[CourseResolver] Search error for "${keyword}":`, error);
      return [];
    }
    
    return data || [];
  });
  
  const results = await Promise.all(searchPromises);
  
  // Combine results, deduping by id
  for (const courseList of results) {
    for (const course of courseList) {
      allCourses.set(course.id, course);
    }
  }
  
  const courses = Array.from(allCourses.values());
  console.log(`[CourseResolver] Found ${courses.length} unique courses for "${venue.venueName}"`);
  
  return { courses, searchTerms: keywordsToSearch };
}

// Find best match from search results - always return something if we have results
function findBestMatch(
  venue: VenueInput,
  courses: Array<{ id: string; name: string; thumbnail_image: string | null; country: string | null }>
): { course: typeof courses[0]; score: number; isLowConfidence: boolean } | null {
  if (courses.length === 0) return null;
  
  const isDebug = venue.venueName.toLowerCase().includes('tiburon') || 
                  venue.venueName.toLowerCase().includes('torrey') ||
                  venue.venueName.toLowerCase().includes('kapalua') ||
                  venue.venueName.toLowerCase().includes('waialae');
  
  let bestMatch: { course: typeof courses[0]; score: number; combined: number } | null = null;
  const candidates: Array<{ name: string; score: number; boost: number; combined: number; hasImage: boolean }> = [];
  
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
    
    // Country match bonus - also penalize mismatches
    let countryBonus = 0;
    if (venue.country && course.country) {
      countryBonus = venue.country === course.country ? 20 : -30;
    }
    
    // Prefer courses with images
    const imageBonus = course.thumbnail_image ? 5 : 0;
    
    const combined = score * 100 + boost + exactBonus + variantBonus + countryBonus + imageBonus;
    
    candidates.push({ name: course.name, score, boost, combined, hasImage: !!course.thumbnail_image });
    
    if (!bestMatch || combined > bestMatch.combined) {
      bestMatch = { course, score, combined };
    }
  }
  
  if (isDebug) {
    candidates.sort((a, b) => b.combined - a.combined);
    console.log(`[CourseResolver] Top 5 candidates for "${venue.venueName}":`, candidates.slice(0, 5));
    if (bestMatch) {
      console.log(`[CourseResolver] ✓ Best: "${bestMatch.course.name}" (score: ${bestMatch.score.toFixed(2)}, combined: ${bestMatch.combined})`);
    }
  }
  
  // High confidence: good score or high combined
  if (bestMatch && (bestMatch.score >= 0.3 || bestMatch.combined >= 100)) {
    return { course: bestMatch.course, score: bestMatch.score, isLowConfidence: false };
  }
  
  // Low confidence fallback: return best available if country matches (or no country check)
  if (bestMatch) {
    const countryMatches = !venue.country || bestMatch.course.country === venue.country;
    if (countryMatches) {
      console.log(`[CourseResolver] ⚠ LOW CONFIDENCE match for "${venue.venueName}" -> "${bestMatch.course.name}" (combined: ${bestMatch.combined})`);
      return { course: bestMatch.course, score: bestMatch.score, isLowConfidence: true };
    }
  }
  
  return null;
}

// Cache a successful match
async function cacheMatch(venue: VenueInput, courseId: string, confidence: number, isLowConfidence: boolean): Promise<void> {
  try {
    const source = isLowConfidence ? 'low_confidence' : (confidence > 0.8 ? 'normalized' : 'fuzzy');
    
    const { error } = await supabase.from('sr_course_map').upsert({
      sr_venue_name: venue.venueName,
      sr_venue_course_name: venue.venueCourseName || null,
      sr_city: venue.city || null,
      sr_country: venue.country || null,
      golf_course_id: courseId,
      confidence: confidence,
      source,
    }, { onConflict: 'sr_venue_name' });
    
    if (error) {
      console.warn(`[CourseResolver] Cache write failed:`, error.message);
    } else {
      const confidenceLabel = isLowConfidence ? '⚠ LOW CONF' : '✓';
      console.log(`[CourseResolver] ${confidenceLabel} Cached: "${venue.venueName}" -> course ${courseId}`);
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
            
            // Cache for future lookups (mark low confidence separately)
            await cacheMatch(venue, match.course.id, match.score, match.isLowConfidence);
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
