import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getTimeWindowISO, type Timeframe } from '@/lib/timeWindow';

export type Top100Membership = {
  list_id: string;
  list_slug: string;
  short_label: string;
  rank: number;
};

export type FriendCourseHit = {
  friend_id: string;
  friend_profile: {
    id: string;
    username: string;
    display_name: string | null;
    profile_photo_url: string | null;
  };
  course_id: string;
  course_name: string;
  course_country: string | null;
  course_sub_country: string | null;
  played_at: string;
  rating?: number | null;
  thumbnail_url?: string | null;
  community_rating?: number | null;
  top100_memberships: Top100Membership[];
};

export type CourseWithFriends = {
  course_id: string;
  course_name: string;
  country: string | null;
  sub_country: string | null;
  thumbnail_url?: string | null;
  community_rating?: number | null;
  top100_memberships: Top100Membership[];
  friends: FriendCourseHit[];
  most_recent_play: string;
  total_friends_played: number;
};

export type FriendsCoursesResult = {
  courses: CourseWithFriends[];
  recent: FriendCourseHit[];
  totalCourses: number;
  totalFriendsActive: number;
  hasFriends: boolean;
};

export function useFriendsCourses(userId?: string, timeframe: Timeframe = '90d') {
  return useQuery<FriendsCoursesResult>({
    queryKey: ['friends-courses', userId, timeframe],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) {
        return {
          courses: [],
          recent: [],
          totalCourses: 0,
          totalFriendsActive: 0,
          hasFriends: false,
        };
      }

      // Get accepted friends from user_friends (bidirectional relationship)
      // Friends can appear in either user_id or friend_id column
      const { data: friendships, error: relError } = await supabase
        .from('user_friends')
        .select('user_id, friend_id')
        .eq('status', 'accepted')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

      if (relError) throw relError;

      // Extract the "other" user's ID from each friendship
      const friendIds = (friendships || [])
        .map((row: any) => (row.user_id === userId ? row.friend_id : row.user_id))
        .filter(Boolean);

      if (friendIds.length === 0) {
        return {
          courses: [],
          recent: [],
          totalCourses: 0,
          totalFriendsActive: 0,
          hasFriends: false,
        };
      }

      // Get time window based on selected timeframe (single source of truth)
      const { startISO, endISO } = getTimeWindowISO(timeframe);

      // Build query for friends' course ratings (not user_courses)
      let query = supabase
        .from('course_ratings')
        .select(
          `
          id,
          user_id,
          course_id,
          created_at,
          rating,
          review,
          golf_courses!inner (
            id,
            name,
            country,
            sub_country,
            thumbnail_image,
            course_top100_memberships (
              list_id,
              rank,
              top100_lists!inner (
                id,
                slug,
                short_label
              )
            )
          )
        `
        )
        .in('user_id', friendIds)
        .lte('created_at', endISO)
        .order('created_at', { ascending: false })
        .limit(1000); // Safety cap for "all time" queries

      // Apply start filter if not "all time"
      if (startISO) {
        query = query.gte('created_at', startISO);
      }

      const { data: friendCourses, error: coursesError } = await query;

      if (coursesError) throw coursesError;

      if (!friendCourses || friendCourses.length === 0) {
        return {
          courses: [],
          recent: [],
          totalCourses: 0,
          totalFriendsActive: friendIds.length,
          hasFriends: true,
        };
      }

      // Get community ratings for all courses
      const courseIds = [...new Set(friendCourses.map((row: any) => row.golf_courses?.id).filter(Boolean))];
      const { data: communityRatings } = await supabase
        .from('course_rating_aggregates' as any)
        .select('course_id, avg_overall_score')
        .in('course_id', courseIds);

      const ratingByCourseId = new Map(
        (communityRatings || []).map((r: any) => [r.course_id, r.avg_overall_score])
      );

      // Get friend profiles for all users who have logged courses
      const userIds = [...new Set(friendCourses.map((row: any) => row.user_id))];
      const { data: profiles } = await supabase
        .from('user_profiles' as any)
        .select('id, username, display_name, profile_photo_url')
        .in('id', userIds);

      const profileMap = new Map(
        (profiles || []).map((p: any) => [p.id, p])
      );

      // Map to FriendCourseHit[]
      const recent: FriendCourseHit[] = friendCourses
        .map((row: any) => {
          const profile = profileMap.get(row.user_id);
          if (!profile) return null;

          // Map Top 100 memberships
          const memberships: Top100Membership[] = (row.golf_courses?.course_top100_memberships || []).map((m: any) => ({
            list_id: m.list_id,
            list_slug: m.top100_lists?.slug || '',
            short_label: m.top100_lists?.short_label || '',
            rank: m.rank,
          }));

          const communityRating = ratingByCourseId.get(row.golf_courses?.id) ?? null;
          
          return {
            friend_id: row.user_id,
            friend_profile: {
              id: profile.id,
              username: profile.username,
              display_name: profile.display_name,
              profile_photo_url: profile.profile_photo_url,
            },
            course_id: row.golf_courses?.id,
            course_name: row.golf_courses?.name,
            course_country: row.golf_courses?.country ?? null,
            course_sub_country: row.golf_courses?.sub_country ?? null,
            thumbnail_url: row.golf_courses?.thumbnail_image ?? null,
            community_rating: communityRating,
            played_at: row.created_at,
            rating: row.rating ?? null,
            top100_memberships: memberships,
          };
        })
        .filter(Boolean) as FriendCourseHit[];

      // Group by course
      const courseMap = new Map<string, CourseWithFriends>();

      for (const hit of recent) {
        if (!hit.course_id) continue;
        const key = hit.course_id;

        const existing = courseMap.get(key);
        if (!existing) {
          courseMap.set(key, {
            course_id: hit.course_id,
            course_name: hit.course_name,
            country: hit.course_country,
            sub_country: hit.course_sub_country,
            thumbnail_url: hit.thumbnail_url,
            community_rating: hit.community_rating ?? null,
            top100_memberships: hit.top100_memberships,
            friends: [hit],
            most_recent_play: hit.played_at,
            total_friends_played: 1,
          });
        } else {
          existing.friends.push(hit);
          existing.total_friends_played = existing.friends.length;
          if (new Date(hit.played_at) > new Date(existing.most_recent_play)) {
            existing.most_recent_play = hit.played_at;
          }
        }
      }

      // Convert to sorted array
      const courses = Array.from(courseMap.values()).sort((a, b) => {
        if (b.total_friends_played !== a.total_friends_played) {
          return b.total_friends_played - a.total_friends_played;
        }
        return (
          new Date(b.most_recent_play).getTime() -
          new Date(a.most_recent_play).getTime()
        );
      });

      // Count unique friends who have actually played
      const activeFriendIds = new Set<string>();
      recent.forEach((hit) => activeFriendIds.add(hit.friend_id));

      return {
        courses,
        recent,
        totalCourses: courses.length,
        totalFriendsActive: activeFriendIds.size,
        hasFriends: true,
      };
    },
    staleTime: 5 * 60 * 1000,  // 5 min – shorter since timeframe affects data
    gcTime:   30 * 60 * 1000,  // 30 min – keep for session
    refetchOnWindowFocus: false,
  });
}
