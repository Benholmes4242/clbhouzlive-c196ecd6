/**
 * useNextUserGame - Fetches the next upcoming game for the current user
 * Includes course details for hero image display
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type NextGameCourse = {
  id: string;
  name: string;
  region: string | null;
  country: string | null;
  heroImageUrl: string | null;
};

export type NextUserGame = {
  gameId: string;
  startTimeISO: string;
  slotsOpen: number;
  slotsTotal: number;
  status: string;
  courseName: string | null;
  course: NextGameCourse | null;
  isHost: boolean;
};

export function useNextUserGame() {
  return useQuery<NextUserGame | null>({
    queryKey: ['hub-next-game'],
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const nowIso = new Date().toISOString();

      // Fetch games where user is host
      const { data: hostingGames } = await supabase
        .from('games')
        .select('id, course_id, course_name, start_time, status, slots_total, slots_open, host_user_id')
        .eq('host_user_id', user.id)
        .eq('status', 'active')
        .gte('start_time', nowIso)
        .order('start_time', { ascending: true })
        .limit(1);

      // Fetch games where user is participant
      const { data: participantRows } = await supabase
        .from('game_participants')
        .select('game_id')
        .eq('user_id', user.id);

      const participantGameIds = participantRows?.map(p => p.game_id) || [];

      let joinedGames: typeof hostingGames = [];
      if (participantGameIds.length > 0) {
        const { data } = await supabase
          .from('games')
          .select('id, course_id, course_name, start_time, status, slots_total, slots_open, host_user_id')
          .in('id', participantGameIds)
          .neq('host_user_id', user.id)
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

      // Fetch course details if we have a course_id
      let courseData: NextGameCourse | null = null;
      if (nextGame.course_id) {
        const { data: course } = await supabase
          .from('golf_courses')
          .select('id, name, region, country, thumbnail_image')
          .eq('id', nextGame.course_id)
          .single();

        if (course) {
          courseData = {
            id: course.id,
            name: course.name,
            region: course.region,
            country: course.country,
            heroImageUrl: course.thumbnail_image,
          };
        }
      }

      return {
        gameId: nextGame.id,
        startTimeISO: nextGame.start_time,
        slotsOpen: nextGame.slots_open ?? 0,
        slotsTotal: nextGame.slots_total ?? 4,
        status: nextGame.status ?? 'active',
        courseName: nextGame.course_name,
        course: courseData,
        isHost: nextGame.host_user_id === user.id,
      };
    },
  });
}
