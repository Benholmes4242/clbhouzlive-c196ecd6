/**
 * useWatchHeroVideo - Fetches the hero video for Watch tab
 * 
 * Algorithm: Most liked video with priority:
 * 1. Most liked TODAY (last 24 hours)
 * 2. Most liked THIS WEEK (last 7 days)
 * 3. Most liked THIS MONTH (last 30 days)
 * 4. Most liked ALL TIME (fallback)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type TrendingPeriod = 'today' | 'this_week' | 'this_month' | 'all_time';

export interface HeroVideo {
  id: string;
  content: string | null;
  created_at: string;
  user_id: string;
  like_count: number;
  media: {
    id: string;
    media_url: string;
    media_type: string;
    poster_url: string | null;
    duration_seconds: number | null;
    aspect_ratio: number | null;
  }[];
  creator: {
    id: string;
    username: string | null;
    display_name: string | null;
    profile_photo_url: string | null;
  } | null;
  course: {
    id: string;
    name: string;
    country: string | null;
  } | null;
}

interface WatchHeroResult {
  heroVideo: HeroVideo | null;
  trendingPeriod: TrendingPeriod;
  isLoading: boolean;
  error: Error | null;
}

async function fetchMostLiked(since: Date | null, label: string): Promise<any | null> {
  console.log(`[useWatchHeroVideo] Fetching ${label}${since ? ` since: ${since.toISOString()}` : ''}`);
  
  let query = supabase
    .from('posts')
    .select(`
      id,
      content,
      created_at,
      user_id,
      course_id,
      like_count,
      post_media!inner (
        id,
        media_url,
        media_type,
        poster_url,
        duration_seconds,
        aspect_ratio
      ),
      user_profiles!posts_user_id_fkey (
        id,
        username,
        display_name,
        profile_photo_url
      ),
      golf_courses!posts_course_id_fkey (
        id,
        name,
        country
      )
    `)
    .eq('visibility', 'anyone')
    .eq('post_media.media_type', 'video')
    .order('like_count', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(50);

  if (since) {
    query = query.gte('created_at', since.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error(`[useWatchHeroVideo] ${label} error:`, error.message);
    return null;
  }

  // Filter for video posts client-side (in case of any edge cases)
  const videos = data?.filter(post =>
    (post as any).post_media?.some((m: any) => m.media_type === 'video')
  );

  console.log(`[useWatchHeroVideo] ${label} result:`, {
    rawCount: data?.length,
    videoCount: videos?.length,
    topVideoId: videos?.[0]?.id?.slice(0, 8),
    topLikes: videos?.[0]?.like_count
  });

  return videos?.[0] || null;
}

function transformPostData(data: any): HeroVideo {
  return {
    id: data.id,
    content: data.content,
    created_at: data.created_at,
    user_id: data.user_id,
    like_count: data.like_count || 0,
    media: (data.post_media || []).map((m: any) => ({
      id: m.id,
      media_url: m.media_url,
      media_type: m.media_type,
      poster_url: m.poster_url,
      duration_seconds: m.duration_seconds,
      aspect_ratio: m.aspect_ratio,
    })),
    creator: data.user_profiles ? {
      id: data.user_profiles.id,
      username: data.user_profiles.username,
      display_name: data.user_profiles.display_name,
      profile_photo_url: data.user_profiles.profile_photo_url,
    } : null,
    course: data.golf_courses ? {
      id: data.golf_courses.id,
      name: data.golf_courses.name,
      country: data.golf_courses.country,
    } : null,
  };
}

export function useWatchHeroVideo(): WatchHeroResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ['watch-hero-video'],
    queryFn: async (): Promise<{ heroVideo: HeroVideo | null; trendingPeriod: TrendingPeriod }> => {
      const now = new Date();
      
      // Calculate time boundaries
      const todayStart = new Date(now);
      todayStart.setHours(todayStart.getHours() - 24);
      
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);
      
      const monthStart = new Date(now);
      monthStart.setMonth(monthStart.getMonth() - 1);

      // Priority 1: Most liked TODAY
      const todayPost = await fetchMostLiked(todayStart, 'TODAY');
      if (todayPost) {
        console.log('[useWatchHeroVideo] ✓ Using TODAY hero:', todayPost.id?.slice(0, 8));
        return { heroVideo: transformPostData(todayPost), trendingPeriod: 'today' };
      }

      // Priority 2: Most liked THIS WEEK
      const weekPost = await fetchMostLiked(weekStart, 'WEEK');
      if (weekPost) {
        console.log('[useWatchHeroVideo] ✓ Using WEEK hero:', weekPost.id?.slice(0, 8));
        return { heroVideo: transformPostData(weekPost), trendingPeriod: 'this_week' };
      }

      // Priority 3: Most liked THIS MONTH
      const monthPost = await fetchMostLiked(monthStart, 'MONTH');
      if (monthPost) {
        console.log('[useWatchHeroVideo] ✓ Using MONTH hero:', monthPost.id?.slice(0, 8));
        return { heroVideo: transformPostData(monthPost), trendingPeriod: 'this_month' };
      }

      // Priority 4: ALL TIME fallback
      console.log('[useWatchHeroVideo] No recent videos, fetching ALL TIME fallback');
      const fallbackPost = await fetchMostLiked(null, 'ALL_TIME');
      
      if (fallbackPost) {
        console.log('[useWatchHeroVideo] ✓ Using ALL TIME hero:', fallbackPost.id?.slice(0, 8));
        return { heroVideo: transformPostData(fallbackPost), trendingPeriod: 'all_time' };
      }

      console.log('[useWatchHeroVideo] ✗ No hero found at all');
      return { heroVideo: null, trendingPeriod: 'all_time' };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    heroVideo: data?.heroVideo ?? null,
    trendingPeriod: data?.trendingPeriod ?? 'today',
    isLoading,
    error: error as Error | null,
  };
}

export default useWatchHeroVideo;
