/**
 * useHubHeroDataV3 - Enhanced hero data hook with trip support
 * Priority: 1. Upcoming Trip, 2. Upcoming Game, 3. Fallback
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { HUB_DEMO_MODE, MOCK_HERO_DATA } from '../hubDemoConfig';

// Global Top 100 list ID
const GLOBAL_TOP100_LIST_ID = 'df05127d-9f5c-47ab-9e2f-949a200eeaf2';

export type HeroGameData = {
  type: 'game';
  gameId: string;
  startTimeISO: string;
  slotsOpen: number;
  slotsTotal: number;
  courseName: string;
  courseImageUrl: string | null;
  isHost: boolean;
  joinedCount?: number;
};

export type HeroTripData = {
  type: 'trip';
  tripId: string;
  tripName: string;
  startDate: string;
  endDate: string;
  location: string | null;
  primaryCourseName: string;
  primaryCourseImageUrl: string | null;
};

export type HeroFallbackData = {
  type: 'fallback';
  courseId: string;
  courseName: string;
  courseLocation: string | null;
  courseImageUrl: string | null;
  rank: number;
};

export type HeroData = HeroGameData | HeroTripData | HeroFallbackData;

export type HubHeroResult = {
  primary: HeroData | null;
  secondary: HeroData | null;
  hasCarousel: boolean;
};

const FALLBACK_HERO_IMAGE = 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&h=400&fit=crop&q=80';

async function fetchNextGame(userId: string): Promise<HeroGameData | null> {
  const nowIso = new Date().toISOString();

  // Fetch games where user is host
  const { data: hostingGames } = await supabase
    .from('games')
    .select('id, course_id, course_name, start_time, status, slots_total, slots_open, host_user_id')
    .eq('host_user_id', userId)
    .eq('status', 'active')
    .gte('start_time', nowIso)
    .order('start_time', { ascending: true })
    .limit(1);

  // Fetch games where user is participant
  const { data: participantRows } = await supabase
    .from('game_participants')
    .select('game_id')
    .eq('user_id', userId);

  const participantGameIds = participantRows?.map(p => p.game_id) || [];

  let joinedGames: typeof hostingGames = [];
  if (participantGameIds.length > 0) {
    const { data } = await supabase
      .from('games')
      .select('id, course_id, course_name, start_time, status, slots_total, slots_open, host_user_id')
      .in('id', participantGameIds)
      .neq('host_user_id', userId)
      .eq('status', 'active')
      .gte('start_time', nowIso)
      .order('start_time', { ascending: true })
      .limit(1);
    joinedGames = data || [];
  }

  // Combine and find the soonest game
  const allGames = [...(hostingGames || []), ...(joinedGames || [])];
  if (allGames.length === 0) return null;

  allGames.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  const nextGame = allGames[0];

  // Fetch course image if we have a course_id
  let courseImageUrl: string | null = null;
  if (nextGame.course_id) {
    const { data: course } = await supabase
      .from('golf_courses')
      .select('thumbnail_image')
      .eq('id', nextGame.course_id)
      .single();
    courseImageUrl = course?.thumbnail_image || null;
  }

  // Fetch joined count for this game
  const { count: joinedCount } = await supabase
    .from('game_participants')
    .select('*', { count: 'exact', head: true })
    .eq('game_id', nextGame.id)
    .eq('rsvp_status', 'going');

  return {
    type: 'game',
    gameId: nextGame.id,
    startTimeISO: nextGame.start_time,
    slotsOpen: nextGame.slots_open ?? 0,
    slotsTotal: nextGame.slots_total ?? 4,
    courseName: nextGame.course_name || 'Course TBD',
    courseImageUrl: courseImageUrl || FALLBACK_HERO_IMAGE,
    isHost: nextGame.host_user_id === userId,
    joinedCount: (joinedCount || 0) + 1,
  };
}

async function fetchNextTrip(userId: string): Promise<HeroTripData | null> {
  const today = new Date().toISOString().split('T')[0]; // Just the date part

  // Fetch upcoming trips where user is creator
  const { data: trips, error } = await supabase
    .from('trips')
    .select(`
      id,
      name,
      start_date,
      end_date,
      cover_image_url,
      description
    `)
    .eq('created_by', userId)
    .gte('end_date', today)
    .order('start_date', { ascending: true })
    .limit(1);

  if (error || !trips || trips.length === 0) {
    // Also check trip_participants for trips user has joined
    const { data: participantTrips } = await supabase
      .from('trip_participants')
      .select('trip_id')
      .eq('user_id', userId);

    if (!participantTrips || participantTrips.length === 0) return null;

    const tripIds = participantTrips.map(p => p.trip_id);
    
    const { data: joinedTrips } = await supabase
      .from('trips')
      .select(`
        id,
        name,
        start_date,
        end_date,
        cover_image_url,
        description
      `)
      .in('id', tripIds)
      .gte('end_date', today)
      .order('start_date', { ascending: true })
      .limit(1);

    if (!joinedTrips || joinedTrips.length === 0) return null;

    const trip = joinedTrips[0];
    
    // Get image: cover_image_url > first itinerary course > name match > fallback
    const imageUrl = await getTripHeroImage(trip.id, trip.cover_image_url, trip.name);
    
    return {
      type: 'trip',
      tripId: trip.id,
      tripName: trip.name,
      startDate: trip.start_date,
      endDate: trip.end_date,
      location: null,
      primaryCourseName: trip.name,
      primaryCourseImageUrl: imageUrl,
    };
  }

  const trip = trips[0];
  
  // Get image: cover_image_url > first itinerary course > name match > fallback
  const imageUrl = await getTripHeroImage(trip.id, trip.cover_image_url, trip.name);
  
  return {
    type: 'trip',
    tripId: trip.id,
    tripName: trip.name,
    startDate: trip.start_date,
    endDate: trip.end_date,
    location: null,
    primaryCourseName: trip.name,
    primaryCourseImageUrl: imageUrl,
  };
}

// Get the best available image for a trip hero
async function getTripHeroImage(
  tripId: string, 
  coverImageUrl: string | null, 
  tripName: string
): Promise<string> {
  // 1. Use cover image if set
  if (coverImageUrl) {
    return coverImageUrl;
  }
  
  // 2. Try to get the first course from the trip's itinerary (games with trip_id)
  const firstCourseImage = await getFirstItineraryCourseImage(tripId);
  if (firstCourseImage) {
    return firstCourseImage;
  }
  
  // 3. Try to find a matching course by name
  const matchedImage = await findCourseImageByName(tripName);
  if (matchedImage) {
    return matchedImage;
  }
  
  // 4. Fall back to default
  return FALLBACK_HERO_IMAGE;
}

// Get the first course's thumbnail from the trip's itinerary (games table)
async function getFirstItineraryCourseImage(tripId: string): Promise<string | null> {
  // Fetch the first game in the trip's itinerary
  const { data: games } = await supabase
    .from('games')
    .select('course_id')
    .eq('trip_id', tripId)
    .order('start_time', { ascending: true })
    .limit(1);
  
  if (!games || games.length === 0 || !games[0].course_id) {
    return null;
  }
  
  // Fetch the course's thumbnail
  const { data: course } = await supabase
    .from('golf_courses')
    .select('thumbnail_image')
    .eq('id', games[0].course_id)
    .single();
  
  return course?.thumbnail_image || null;
}

// Helper to find a course image by searching for course name similar to trip name
async function findCourseImageByName(tripName: string): Promise<string | null> {
  // Extract potential course name from trip name (remove "Trip" suffix and similar)
  const cleanName = tripName
    .replace(/\s*trip\s*/gi, '')
    .replace(/\s*golf\s*/gi, '')
    .trim();
  
  if (!cleanName) return null;
  
  // Search for courses with similar names
  const { data: courses } = await supabase
    .from('golf_courses')
    .select('thumbnail_image')
    .ilike('name', `%${cleanName}%`)
    .not('thumbnail_image', 'is', null)
    .limit(1);
  
  return courses?.[0]?.thumbnail_image || null;
}

