import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfYear, startOfMonth, subMonths, formatDistanceToNow } from 'date-fns';

export interface Top100PilgrimageNextStop {
  course_id: string;
  course_name: string;
  country: string | null;
  sub_country: string | null;
  list_slug: string;
  list_name: string;
  rank: number | null;
  reason: 'closest_rank' | 'list_completion' | 'milestone_push';
}

export interface Top100PilgrimageBigWin {
  course_id: string;
  course_name: string;
  country: string | null;
  sub_country: string | null;
  list_slug: string;
  list_name: string;
  played_at: string;
  rank: number | null;
}

export interface Top100PilgrimageStats {
  season_year: number;
  season_goal: number;
  season_progress: number;
  season_remaining: number;
  has_hit_goal: boolean;

  streak_months: number;
  longest_streak_months: number;

  total_new_this_year: number;
  last_new_course?: Top100PilgrimageBigWin | null;

  big_wins: Top100PilgrimageBigWin[];
  next_stops: Top100PilgrimageNextStop[];
}

export function useTop100Pilgrimage(userId?: string | null) {
  return useQuery<Top100PilgrimageStats | null>({
    queryKey: ['top100-pilgrimage', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;

      const now = new Date();
      const seasonYear = now.getFullYear();
      const seasonStart = startOfYear(now).toISOString();

      // 1) Fetch all Top 100 activity for this user
      const { data: activity, error } = await supabase
        .from('user_course_activity')
        .select('course_id, first_played_at, last_played_at, is_top100')
        .eq('user_id', userId)
        .eq('is_top100', true)
        .order('first_played_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      const records = (activity || []).filter(a => a.first_played_at);

      // Track first-time plays
      const seenAllTime = new Set<string>();
      const seenThisSeason = new Set<string>();
      const firstSeenMap = new Map<string, Date>();

      for (const a of records) {
        const playedAt = new Date(a.first_played_at!);
        
        if (!seenAllTime.has(a.course_id)) {
          seenAllTime.add(a.course_id);
          firstSeenMap.set(a.course_id, playedAt);

          if (playedAt >= new Date(seasonStart)) {
            seenThisSeason.add(a.course_id);
          }
        }
      }

      const totalNewThisYear = seenThisSeason.size;

      // 2) Season goal
      const seasonGoal = 5;
      const hasHitGoal = totalNewThisYear >= seasonGoal;
      const seasonRemaining = Math.max(0, seasonGoal - totalNewThisYear);

      // 3) Streaks
      const monthSet = new Set<string>();
      firstSeenMap.forEach((date) => {
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        monthSet.add(key);
      });

      let streak = 0;
      let longestStreak = 0;
      let cursor = startOfMonth(now);

      for (let i = 0; i < 24; i++) {
        const key = `${cursor.getFullYear()}-${cursor.getMonth()}`;
        if (monthSet.has(key)) {
          streak += 1;
          longestStreak = Math.max(longestStreak, streak);
        } else {
          if (cursor < startOfMonth(now)) {
            break;
          }
        }
        cursor = subMonths(cursor, 1);
      }

      // 4) Fetch Top 100 lists and memberships
      const { data: lists } = await supabase
        .from('top100_lists')
        .select('id, slug, name')
        .order('name');

      const { data: memberships } = await supabase
        .from('course_top100_memberships')
        .select(`
          course_id,
          list_id,
          rank,
          golf_courses:course_id (
            id,
            name,
            country,
            sub_country
          )
        `);

      // Build maps and calculate totals
      const listMap = new Map<string, any>();
      const listTotalCounts = new Map<string, number>();
      
      (lists || []).forEach(list => {
        listMap.set(list.id, list);
        listTotalCounts.set(list.id, 0);
      });
      
      (memberships || []).forEach((m: any) => {
        const currentCount = listTotalCounts.get(m.list_id) || 0;
        listTotalCounts.set(m.list_id, currentCount + 1);
      });

      const courseMap = new Map<string, any>();
      (memberships || []).forEach((m: any) => {
        if (m.golf_courses) {
          courseMap.set(m.course_id, m.golf_courses);
        }
      });

      // 5) Big Wins - recent first-time Top 100s this season
      const bigWinList: Top100PilgrimageBigWin[] = [];
      const sortedFirstPlays = Array.from(firstSeenMap.entries())
        .filter(([_, date]) => date >= new Date(seasonStart))
        .sort((a, b) => b[1].getTime() - a[1].getTime())
        .slice(0, 6);

      for (const [courseId, playedAt] of sortedFirstPlays) {
        const course = courseMap.get(courseId);
        const membership = (memberships || []).find((m: any) => m.course_id === courseId);
        const list = membership ? listMap.get(membership.list_id) : null;

        if (course) {
          bigWinList.push({
            course_id: courseId,
            course_name: course.name,
            country: course.country,
            sub_country: course.sub_country,
            list_slug: list?.slug || 'global-top-100',
            list_name: list?.name || 'Global Top 100',
            played_at: playedAt.toISOString(),
            rank: membership?.rank || null,
          });
        }
      }

      // 6) Next Stops - unplayed high-value courses
      const playedCourseIds = seenAllTime;
      const nextStops: Top100PilgrimageNextStop[] = [];

      // For each list, find lowest-ranked unplayed course
      for (const list of (lists || [])) {
        const listMemberships = (memberships || [])
          .filter((m: any) => m.list_id === list.id && !playedCourseIds.has(m.course_id))
          .sort((a: any, b: any) => (a.rank || 999) - (b.rank || 999));

        if (listMemberships.length > 0) {
          const top = listMemberships[0] as any;
          const course = courseMap.get(top.course_id);
          
          if (course) {
            // Determine reason
            const playedInList = (memberships || [])
              .filter((m: any) => m.list_id === list.id && playedCourseIds.has(m.course_id))
              .length;
            
            const totalInList = listTotalCounts.get(list.id) || 100;
            const reason = playedInList > (totalInList * 0.7)
              ? 'list_completion'
              : (top.rank || 999) <= 10
              ? 'closest_rank'
              : 'milestone_push';

            nextStops.push({
              course_id: top.course_id,
              course_name: course.name,
              country: course.country,
              sub_country: course.sub_country,
              list_slug: list.slug,
              list_name: list.name,
              rank: top.rank,
              reason,
            });
          }
        }
      }

      return {
        season_year: seasonYear,
        season_goal: seasonGoal,
        season_progress: totalNewThisYear,
        season_remaining: seasonRemaining,
        has_hit_goal: hasHitGoal,
        streak_months: streak,
        longest_streak_months: longestStreak,
        total_new_this_year: totalNewThisYear,
        last_new_course: bigWinList.length > 0 ? bigWinList[0] : null,
        big_wins: bigWinList,
        next_stops: nextStops.slice(0, 6),
      };
    },
    staleTime: 60_000,
  });
}
