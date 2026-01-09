/**
 * useCourseImageResolver - Resolves SR venue names to golf_courses images
 * Uses base name extraction + trigram matching with caching
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

// Calculate similarity score using trigram-like token overlap
function calculateSimilarity(a: string, b: string): number {
  const normA = courseNormalize(courseBaseName(a));
  const normB = courseNormalize(courseBaseName(b));
  
  const tokensA = new Set(normA.split(' ').filter(Boolean));
  const tokensB = new Set(normB.split(' ').filter(Boolean));
  
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  
  const intersection = [...tokensA].filter(t => tokensB.has(t)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  
  return intersection / union; // Jaccard similarity
}

// Boost score for primary/championship variants
// Black Course is typically the primary tournament course at Tiburon
function getVariantBoost(courseName: string): number {
  const lower = courseName.toLowerCase();
  if (lower.includes(' black ')) return 120;  // Tiburon Black Course is primary
  if (lower.includes(' south ')) return 100;
  if (lower.includes(' championship ')) return 90;
  if (lower.includes(' stadium ')) return 85;
  if (lower.includes(' players ')) return 80;
  if (lower.includes(' north ')) return 70;
  if (lower.includes(' gold ')) return 60;
  if (lower.includes(' links ')) return 50;
  return 0;
}

export function useCourseImageResolver(venues: VenueInput[]) {
  return useQuery({
    queryKey: ['course-images', venues.map(v => v.venueName).join(',')],
    queryFn: async () => {
      if (!venues.length) return new Map<string, ResolvedCourse>();
      
      const results = new Map<string, ResolvedCourse>();
      const uncached: VenueInput[] = [];
      
      // Check cache first
      try {
        const { data: cached } = await supabase
          .from('sr_course_map')
          .select('sr_venue_name, golf_course_id, confidence, golf_courses:golf_course_id(id, name, thumbnail_image)')
          .in('sr_venue_name', venues.map(v => v.venueName));
        
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
      } catch (e) {
        // Cache check failed, proceed with resolution
        console.log('Cache check failed, resolving fresh');
      }
      
      // Find uncached venues
      venues.forEach(v => {
        if (!results.has(v.venueName)) {
          uncached.push(v);
        }
      });
      
      // Resolve uncached venues
      if (uncached.length > 0) {
        // Fetch ALL courses that could match (don't filter by country here - do it in matching)
        const { data: courses } = await supabase
          .from('golf_courses')
          .select('id, name, thumbnail_image, country, sub_country')
          .limit(2000);
        
        if (courses) {
          for (const venue of uncached) {
            // Build search name: prefer "VenueName - CourseName" format, or just venue name
            const searchName = venue.venueCourseName 
              ? `${venue.venueName} - ${venue.venueCourseName}`
              : venue.venueName;
            const searchBase = courseBaseName(venue.venueName); // Always use venue base for matching
            const searchNorm = courseNormalize(searchBase);
            
            // Debug logging for key venues
            if (venue.venueName.toLowerCase().includes('tiburon') || venue.venueName.toLowerCase().includes('torrey')) {
              console.log(`[CourseResolver] Resolving: "${searchName}" (venue: "${venue.venueName}", course: "${venue.venueCourseName}")`);
              console.log(`  Base: "${searchBase}", Normalized: "${searchNorm}"`);
            }
            
            // Find best match
            let bestMatch: { course: typeof courses[0]; score: number; boost: number; exactMatch: boolean; countryMatch: boolean; variantMatch: boolean } | null = null;
            const candidates: { name: string; score: number; boost: number }[] = [];
            
            for (const course of courses) {
              // Prefer same country, but don't exclude entirely
              const countryMatch = !venue.country || course.country === venue.country;
              
              const courseBase = courseBaseName(course.name);
              const score = calculateSimilarity(venue.venueName, course.name); // Use venue name for base matching
              const boost = getVariantBoost(course.name);
              
              // Also try direct base name comparison
              const baseScore = calculateSimilarity(searchBase, courseBase);
              const finalScore = Math.max(score, baseScore);
              
              // If base names match exactly (e.g., "tiburon" vs "tiburon"), that's a strong signal
              const exactBaseMatch = courseNormalize(searchBase) === courseNormalize(courseBase);
              const exactBonus = exactBaseMatch ? 50 : 0;
              
              candidates.push({ name: course.name, score: finalScore, boost });
              
              // Boost for matching the specific course variant (Gold, Black, etc.)
              let variantMatchBonus = 0;
              if (venue.venueCourseName) {
                const vcNorm = venue.venueCourseName.toLowerCase();
                const cNorm = course.name.toLowerCase();
                if (cNorm.includes(vcNorm) || vcNorm.includes(cNorm.split(' - ')[1] || '')) {
                  variantMatchBonus = 150; // Strong bonus for exact variant match
                }
              }
              
              // Combined score: similarity * 100 + variant boost + exact match bonus + country bonus + variant match
              const countryBonus = countryMatch ? 10 : 0;
              const combinedScore = finalScore * 100 + boost + exactBonus + countryBonus + variantMatchBonus;
              const bestCombined = bestMatch 
                ? (bestMatch.score * 100 + bestMatch.boost + (bestMatch.exactMatch ? 50 : 0) + (bestMatch.countryMatch ? 10 : 0) + (bestMatch.variantMatch ? 150 : 0)) 
                : 0;
              
              if (combinedScore > bestCombined && finalScore >= 0.35) {
                bestMatch = { course, score: finalScore, boost, exactMatch: exactBaseMatch, countryMatch, variantMatch: variantMatchBonus > 0 };
              }
            }
            
            // Debug logging
            if (venue.venueName.toLowerCase().includes('tiburon') || venue.venueName.toLowerCase().includes('torrey')) {
              const topCandidates = candidates
                .sort((a, b) => (b.score * 100 + b.boost) - (a.score * 100 + a.boost))
                .slice(0, 5);
              console.log(`  Top 5 candidates:`, topCandidates);
              if (bestMatch) {
                console.log(`  ✓ Matched: "${bestMatch.course.name}" (score: ${bestMatch.score.toFixed(2)}, variant: ${bestMatch.variantMatch}, image: ${bestMatch.course.thumbnail_image ? 'YES' : 'NO'})`);
              } else {
                console.log(`  ✗ No match found`);
              }
            }
            
            if (bestMatch && bestMatch.score >= 0.4) {
              results.set(venue.venueName, {
                golfCourseId: bestMatch.course.id,
                imageUrl: bestMatch.course.thumbnail_image,
                confidence: bestMatch.score,
                name: bestMatch.course.name,
              });
              
              // Cache the result (fire-and-forget)
              supabase.from('sr_course_map').upsert({
                sr_venue_name: venue.venueName,
                sr_venue_course_name: venue.venueCourseName,
                sr_city: venue.city,
                sr_country: venue.country,
                golf_course_id: bestMatch.course.id,
                confidence: bestMatch.score,
                match_type: bestMatch.score > 0.8 ? 'normalized' : 'fuzzy',
              }, { onConflict: 'sr_venue_name,sr_city,sr_country' }).then(() => {});
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