async function fetchFallbackCourse(): Promise<HeroFallbackData | null> {
  const { data, error } = await supabase
    .from('course_top100_memberships')
    .select(`
      rank,
      course:golf_courses!inner (
        id,
        name,
        region,
        country,
        thumbnail_image
      )
    `)
    .eq('list_id', GLOBAL_TOP100_LIST_ID)
    .order('rank', { ascending: true })
    .limit(1)
    .single();

  if (error || !data) return null;

  const course = data.course as any;
  const location = [course.region, course.country].filter(Boolean).join(', ');

  return {
    type: 'fallback',
    courseId: course.id,
    courseName: course.name,
    courseLocation: location || null,
    courseImageUrl: course.thumbnail_image || FALLBACK_HERO_IMAGE,
    rank: data.rank,
  };
}

export function useHubHeroDataV3() {
  return useQuery<HubHeroResult>({
    queryKey: ['hub-hero-data-v3', HUB_DEMO_MODE],
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      // Demo mode - return mock data immediately
      if (HUB_DEMO_MODE) {
        return MOCK_HERO_DATA as HubHeroResult;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      // If no user, return empty data (not demo data)
      if (!user) {
        return {
          primary: null,
          secondary: null,
          hasCarousel: false,
        };
      }
      
      // Fetch all data in parallel
      const [nextTrip, nextGame, fallbackCourse] = await Promise.all([
        fetchNextTrip(user.id),
        fetchNextGame(user.id),
        fetchFallbackCourse(),
      ]);

      // Priority: Trip first (per spec), then Game, then Fallback
      if (nextTrip && nextGame) {
        // Both exist - show trip as primary (trip takes priority per spec)
        return {
          primary: nextTrip,
          secondary: nextGame,
          hasCarousel: true,
        };
      }

      if (nextTrip) {
        return {
          primary: nextTrip,
          secondary: null,
          hasCarousel: false,
        };
      }

      if (nextGame) {
        return {
          primary: nextGame,
          secondary: null,
          hasCarousel: false,
        };
      }

      // Fallback to #1 course
      return {
        primary: fallbackCourse,
        secondary: null,
        hasCarousel: false,
      };
    },
  });
}
