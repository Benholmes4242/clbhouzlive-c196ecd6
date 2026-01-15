import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type RegionKey = "worldwide" | "usa" | "gb_i" | "europe";

type RawPlayedRow = {
  course_id: string;
  played_date: string | null;
  golf_courses: {
    id: string;
    name: string;
    country: string | null;
    region: string | null;
    sub_country: string | null;
    continent: string | null;
    global_rank: number | null;
    regional_rank: number | null;
    usa_rank: number | null;
    description: string | null;
    thumbnail_image: string | null;
    course_rating_aggregates?: { avg_overall_score: number | null }[];
  } | null;
};

type RatingRow = { 
  course_id: string; 
  rating: number | null;
  created_at: string;
};

// Regional predicates - shared, bulletproof filtering
const isGBI = (country: string) => 
  ['great britain & ireland', 'britain & ireland'].includes(country);

const isEuropeStrict = (country: string, continent: string) =>
  continent === 'europe' && country === 'continental europe';

const isEuropeContinental = (country: string, continent: string) =>
  continent === 'europe' && !isGBI(country) && country !== 'usa';

function regionMatch(country: string | null, continent: string | null, globalRank: number | null, r: RegionKey) {
  const c = (country ?? "").toLowerCase();
  const cont = (continent ?? "").toLowerCase();
  
  if (r === "worldwide") {
    // Worldwide: courses with global rank <= 100
    return globalRank !== null && globalRank <= 100;
  }
  if (r === "usa") return c === "usa";
  if (r === "gb_i") return isGBI(c);
  if (r === "europe") {
    // Continental Europe: continent is europe but exclude Great Britain & Ireland
    return isEuropeContinental(c, cont);
  }
  
  return false;
}

/**
 * Ratings-only: fetch courses user has rated
 */
async function fetchPlayedWithAverages(userId: string) {
  // Ratings-only: fetch from course_ratings only
  const { data: ratingsData, error: ratingsError } = await supabase
    .from("course_ratings")
    .select(`
      course_id,
      created_at,
      golf_courses (
        id,
        name,
        country,
        region,
        sub_country,
        continent,
        global_rank,
        regional_rank,
        usa_rank,
        description,
        thumbnail_image,
        course_rating_aggregates(avg_overall_score)
      )
    `)
    .eq("user_id", userId);
    
  if (ratingsError) throw ratingsError;
  
  // Map to expected structure
  const courses = (ratingsData ?? []).map(d => ({
    course_id: d.course_id,
    played_date: d.created_at,
    golf_courses: d.golf_courses
  }));
  
  return courses as RawPlayedRow[];
}

async function fetchViewerRatings(userId: string) {
  const { data, error } = await supabase
    .from("course_ratings")
    .select("course_id, rating, created_at")
    .eq("user_id", userId);
    
  if (error) throw error;
  return (data ?? []) as RatingRow[];
}

function getRegionalSortedCourses(courses: any[]) {
  return courses.sort((a, b) => {
    // First sort by user rating (descending)
    if (a.userRating !== null && b.userRating === null) return -1;
    if (a.userRating === null && b.userRating !== null) return 1;
    if (a.userRating !== null && b.userRating !== null) {
      if (a.userRating !== b.userRating) return b.userRating - a.userRating;
    }
    
    // Then by official ranking (ascending - lower is better)
    const aRank = a.globalRank || a.regionRank || a.usaRank || 999999;
    const bRank = b.globalRank || b.regionRank || b.usaRank || 999999;
    return aRank - bRank;
  });
}

export function usePlayedCoursesWithRatings(userId: string, region: RegionKey) {
  const { data: playedRows, isLoading: playedLoading, error: playedError } = useQuery({
    queryKey: ["played-courses-with-averages", userId], // Remove region from cache key to avoid cache misses
    queryFn: () => fetchPlayedWithAverages(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes - increased for stability
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection time
  });

  const { data: userRatings, isLoading: ratingsLoading, error: ratingsError } = useQuery({
    queryKey: ["user-course-ratings", userId],
    queryFn: () => fetchViewerRatings(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes - increased for stability
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection time
  });

  const ratingMap = useMemo(() => {
    const map = new Map<string, { rating: number | null; date: string }>();
    (userRatings ?? []).forEach(r => {
      map.set(r.course_id, { rating: r.rating, date: r.created_at });
    });
    return map;
  }, [userRatings]);

  const normalized = useMemo(() => {
    const courses = (playedRows ?? [])
      .map(row => {
        const gc = row.golf_courses;
        if (!gc) return null;
        
        const userRatingData = ratingMap.get(gc.id);
        
        return {
          id: `${region}-${gc.id}`,
          course_id: gc.id,
          golf_courses: gc,
          played_date: row.played_date,
          // Normalize data with lower-case strings to avoid case bugs
          country: (gc.country ?? '').toLowerCase(),
          continent: (gc.continent ?? '').toLowerCase(),
          averageRating: Number(gc.course_rating_aggregates?.[0]?.avg_overall_score ?? NaN),
          userRating: Number(userRatingData?.rating ?? NaN),
          globalRank: gc.global_rank,
          regionRank: gc.regional_rank,
          usaRank: gc.usa_rank,
        };
      })
      .filter(Boolean) as Array<{
        id: string;
        course_id: string;
        golf_courses: NonNullable<RawPlayedRow['golf_courses']>;
        played_date: string | null;
        country: string;
        continent: string;
        averageRating: number;
        userRating: number;
        globalRank: number | null;
        regionRank: number | null;
        usaRank: number | null;
      }>;

    return courses;
  }, [playedRows, ratingMap, region]);

  const regionPlayed = useMemo(() => {
    const filtered = normalized.filter(c => 
      regionMatch(c.golf_courses.country, c.golf_courses.continent, c.globalRank, region)
    );
    
    // Remove duplicates based on course_id, preferring rated courses
    const uniqueCoursesMap = new Map();
    
    filtered.forEach(course => {
      const courseId = course.course_id;
      const existing = uniqueCoursesMap.get(courseId);
      
      if (!existing) {
        uniqueCoursesMap.set(courseId, course);
      } else {
        // Prefer courses with user ratings over just played courses
        if (!isNaN(course.userRating) && isNaN(existing.userRating)) {
          uniqueCoursesMap.set(courseId, course);
        }
      }
    });

    const uniqueCourses = Array.from(uniqueCoursesMap.values());
    return getRegionalSortedCourses(uniqueCourses);
  }, [normalized, region]);

  return { 
    data: regionPlayed, 
    isLoading: playedLoading || ratingsLoading, 
    error: playedError ?? ratingsError 
  };
}