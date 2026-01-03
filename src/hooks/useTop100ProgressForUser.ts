import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTop100Debug } from '@/context/Top100DebugContext';
import { applyMyJourneyDebug } from '@/lib/top100DebugHelpers';
import { getTop100Club, getNextTop100Club } from '@/lib/top100Club';
import type { Top100TierId } from '@/lib/top100Club';

/**
 * ============================================================================
 * DATE FIELD USAGE (Canonical Reference)
 * ============================================================================
 * 
 * played_at = COALESCE(review_date, created_at)
 *   Used for ALL user-facing features:
 *   - Year Summary tiles (courses/regions/new/avg rating)
 *   - Year Progress chart (monthly buckets)
 *   - 3-month logging streak
 *   - Recent Top 100 Rounds ordering
 * 
 * edited_at = updated_at
 *   Used for: NOTHING user-facing (admin/debug only)
 *   Editing a rating should NEVER affect progress, recents, or stats.
 * 
 * ============================================================================
 */

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
  played_at: string;      // Canonical: COALESCE(review_date, created_at) - used for all ordering/filtering
  first_activity_at?: string; // created_at - for stable tie-breaking
  rating: number | null;
  image_url?: string | null;
  global_rank: number | null;
  regional_rank: number | null;
  usa_rank: number | null;
};

export type Top100NextMilestone = {
  threshold: number;
  tierName: string;
  shortLabel: string;
  remaining: number;
  tierId: string;
};

export type Top100ProgressResponse = {
  total_played_top100: number;
  total_top100_rated?: number;
  totalTop100Played: number;
  regions_count: number;
  lists: Top100ListProgress[];
  recent_rounds: Top100RecentRound[];        // Ordered by played_at DESC, first_activity_at DESC, course_id ASC - limit 25
  year_rounds: Top100RecentRound[];          // All rounds for current calendar year (uses played_at)
  all_rounds_for_streak: Top100RecentRound[]; // Last 18 months for streak (uses played_at)
  next_milestone: Top100NextMilestone | null;
  club_label?: string | null;
  club_tier_name?: string | null;
  club_ring?: Top100TierId;
};

