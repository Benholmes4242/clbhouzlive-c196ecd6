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
    course_rating_stats?: { average_rating: number | null }[];
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

async function fetchPlayedWithAverages(userId: string) {
  // ✅ Fetch from user_top100_courses
  const { data: top100Data, error: top100Error } = await supabase
    .from("user_top100_courses")
    .select(`
      course_id,
      played_date,
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
        course_rating_stats(average_rating)
      )
    `)
    .eq("user_id", userId)
    .eq("played", true);
    
  if (top100Error) throw top100Error;
  
  // ✅ Also fetch from course_ratings to get Continental Europe courses
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
        course_rating_stats(average_rating)
      )
    `)
    .eq("user_id", userId);
    
  if (ratingsError) throw ratingsError;
  
  // Combine and normalize both datasets
  const combined = [
    ...(top100Data ?? []).map(d => ({
      course_id: d.course_id,
      played_date: d.played_date,
      golf_courses: d.golf_courses
    })),
    ...(ratingsData ?? []).map(d => ({
      course_id: d.course_id,
      played_date: d.created_at, // Use rating date as played date
      golf_courses: d.golf_courses
    }))
  ];
  
  console.log('🔍 Fetched played courses from user_top100_courses:', (top100Data ?? []).map(d => ({
    name: d.golf_courses?.name,
    country: d.golf_courses?.country,
    continent: d.golf_courses?.continent
  })));
  
  console.log('🔍 Fetched rated courses from course_ratings:', (ratingsData ?? []).map(d => ({
    name: d.golf_courses?.name,
    country: d.golf_courses?.country,
    continent: d.golf_courses?.continent
  })));
  
  return combined as RawPlayedRow[];
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
    queryKey: ["played-courses-with-averages", region, userId], // include region to avoid cache collisions
    queryFn: () => fetchPlayedWithAverages(userId),
    enabled: !!userId,
    staleTime: 60_000,
  });

  const { data: userRatings, isLoading: ratingsLoading, error: ratingsError } = useQuery({
    queryKey: ["user-course-ratings", userId],
    queryFn: () => fetchViewerRatings(userId),
    enabled: !!userId,
    staleTime: 60_000,
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
          averageRating: Number(gc.course_rating_stats?.[0]?.average_rating ?? NaN),
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
    console.log(`🔍 [${region}] Starting filter with ${normalized.length} courses`);
    
    const filtered = normalized.filter(c => {
      const match = regionMatch(c.golf_courses.country, c.golf_courses.continent, c.globalRank, region);
      
      if (region === 'europe') {
        console.log(`🏌️ [Continental Europe] Checking course: ${c.golf_courses.name}`, {
          country: c.golf_courses.country,
          continent: c.golf_courses.continent,
          normalizedCountry: (c.golf_courses.country ?? "").toLowerCase(),
          normalizedContinent: (c.golf_courses.continent ?? "").toLowerCase(),
          matches: match,
          courseId: c.course_id
        });
      }
      
      return match;
    });
    
    console.log(`🎯 [${region}] Filtered to ${filtered.length} courses:`, filtered.map(c => c.golf_courses.name));
    
    // Remove duplicates based on course_id, preferring rated courses
    const uniqueCoursesMap = new Map();
    
    filtered.forEach(course => {
      const courseId = course.course_id;
      const existing = uniqueCoursesMap.get(courseId);
      
      if (!existing) {
        uniqueCoursesMap.set(courseId, course);
      } else {
        // Prefer courses with user ratings
        if (course.userRating !== null && course.userRating !== undefined && 
            (existing.userRating === null || existing.userRating === undefined)) {
          uniqueCoursesMap.set(courseId, course);
        }
      }
    });

    const uniqueCourses = Array.from(uniqueCoursesMap.values());
    const finalCourses = getRegionalSortedCourses(uniqueCourses);
    
    console.log(`✅ [${region}] Final result: ${finalCourses.length} courses:`, finalCourses.map(c => c.golf_courses.name));
    
    return finalCourses;
  }, [normalized, region]);

  return { 
    data: regionPlayed, 
    isLoading: playedLoading || ratingsLoading, 
    error: playedError ?? ratingsError 
  };
}