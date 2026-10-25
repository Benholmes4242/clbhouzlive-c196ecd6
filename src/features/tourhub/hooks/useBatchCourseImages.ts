/**
 * useBatchCourseImages — THE one course-photo resolver for every Tour surface
 * (CB55). Keyed by TOURNAMENT ID: the Overview hero and Tournament Detail call
 * it with the same tournament id and get the same photo.
 *
 * Resolution order per tournament:
 *   1. sr_tournaments.golf_course_id → that course's thumbnail_image. A linked
 *      course with NO photo falls through — never stop at an empty linked photo.
 *   2. VENUE_IMAGE_OVERRIDES by venue name.
 *   3. sr_course_map saved match by venue name → that course's thumbnail_image,
 *      if it has one.
 *   4. Live catalogue search using everything the tournament row knows (venue
 *      name, venue course name, city, state, country). A match is DISPLAYED
 *      only if it passes the same isVenueGeographyCompatible gate that gates
 *      saving it — a confident match in the wrong country never reaches the
 *      screen. A passing match is saved to sr_course_map.
 *   5. Otherwise no photo, and the surface shows its existing gradient.
 *
 * Steps 1–3 cost at most three queries for any batch size; step 4 runs in
 * parallel only for the tournaments still unresolved.
 *
 * Cache: 30 minutes when every tournament in the batch resolved a photo;
 * 5 minutes when any resolved to no photo, so a course added to the catalogue
 * appears on the next mount without an app restart.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isVenueGeographyCompatible } from '@/lib/tourhub/venueGeography';
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
import norwoodHillsCC from '@/assets/courses/norwood-hills-country-club.jpg.asset.json';

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

export interface TournamentImageInput {
  id: string;
  venue_name: string | null;
  venue_course_name?: string | null;
  venue_city?: string | null;
  venue_state?: string | null;
  venue_country?: string | null;
}

interface VenueInput {
  venueName: string;
  venueCourseName?: string | null;
  city?: string | null;
  /** SportRadar ISO3 venue_country. */
  country?: string | null;
  /** SportRadar venue_state (USA/CAN only). */
  state?: string | null;
}

type CandidateCourse = {
  id: string;
  name: string;
  thumbnail_image: string | null;
  sub_country: string | null;
};

const PHOTO_STALE_MS = 30 * 60 * 1000;
const NO_PHOTO_STALE_MS = 5 * 60 * 1000;

/**
 * A cached "no photo" must not outlive the reason for it: batches where every
 * tournament resolved a photo keep the 30-minute cache; a batch containing any
 * no-photo tournament is re-checked on the next mount after 5 minutes.
 */
export function courseImageBatchStaleTime(data: Map<string, string | null> | undefined): number {
  if (!data) return NO_PHOTO_STALE_MS;
  for (const url of data.values()) {
    if (!url) return NO_PHOTO_STALE_MS;
  }
  return PHOTO_STALE_MS;
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
  courses: CandidateCourse[];
  searchTerms: string[];
}> {
  const { distinctive, generic } = getSearchKeywords(venue.venueName);

  // Priority: distinctive words first, then fall back to generic
  const allKeywords = [...distinctive, ...generic];

  if (allKeywords.length === 0) {
    return { courses: [], searchTerms: [] };
  }

  // Search with up to 3 keywords in parallel, combining results
  const keywordsToSearch = allKeywords.slice(0, 3);
  const allCourses = new Map<string, CandidateCourse>();

  const searchPromises = keywordsToSearch.map(async (keyword) => {
    // No country filter here: golf_courses.country is a region grouping and
    // never equals an ISO3 code. The geography gate runs in findBestMatch.
    const query = supabase
      .from('golf_courses')
      .select('id, name, thumbnail_image, sub_country')
      .ilike('name', `%${keyword}%`)
      .order('name')
      .limit(100);
    const { data, error } = await query;

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

  return { courses, searchTerms: keywordsToSearch };
}

// Find best match among geography-compatible candidates only.
function findBestMatch(
  venue: VenueInput,
  allCourses: CandidateCourse[]
): { course: CandidateCourse; score: number; isLowConfidence: boolean } | null {
  // THE GATE: incompatible candidates are removed before any scoring.
  const venueGeo = { country: venue.country, state: venue.state };
  const courses = allCourses.filter((c) => isVenueGeographyCompatible(venueGeo, c));
  if (courses.length === 0) return null;

  let bestMatch: { course: CandidateCourse; score: number; combined: number } | null = null;

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

    // Prefer courses with images
    const imageBonus = course.thumbnail_image ? 5 : 0;

    const combined = score * 100 + boost + exactBonus + variantBonus + imageBonus;

    if (!bestMatch || combined > bestMatch.combined) {
      bestMatch = { course, score, combined };
    }
  }

  if (!bestMatch) return null;
  if (bestMatch.score >= 0.3 || bestMatch.combined >= 100) {
    return { course: bestMatch.course, score: bestMatch.score, isLowConfidence: false };
  }
  return { course: bestMatch.course, score: bestMatch.score, isLowConfidence: true };
}

// Cache a successful match
async function cacheMatch(venue: VenueInput, course: CandidateCourse, confidence: number, isLowConfidence: boolean): Promise<void> {
  // Never write a row that fails the gate, whatever the caller believed.
  if (!isVenueGeographyCompatible({ country: venue.country, state: venue.state }, course)) return;
  const courseId = course.id;
  try {
    // Never overwrite a hand-corrected mapping: read first, skip if 'manual'.
    const { data: existing } = await supabase
      .from('sr_course_map')
      .select('source')
      .eq('sr_venue_name', venue.venueName)
      .maybeSingle();
    if ((existing as { source?: string } | null)?.source === 'manual') return;
    // sr_course_map_source_check allows only exact|fuzzy|manual; a machine match is 'fuzzy'.
    void isLowConfidence;
    const source = 'fuzzy';

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
    }
  } catch (e) {
    console.warn(`[CourseResolver] Cache exception:`, e);
  }
}