export function useTop100ProgressForUser(userId: string | undefined | null) {
  const { state: debugState } = useTop100Debug();
  
  const query = useQuery({
    queryKey: ['top100-progress-user', userId],
    enabled: !!userId,
    queryFn: async (): Promise<Top100ProgressResponse> => {
      if (!userId) {
        return {
          total_played_top100: 0,
          totalTop100Played: 0,
          regions_count: 0,
          lists: [],
          recent_rounds: [],
          year_rounds: [],
          all_rounds_for_streak: [],
          next_milestone: null,
          club_label: null,
          club_tier_name: null,
          club_ring: 'none',
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
        .from('user_course_activity' as any)
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

      // === FETCH RECENT ROUNDS ===
      // Order: played_at DESC, first_activity_at DESC, course_id ASC (stable tie-breaker)
      // Limit 25 after filtering to Top 100 courses
      const { data: recentActivity, error: recentError } = await supabase
        .from('user_course_activity' as any)
        .select('course_id, played_at, first_activity_at, rating_value')
        .eq('user_id', userId)
        .order('played_at', { ascending: false, nullsFirst: false })
        .order('first_activity_at', { ascending: false, nullsFirst: false })
        .order('course_id', { ascending: true })
        .limit(100); // Get more to filter to Top 100 only

      if (recentError) throw recentError;

      // Filter to only Top 100 courses, limit 25
      const recentTop100Activity = (recentActivity || [])
        .filter((a: any) => playedTop100Courses.has(a.course_id))
        .slice(0, 25);

      // === FETCH YEAR-SCOPED DATA (for timeline/year summary) ===
      const currentYear = new Date().getFullYear();
      const yearStart = `${currentYear}-01-01T00:00:00.000Z`;
      const yearEnd = `${currentYear + 1}-01-01T00:00:00.000Z`;

      const { data: yearActivity, error: yearError } = await supabase
        .from('user_course_activity' as any)
        .select('course_id, played_at, first_activity_at, rating_value')
        .eq('user_id', userId)
        .gte('played_at', yearStart)
        .lt('played_at', yearEnd)
        .order('played_at', { ascending: false, nullsFirst: false })
        .order('first_activity_at', { ascending: false, nullsFirst: false })
        .order('course_id', { ascending: true });

      if (yearError) throw yearError;

      // Filter to Top 100 only for year rounds
      const yearTop100Activity = (yearActivity || [])
        .filter((a: any) => playedTop100Courses.has(a.course_id));

      // === FETCH STREAK DATA (last 18 months) ===
      const eighteenMonthsAgo = new Date();
      eighteenMonthsAgo.setMonth(eighteenMonthsAgo.getMonth() - 18);
      const streakStart = eighteenMonthsAgo.toISOString();

      const { data: streakActivity, error: streakError } = await supabase
        .from('user_course_activity' as any)
        .select('course_id, played_at, first_activity_at, rating_value')
        .eq('user_id', userId)
        .gte('played_at', streakStart)
        .order('played_at', { ascending: false, nullsFirst: false })
        .order('first_activity_at', { ascending: false, nullsFirst: false })
        .order('course_id', { ascending: true });

      if (streakError) throw streakError;

      // Filter to Top 100 only for streak
      const streakTop100Activity = (streakActivity || [])
        .filter((a: any) => playedTop100Courses.has(a.course_id));

      // === FETCH COURSE DETAILS ===
      // Collect all unique course IDs we need details for
      const allCourseIds = new Set([
        ...recentTop100Activity.map((a: any) => a.course_id),
        ...yearTop100Activity.map((a: any) => a.course_id),
        ...streakTop100Activity.map((a: any) => a.course_id),
      ]);

      const { data: allCourses, error: coursesError } = await supabase
        .from('golf_courses')
        .select('id, name, country, sub_country, thumbnail_image')
        .in('id', Array.from(allCourseIds));

      if (coursesError) throw coursesError;

      const courseMap = new Map((allCourses || []).map(c => [c.id, c]));

      // Helper to build round objects
      const buildRound = (activity: any): Top100RecentRound | null => {
        const course = courseMap.get(activity.course_id);
        if (!course) return null;
        
        const courseMemberships = (memberships || [])
          .filter((m: any) => m.course_id === activity.course_id);
        
        const courseListSlugs = courseMemberships.map((m: any) => m.top100_lists.slug);
        
        const globalMembership = courseMemberships.find((m: any) => m.top100_lists.slug === 'global');
        const gbMembership = courseMemberships.find((m: any) => m.top100_lists.slug === 'gb-i');
        const usaMembership = courseMemberships.find((m: any) => m.top100_lists.slug === 'usa');
        const europeMembership = courseMemberships.find((m: any) => m.top100_lists.slug === 'europe');

        return {
          course_id: activity.course_id,
          course_name: course.name,
          country: course.country,
          sub_country: course.sub_country,
          list_slugs: courseListSlugs,
          played_at: activity.played_at || new Date().toISOString(),
          first_activity_at: activity.first_activity_at,
          rating: activity.rating_value,
          image_url: course.thumbnail_image ?? null,
          global_rank: globalMembership?.rank ?? null,
          regional_rank: gbMembership?.rank ?? europeMembership?.rank ?? null,
          usa_rank: usaMembership?.rank ?? null,
        };
      };

      // Build all round arrays
      const recentRounds = recentTop100Activity
        .map(buildRound)
        .filter((r): r is Top100RecentRound => r !== null);

      const yearRounds = yearTop100Activity
        .map(buildRound)
        .filter((r): r is Top100RecentRound => r !== null);

      const allRoundsForStreak = streakTop100Activity
        .map(buildRound)
        .filter((r): r is Top100RecentRound => r !== null);

      // Normalize to canonical field
      const totalTop100Played = playedTop100Courses.size;
      
      // Use new tier helpers
      const club = getTop100Club(totalTop100Played);
      const nextClub = getNextTop100Club(totalTop100Played);

      return {
        total_played_top100: totalTop100Played,
        total_top100_rated: totalTop100Played,
        totalTop100Played,
        regions_count: regionsWithProgress.size,
        lists: listProgress,
        recent_rounds: recentRounds,
        year_rounds: yearRounds,
        all_rounds_for_streak: allRoundsForStreak,
        next_milestone: nextClub
          ? {
              threshold: nextClub.threshold,
              tierName: nextClub.tierName,
              shortLabel: nextClub.shortLabel,
              remaining: Math.max(0, nextClub.threshold - totalTop100Played),
              tierId: nextClub.tierId,
            }
          : null,
        club_label: club.shortLabel,
        club_tier_name: club.tierName,
        club_ring: club.tierId,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
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
