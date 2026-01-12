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
 * Fetches the hero video for Watch tab
 * Algorithm: Most liked video with priority:
 * 1. Most liked TODAY
 * 2. Most liked THIS WEEK
 * 3. Most liked THIS MONTH
 * Any video ever posted is eligible.
 */
export function useTrendingHero() {
  return useQuery({
    queryKey: ['trending-hero'],
    queryFn: async (): Promise<TrendingHero | null> => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 7);
      const monthStart = new Date(todayStart);
      monthStart.setMonth(monthStart.getMonth() - 1);

      // Helper to fetch and find most liked video in a date range
      const fetchMostLiked = async (since: Date, label: string) => {
        console.log(`[useTrendingHero] Fetching ${label} since:`, since.toISOString());
        
        const { data, error } = await supabase
          .from('posts')
          .select(`
            id,
            user_id,
            content,
            course_id,
            created_at,
            golf_courses:course_id (
              id, name, country, region, sub_country
            ),
            user_profiles:user_id (
              id, username, display_name, profile_photo_url
            ),
            post_media!inner (
              media_url, media_type, poster_url, width, height, duration_seconds, aspect_ratio
            ),
            post_likes (count)
          `)
          .gte('created_at', since.toISOString())
          .eq('visibility', 'anyone')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) {
          console.log(`[useTrendingHero] ${label} error:`, error.message);
          return null;
        }

        // Filter for video posts
        const videos = data?.filter(post =>
          (post as any).post_media?.some((m: any) => m.media_type === 'video')
        );

        console.log(`[useTrendingHero] ${label} result:`, { 
          rawCount: data?.length, 
          videoCount: videos?.length 
        });

        if (!videos?.length) return null;

        // Sort by likes (descending) and return top
        const sorted = videos.sort((a, b) => {
          const aLikes = (a as any).post_likes?.[0]?.count || 0;
          const bLikes = (b as any).post_likes?.[0]?.count || 0;
          return bLikes - aLikes;
        });

        return sorted[0];
      };

      // Priority 1: Most liked TODAY
      const todayPost = await fetchMostLiked(todayStart, 'TODAY');
      if (todayPost) {
        console.log('[useTrendingHero] ✓ Using TODAY hero:', todayPost.id?.slice(0, 8));
        return { post: transformPostData(todayPost), trendingPeriod: 'today' };
      }

      // Priority 2: Most liked THIS WEEK
      const weekPost = await fetchMostLiked(weekStart, 'WEEK');
      if (weekPost) {
        console.log('[useTrendingHero] ✓ Using WEEK hero:', weekPost.id?.slice(0, 8));
        return { post: transformPostData(weekPost), trendingPeriod: 'this_week' };
      }

      // Priority 3: Most liked THIS MONTH
      const monthPost = await fetchMostLiked(monthStart, 'MONTH');
      if (monthPost) {
        console.log('[useTrendingHero] ✓ Using MONTH hero:', monthPost.id?.slice(0, 8));
        return { post: transformPostData(monthPost), trendingPeriod: 'this_week' }; // Show as "this week" label
      }

      console.log('[useTrendingHero] ✗ No hero found');
      return null;
    },
    staleTime: 5 * 60 * 1000,
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
