import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getTop100PrestigeRing, getTop100MilestoneLabel, Top100PrestigeRing } from '@/lib/top100Prestige';
import { useTop100Debug } from '@/context/Top100DebugContext';
import { applyMyJourneyDebug } from '@/lib/top100DebugHelpers';

export type Top100ListProgress = {
  listId: string;
  listSlug: string;
  listName: string;
  played: number;
  total: number;
  course_ids: string[];
};

export type Top100RecentRound = {
  course_id: string;
  course_name: string;
  country: string | null;
  sub_country: string | null;
  list_slugs: string[];
  played_at: string;
  rating: number | null;
};

export type Top100NextMilestone = {
  label: string;
  remaining: number;
};

export type Top100ProgressResponse = {
  total_played_top100: number;
  total_top100_rated?: number; // NEW: canonical field from RPC
  regions_count: number;
  lists: Top100ListProgress[];
  recent_rounds: Top100RecentRound[];
  next_milestone: Top100NextMilestone | null;
  prestige_ring?: Top100PrestigeRing;
  prestige_label?: string | null;
};

function getMilestoneLabel(count: number): Top100NextMilestone | null {
  if (count < 20) {
    return {
      label: '20 Club',
      remaining: 20 - count,
    };
  } else if (count < 50) {
    return {
      label: '50 Club',
      remaining: 50 - count,
    };
  } else if (count < 100) {
    return {
      label: '100 Century Club',
      remaining: 100 - count,
    };
  }
  return null;
}

export function useTop100ProgressForUser(userId: string | undefined | null) {
  const { state: debugState } = useTop100Debug();
  
  const query = useQuery({
    queryKey: ['top100-progress-user', userId],
    enabled: !!userId,
    queryFn: async (): Promise<Top100ProgressResponse> => {
      if (!userId) {
        return {
          total_played_top100: 0,
          regions_count: 0,
          lists: [],
          recent_rounds: [],
          next_milestone: null,
        };
      }

      // Fetch all Top 100 lists
      const { data: lists, error: listsError } = await supabase
        .from('top100_lists')
        .select('id, slug, name')
        .eq('is_active', true)
        .order('sort_order');

      if (listsError) throw listsError;

      // Fetch user's course activity
      const { data: userActivity, error: activityError } = await supabase
        .from('user_course_activity')
        .select('course_id')
        .eq('user_id', userId);

      if (activityError) throw activityError;

      const playedCourseIds = new Set((userActivity || []).map((a: any) => a.course_id));

      // Fetch all Top 100 memberships for played courses
      const { data: memberships, error: membershipsError } = await supabase
        .from('course_top100_memberships')
        .select(`
          course_id,
          list_id,
          rank,
          top100_lists!inner (
            id,
            slug,
            name
          ),
          golf_courses!inner (
            id,
            name,
            country,
            sub_country
          )
        `)
        .in('course_id', Array.from(playedCourseIds));

      if (membershipsError) throw membershipsError;

      // Build list progress
      const listProgress: Top100ListProgress[] = [];
      const playedTop100Courses = new Set<string>();
      const regionsWithProgress = new Set<string>();

      for (const list of lists || []) {
        // Get total courses in this list
        const { count, error: countError } = await supabase
          .from('course_top100_memberships')
          .select('*', { count: 'exact', head: true })
          .eq('list_id', list.id);

        if (countError) throw countError;

        // Get played courses in this list
        const playedInList = (memberships || [])
          .filter((m: any) => m.top100_lists.id === list.id)
          .map((m: any) => m.course_id);

        const uniquePlayedInList = [...new Set(playedInList)];

        if (uniquePlayedInList.length > 0) {
          regionsWithProgress.add(list.slug);
          uniquePlayedInList.forEach(id => playedTop100Courses.add(id));
        }

        listProgress.push({
          listId: list.id,
          listSlug: list.slug,
          listName: list.name,
          played: uniquePlayedInList.length,
          total: count || 0,
          course_ids: uniquePlayedInList,
        });
      }

      // Fetch recent rounds with course details
      const { data: recentActivity, error: recentError } = await supabase
        .from('user_course_activity')
        .select(`
          course_id,
          last_played_at,
          rating_value,
          golf_courses!inner (
            id,
            name,
            country,
            sub_country
          )
        `)
        .eq('user_id', userId)
        .eq('is_top100', true)
        .order('last_played_at', { ascending: false, nullsFirst: false })
        .limit(10);

      if (recentError) throw recentError;

      // Build recent rounds with all list memberships
      const recentRounds: Top100RecentRound[] = [];
      for (const activity of recentActivity || []) {
        const courseListSlugs = (memberships || [])
          .filter((m: any) => m.course_id === activity.course_id)
          .map((m: any) => m.top100_lists.slug);

        recentRounds.push({
          course_id: activity.course_id,
          course_name: (activity as any).golf_courses.name,
          country: (activity as any).golf_courses.country,
          sub_country: (activity as any).golf_courses.sub_country,
          list_slugs: courseListSlugs,
          played_at: activity.last_played_at || new Date().toISOString(),
          rating: activity.rating_value,
        });
      }

      const totalPlayed = playedTop100Courses.size;
      const nextMilestone = getMilestoneLabel(totalPlayed);

      return {
        total_played_top100: totalPlayed,
        regions_count: regionsWithProgress.size,
        lists: listProgress,
        recent_rounds: recentRounds,
        next_milestone: nextMilestone,
        prestige_ring: getTop100PrestigeRing(totalPlayed),
        prestige_label: getTop100MilestoneLabel(totalPlayed),
      };
    },
    // C1: Increased staleTime to 5 minutes for My Progress tab
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  });
  
  // Apply debug override if enabled
  if (debugState.enabled && debugState.myPreset !== 'real') {
    return {
      ...query,
      data: applyMyJourneyDebug(query.data, debugState.myPreset),
    };
  }
  
  return query;
}
