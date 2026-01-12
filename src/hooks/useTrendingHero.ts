import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TrendingHeroPost {
  id: string;
  user_id: string;
  caption: string;
  course_id?: string;
  course?: {
    id: string;
    name: string;
    location: string;
    country?: string;
    region?: string;
    sub_country?: string;
  };
  user: {
    id: string;
    username: string;
    display_name: string;
    profile_photo_url?: string;
  };
  media: {
    media_url: string;
    media_type: string;
    thumbnail_url?: string;
    poster_url?: string;
    width?: number;
    height?: number;
    duration_seconds?: number;
    aspect_ratio?: number;
  }[];
  likes_count: number;
  views_count: number;
}

export interface TrendingHero {
  post: TrendingHeroPost;
  trendingPeriod: 'today' | 'this_week';
}

/**
 * Fetches the most-watched video for the Watch tab hero
 * Priority 1: Most viewed video TODAY
 * Fallback: Most viewed video THIS WEEK
 * Final fallback: Most liked recent video
 */
export function useTrendingHero() {
  return useQuery({
    queryKey: ['trending-hero'],
    queryFn: async (): Promise<TrendingHero | null> => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 7);

      // Try to get most viewed video from TODAY first
      // We need to fetch posts and then sort by views since Supabase doesn't support
      // ordering by aggregated count in the same query
      // Query posts with video media from TODAY
      console.log('[useTrendingHero] Fetching today videos since:', todayStart.toISOString());
      const { data: todayData, error: todayError } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          content,
          course_id,
          created_at,
          golf_courses:course_id (
            id,
            name,
            country,
            region,
            sub_country
          ),
          user_profiles:user_id (
            id,
            username,
            display_name,
            profile_photo_url
          ),
          post_media!inner (
            media_url,
            media_type,
            poster_url,
            width,
            height,
            duration_seconds,
            aspect_ratio
          ),
          post_views (count),
          post_likes (count)
        `)
        .gte('created_at', todayStart.toISOString())
        .eq('visibility', 'anyone')
        .eq('post_media.media_type', 'video')
        .order('created_at', { ascending: false })
        .limit(20);
      
      console.log('[useTrendingHero] Today query result:', { 
        count: todayData?.length, 
        error: todayError?.message,
        firstPostId: todayData?.[0]?.id?.slice(0, 8)
      });

      if (!todayError && todayData && todayData.length > 0) {
        // Sort by views and pick the top one
        const sorted = todayData.sort((a, b) => {
          const aViews = (a as any).post_views?.[0]?.count || 0;
          const bViews = (b as any).post_views?.[0]?.count || 0;
          return bViews - aViews;
        });
        
        const topPost = sorted[0];
        if (topPost) {
          return {
            post: transformPostData(topPost),
            trendingPeriod: 'today',
          };
        }
      }

      // Fallback: Most viewed video THIS WEEK
      console.log('[useTrendingHero] Fetching week videos since:', weekStart.toISOString());
      const { data: weekData, error: weekError } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          content,
          course_id,
          created_at,
          golf_courses:course_id (
            id,
            name,
            country,
            region,
            sub_country
          ),
          user_profiles:user_id (
            id,
            username,
            display_name,
            profile_photo_url
          ),
          post_media!inner (
            media_url,
            media_type,
            poster_url,
            width,
            height,
            duration_seconds,
            aspect_ratio
          ),
          post_views (count),
          post_likes (count)
        `)
        .gte('created_at', weekStart.toISOString())
        .eq('visibility', 'anyone')
        .eq('post_media.media_type', 'video')
        .order('created_at', { ascending: false })
        .limit(50);
        
      console.log('[useTrendingHero] Week query result:', { 
        count: weekData?.length, 
        error: weekError?.message,
        firstPostId: weekData?.[0]?.id?.slice(0, 8)
      });

      if (!weekError && weekData && weekData.length > 0) {
        // Sort by views and pick the top one
        const sorted = weekData.sort((a, b) => {
          const aViews = (a as any).post_views?.[0]?.count || 0;
          const bViews = (b as any).post_views?.[0]?.count || 0;
          return bViews - aViews;
        });
        
        const topPost = sorted[0];
        if (topPost) {
          return {
            post: transformPostData(topPost),
            trendingPeriod: 'this_week',
          };
        }
      }

      // Final fallback: Most liked video (no time constraint)
      console.log('[useTrendingHero] Fetching fallback (all time)');
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          content,
          course_id,
          created_at,
          golf_courses:course_id (
            id,
            name,
            country,
            region,
            sub_country
          ),
          user_profiles:user_id (
            id,
            username,
            display_name,
            profile_photo_url
          ),
          post_media!inner (
            media_url,
            media_type,
            poster_url,
            width,
            height,
            duration_seconds,
            aspect_ratio
          ),
          post_likes (count)
        `)
        .eq('visibility', 'anyone')
        .eq('post_media.media_type', 'video')
        .order('created_at', { ascending: false })
        .limit(30);
        
      console.log('[useTrendingHero] Fallback query result:', { 
        count: fallbackData?.length, 
        error: fallbackError?.message,
        firstPostId: fallbackData?.[0]?.id?.slice(0, 8)
      });

      if (fallbackData && fallbackData.length > 0) {
        // Sort by likes
        const sorted = fallbackData.sort((a, b) => {
          const aLikes = (a as any).post_likes?.[0]?.count || 0;
          const bLikes = (b as any).post_likes?.[0]?.count || 0;
          return bLikes - aLikes;
        });
        
        const topPost = sorted[0];
        if (topPost) {
          return {
            post: transformPostData(topPost),
            trendingPeriod: 'this_week', // Label as this week even if fallback
          };
        }
      }

      return null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Helper to transform Supabase response to clean object
function transformPostData(data: any): TrendingHeroPost {
  const course = data.golf_courses;
  const user = data.user_profiles;
  const media = data.post_media || [];

  return {
    id: data.id,
    user_id: data.user_id,
    caption: data.content || '',
    course_id: data.course_id,
    course: course ? {
      id: course.id,
      name: course.name,
      location: course.sub_country || course.region || course.country || '',
      country: course.country,
      region: course.region,
      sub_country: course.sub_country,
    } : undefined,
    user: {
      id: user?.id || data.user_id,
      username: user?.username || 'unknown',
      display_name: user?.display_name || 'Unknown',
      profile_photo_url: user?.profile_photo_url,
    },
    media: media.map((m: any) => ({
      media_url: m.media_url,
      media_type: m.media_type,
      thumbnail_url: m.poster_url, // poster_url is the actual column name
      poster_url: m.poster_url,
      width: m.width,
      height: m.height,
      duration_seconds: m.duration_seconds,
      aspect_ratio: m.aspect_ratio,
    })),
    likes_count: data.post_likes?.[0]?.count || 0,
    views_count: data.post_views?.[0]?.count || 0,
  };
}

export default useTrendingHero;
