import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OptimizedProfileData {
  profile: any;
  coursesPlayed: number;
  coursesRated: number;
  averageRating: number | null;
  followersCount: number;
  followingCount: number;
  recentPosts: any[];
  recentAchievements: any[];
  topRankedCourses: any[];
}

// Single optimized query that fetches all profile data at once
export const useOptimizedProfileData = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['optimized-profile', userId],
    queryFn: async (): Promise<OptimizedProfileData> => {
      if (!userId) throw new Error('User ID required');

      // Execute all queries in parallel for maximum speed
      const [
        profileResult,
        coursesPlayedResult,
        ratingsResult,
        followersResult,
        followingResult,
        postsResult,
        achievementsResult
      ] = await Promise.all([
        // Profile data - full select needed for comprehensive profile page
        supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single(),
        
        // Courses rated count (ratings-only: the single source of truth)
        supabase
          .from('course_ratings')
          .select('course_id', { count: 'exact' })
          .eq('user_id', userId),
        
        // Course ratings with average
        supabase
          .from('course_ratings')
          .select('rating, course_id, golf_courses(country, continent, global_rank, regional_rank, usa_rank)')
          .eq('user_id', userId),
        
        // Followers count
        supabase
          .from('user_follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', userId),
        
        // Following count
        supabase
          .from('user_follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', userId),
        
        // Recent posts (limit to improve speed)
        supabase
          .from('posts')
          .select(`
            id, content, created_at, user_id, badges,
            post_media(id, media_type, media_url)
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10),
        
        // Recent achievements (limit to improve speed)
        supabase
          .rpc('get_user_recent_achievements', {
            user_id_param: userId,
            limit_param: 5
          })
      ]);

      // Calculate average rating
      const ratings = ratingsResult.data || [];
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length 
        : null;

      // Get top ranked courses from ratings
      const topRankedCourses = ratings
        .filter(r => r.golf_courses?.global_rank || r.golf_courses?.regional_rank)
        .sort((a, b) => {
          const aRank = a.golf_courses?.global_rank || a.golf_courses?.regional_rank || 999;
          const bRank = b.golf_courses?.global_rank || b.golf_courses?.regional_rank || 999;
          return aRank - bRank;
        })
        .slice(0, 5);

      return {
        profile: profileResult.data,
        coursesPlayed: ratings.length, // ratings-only: coursesPlayed = coursesRated
        coursesRated: ratings.length,
        averageRating: averageRating ? Number(averageRating.toFixed(1)) : null,
        followersCount: followersResult.count || 0,
        followingCount: followingResult.count || 0,
        recentPosts: postsResult.data || [],
        recentAchievements: achievementsResult.data || [],
        topRankedCourses
      };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });
};