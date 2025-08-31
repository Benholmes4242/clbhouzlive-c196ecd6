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

function regionMatch(country: string | null, continent: string | null, globalRank: number | null, r: RegionKey) {
  const c = (country ?? "").toLowerCase();
  const cont = (continent ?? "").toLowerCase();
  
  if (r === "worldwide") {
    // Worldwide: courses with global rank <= 100
    return globalRank !== null && globalRank <= 100;
  }
  if (r === "usa") return c === "usa";
  if (r === "gb_i") return c === "britain & ireland";
  if (r === "europe") return c === "continental europe";
  
  return false;
}

async function fetchPlayedWithAverages(userId: string) {
  // ✅ average rating nested under golf_courses to avoid 400s
  const { data, error } = await supabase
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
    
  if (error) throw error;
  return (data ?? []) as RawPlayedRow[];
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
    queryKey: ["played-courses-with-averages", userId],
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
          averageRating: gc.course_rating_stats?.[0]?.average_rating ?? null,
          userRating: userRatingData?.rating ?? null,
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
        averageRating: number | null;
        userRating: number | null;
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
        // Prefer courses with user ratings
        if (course.userRating !== null && course.userRating !== undefined && 
            (existing.userRating === null || existing.userRating === undefined)) {
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