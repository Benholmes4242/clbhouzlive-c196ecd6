import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type LeaderboardScope = 'worldwide' | 'global-top-100' | 'gb-i-top-100' | 'usa-top-100' | 'europe-top-100';
export type LeaderboardTimeRange = 'all_time' | 'this_year' | 'this_month';

export type UseTop100LeaderboardArgs = {
  scope: LeaderboardScope;
  timeRange: LeaderboardTimeRange;
  page?: number;
  pageSize?: number;
};

export type Top100LeaderboardEntry = {
  user_id: string;
  rank: number;
  display_name: string;
  avatar_url: string | null;
  home_club: string | null;
  country: string | null;
  total_top100_played: number;
  lists_completed: string[];
  milestone_label: string | null;
};

export type Top100LeaderboardResponse = {
  entries: Top100LeaderboardEntry[];
  total_count: number;
  page: number;
  page_size: number;
  current_user_entry: Top100LeaderboardEntry | null;
};

function getMilestoneLabel(count: number): string | null {
  if (count >= 100) return '100 Century Club';
  if (count >= 50) return '50 Club';
  if (count >= 20) return '20 Club';
  return null;
}

export function useTop100Leaderboard(args: UseTop100LeaderboardArgs) {
  const { scope, timeRange, page = 0, pageSize = 20 } = args;

  return useQuery({
    queryKey: ['top100-leaderboard', scope, timeRange, page, pageSize],
    queryFn: async (): Promise<Top100LeaderboardResponse> => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      // Calculate time filter
      const now = new Date();
      let timeFilter: string | null = null;
      
      if (timeRange === 'this_year') {
        const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();
        timeFilter = startOfYear;
      } else if (timeRange === 'this_month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        timeFilter = startOfMonth;
      }

      // Fetch all Top 100 lists
      const { data: lists, error: listsError } = await supabase
        .from('top100_lists')
        .select('id, slug, name')
        .eq('is_active', true);

      if (listsError) throw listsError;

      // Build list filter
      let targetListIds: string[] = [];
      if (scope === 'worldwide') {
        targetListIds = (lists || []).map(l => l.id);
      } else {
        const targetList = (lists || []).find(l => l.slug === scope);
        if (targetList) targetListIds = [targetList.id];
      }

      if (targetListIds.length === 0) {
        return {
          entries: [],
          total_count: 0,
          page,
          page_size: pageSize,
          current_user_entry: null,
        };
      }

      // Fetch user activity for Top 100 courses with time filter
      let activityQuery = supabase
        .from('user_course_activity')
        .select('user_id, course_id, last_played_at')
        .eq('is_top100', true);

      if (timeFilter) {
        activityQuery = activityQuery.gte('last_played_at', timeFilter);
      }

      const { data: activities, error: activitiesError } = await activityQuery;
      if (activitiesError) throw activitiesError;

      // Fetch memberships to filter by scope
      const { data: memberships, error: membershipsError } = await supabase
        .from('course_top100_memberships')
        .select('course_id, list_id')
        .in('list_id', targetListIds);

      if (membershipsError) throw membershipsError;

      const validCourseIds = new Set(
        (memberships || []).map(m => m.course_id)
      );

      // Filter activities to only valid courses in scope
      const filteredActivities = (activities || []).filter(a => 
        validCourseIds.has(a.course_id)
      );

      // Group by user and count distinct courses
      const userCounts = new Map<string, Set<string>>();
      filteredActivities.forEach(activity => {
        if (!userCounts.has(activity.user_id)) {
          userCounts.set(activity.user_id, new Set());
        }
        userCounts.get(activity.user_id)!.add(activity.course_id);
      });

      // Get user IDs
      const userIds = Array.from(userCounts.keys());
      if (userIds.length === 0) {
        return {
          entries: [],
          total_count: 0,
          page,
          page_size: pageSize,
          current_user_entry: null,
        };
      }

      // Fetch user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, display_name, profile_photo_url, home_club')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Calculate worldwide all-time counts for milestone labels
      const { data: allTimeActivities, error: allTimeError } = await supabase
        .from('user_course_activity')
        .select('user_id, course_id')
        .eq('is_top100', true)
        .in('user_id', userIds);

      if (allTimeError) throw allTimeError;

      const worldwideCounts = new Map<string, number>();
      const worldwideCourses = new Map<string, Set<string>>();
      
      (allTimeActivities || []).forEach(activity => {
        if (!worldwideCourses.has(activity.user_id)) {
          worldwideCourses.set(activity.user_id, new Set());
        }
        worldwideCourses.get(activity.user_id)!.add(activity.course_id);
      });

      worldwideCourses.forEach((courses, userId) => {
        worldwideCounts.set(userId, courses.size);
      });

      // Calculate lists_completed (users who have 100+ in specific lists all-time)
      const listsCompleted = new Map<string, string[]>();
      
      for (const list of lists || []) {
        const { data: listMemberships } = await supabase
          .from('course_top100_memberships')
          .select('course_id')
          .eq('list_id', list.id);

        const listCourseIds = new Set((listMemberships || []).map(m => m.course_id));

        userIds.forEach(userId => {
          const userCourses = worldwideCourses.get(userId) || new Set();
          const completedInList = Array.from(userCourses).filter(cId => listCourseIds.has(cId));
          
          if (completedInList.length >= 100) {
            if (!listsCompleted.has(userId)) {
              listsCompleted.set(userId, []);
            }
            listsCompleted.get(userId)!.push(list.slug);
          }
        });
      }

      // Build entries
      const allEntries: Top100LeaderboardEntry[] = [];
      
      userCounts.forEach((courses, userId) => {
        const profile = profiles?.find(p => p.id === userId);
        if (!profile) return;

        const worldwideCount = worldwideCounts.get(userId) || courses.size;

        allEntries.push({
          user_id: userId,
          rank: 0, // Will be set after sorting
          display_name: profile.display_name || 'Anonymous',
          avatar_url: profile.profile_photo_url || null,
          home_club: profile.home_club || null,
          country: null, // Country not available in user_profiles
          total_top100_played: courses.size,
          lists_completed: listsCompleted.get(userId) || [],
          milestone_label: getMilestoneLabel(worldwideCount),
        });
      });

      // Sort and rank
      allEntries.sort((a, b) => {
        if (b.total_top100_played !== a.total_top100_played) {
          return b.total_top100_played - a.total_top100_played;
        }
        return a.display_name.localeCompare(b.display_name);
      });

      allEntries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      // Find current user entry
      let currentUserEntry: Top100LeaderboardEntry | null = null;
      if (currentUserId) {
        currentUserEntry = allEntries.find(e => e.user_id === currentUserId) || null;
      }

      // Paginate
      const start = page * pageSize;
      const end = start + pageSize;
      const paginatedEntries = allEntries.slice(start, end);

      return {
        entries: paginatedEntries,
        total_count: allEntries.length,
        page,
        page_size: pageSize,
        current_user_entry: currentUserEntry,
      };
    },
    staleTime: 60 * 1000,
  });
}
