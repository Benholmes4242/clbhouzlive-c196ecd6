/**
 * useHubHeroData - Fetches hero card data with priority:
 * 1. Next upcoming game
 * 2. Next upcoming trip (when trips table exists)
 * 3. Fallback: Global Top 100 #1 course
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
};

export type HeroTripData = {
  type: 'trip';
  tripId: string;
  tripName: string;
  startDate: string;
  endDate: string;
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
  secondary: HeroData | null; // Only set when both game and trip exist
  hasCarousel: boolean;
};

// Fallback image for when course has no image
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

  return {
    type: 'game',
    gameId: nextGame.id,
    startTimeISO: nextGame.start_time,
    slotsOpen: nextGame.slots_open ?? 0,
    slotsTotal: nextGame.slots_total ?? 4,
    courseName: nextGame.course_name || 'Course TBD',
    courseImageUrl: courseImageUrl || FALLBACK_HERO_IMAGE,
    isHost: nextGame.host_user_id === userId,
  };
}

async function fetchNextTrip(_userId: string): Promise<HeroTripData | null> {
  // TODO: Implement when trips table exists
  // For now, return null as no trips table exists yet
  return null;
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

export function useHubHeroData() {
  return useQuery<HubHeroResult>({
    queryKey: ['hub-hero-data', HUB_DEMO_MODE],
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      // Demo mode - return mock data immediately
      if (HUB_DEMO_MODE) {
        return MOCK_HERO_DATA as HubHeroResult;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch all data in parallel
      const [nextGame, nextTrip, fallbackCourse] = await Promise.all([
        user ? fetchNextGame(user.id) : null,
        user ? fetchNextTrip(user.id) : null,
        fetchFallbackCourse(),
      ]);

      // Determine what to show
      if (nextGame && nextTrip) {
        // Both exist - show carousel
        return {
          primary: nextGame,
          secondary: nextTrip,
          hasCarousel: true,
        };
      }

      if (nextGame) {
        return {
          primary: nextGame,
          secondary: null,
          hasCarousel: false,
        };
      }

      if (nextTrip) {
        return {
          primary: nextTrip,
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