/**
 * THE one course-photo resolver for every Tour surface (CB55) — see the file
 * header for the resolution order. Keyed by tournament id, so the Overview
 * hero and Tournament Detail can never disagree.
 */
export function useBatchCourseImages(
  tournaments: TournamentImageInput[] | undefined,
) {
  const rows = (tournaments || []).filter((t) => !!t?.id);
  const key = rows.map((t) => `${t.id}:${t.venue_name ?? ''}`).sort().join('|');

  return useQuery({
    queryKey: ['batch-course-images-v4', key],
    queryFn: async (): Promise<Map<string, string | null>> => {
      const result = new Map<string, string | null>();
      if (rows.length === 0) return result;

      // Step 1: linked course photo. A linked course with no photo falls through.
      const { data: links } = await supabase
        .from('sr_tournaments')
        .select('id, golf_course_id')
        .in('id', rows.map((t) => t.id));
      const courseIdByTournament = new Map<string, string>();
      for (const l of (links ?? []) as Array<{ id: string; golf_course_id: string | null }>) {
        if (l.golf_course_id) courseIdByTournament.set(l.id, l.golf_course_id);
      }
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
        for (const [tid, cid] of courseIdByTournament) {
          const url = img.get(cid);
          if (url) result.set(tid, url);
        }
      }

      // Step 2: authored overrides by venue name.
      let pending = rows.filter((t) => !result.has(t.id));
      const afterOverrides: typeof pending = [];
      for (const t of pending) {
        const o = t.venue_name ? VENUE_IMAGE_OVERRIDES[t.venue_name] : undefined;
        if (o) result.set(t.id, o);
        else afterOverrides.push(t);
      }
      pending = afterOverrides;

      // Step 3: saved sr_course_map match by venue name, if the course has a photo.
      const cacheNames = Array.from(new Set(pending.map((t) => t.venue_name).filter((n): n is string => !!n)));
      if (cacheNames.length > 0) {
        const { data: cached } = await supabase
          .from('sr_course_map')
          .select('sr_venue_name, golf_courses:golf_course_id(thumbnail_image)')
          .in('sr_venue_name', cacheNames);
        const byName = new Map<string, string>();
        for (const row of (cached ?? []) as any[]) {
          if (row.golf_courses?.thumbnail_image) byName.set(row.sr_venue_name, row.golf_courses.thumbnail_image);
        }
        const afterCache: typeof pending = [];
        for (const t of pending) {
          const u = t.venue_name ? byName.get(t.venue_name) : undefined;
          if (u) result.set(t.id, u);
          else afterCache.push(t);
        }
        pending = afterCache;
      }

      // Step 4: live catalogue search, in parallel, only for tournaments still
      // unresolved. The geography gate inside findBestMatch decides what may be
      // DISPLAYED; cacheMatch re-checks the same gate before saving.
      const searchable = pending.filter((t) => !!t.venue_name);
      const resolutions = await Promise.all(
        searchable.map(async (t) => {
          const venue: VenueInput = {
            venueName: t.venue_name as string,
            venueCourseName: t.venue_course_name,
            city: t.venue_city,
            country: t.venue_country,
            state: t.venue_state,
          };
          const { courses } = await searchCoursesForVenue(venue);
          if (courses.length === 0) return null;
          const match = findBestMatch(venue, courses);
          if (!match) return null;
          return { tournamentId: t.id, venue, match };
        }),
      );

      for (const r of resolutions) {
        if (!r) continue;
        if (r.match.course.thumbnail_image) result.set(r.tournamentId, r.match.course.thumbnail_image);
      }

      // Cache writes are fire-and-parallel: they never gate the render.
      await Promise.all(
        resolutions
          .filter((r): r is NonNullable<typeof r> => !!r)
          .map((r) =>
            cacheMatch(r.venue, r.match.course, r.match.score, r.match.isLowConfidence),
          ),
      );

      // Step 5: every unresolved tournament is an explicit no-photo entry, so
      // courseImageBatchStaleTime can shorten the cache for this batch.
      for (const t of rows) {
        if (!result.has(t.id)) result.set(t.id, null);
      }
      return result;
    },
    staleTime: (query) => courseImageBatchStaleTime(query.state.data),
    enabled: rows.length > 0,
  });
}
