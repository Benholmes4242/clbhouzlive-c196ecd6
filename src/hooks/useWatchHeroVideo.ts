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

async function fetchMostLiked(since: Date | null, label: string): Promise<HeroVideo | null> {
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

  if (!videos || videos.length === 0) {
    console.log(`[useWatchHeroVideo] ${label} result: No videos found`);
    return null;
  }

  const topPost = videos[0] as any;
  
  // Fetch user profile separately (no FK between posts and user_profiles)
  let creator: HeroVideo['creator'] = null;
  if (topPost.user_id) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, username, display_name, profile_photo_url')
      .eq('id', topPost.user_id)
      .single();
    
    if (profile) {
      creator = {
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
        profile_photo_url: profile.profile_photo_url,
      };
    }
  }

  console.log(`[useWatchHeroVideo] ${label} result:`, {
    rawCount: data?.length,
    videoCount: videos?.length,
    topVideoId: topPost.id?.slice(0, 8),
    topLikes: topPost.like_count
  });

  return {
    id: topPost.id,
    content: topPost.content,
    created_at: topPost.created_at,
    user_id: topPost.user_id,
    like_count: topPost.like_count || 0,
    media: (topPost.post_media || []).map((m: any) => ({
      id: m.id,
      media_url: m.media_url,
      media_type: m.media_type,
      poster_url: m.poster_url,
      duration_seconds: m.duration_seconds,
      aspect_ratio: m.aspect_ratio,
    })),
    creator,
    course: topPost.golf_courses ? {
      id: topPost.golf_courses.id,
      name: topPost.golf_courses.name,
      country: topPost.golf_courses.country,
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
        return { heroVideo: todayPost, trendingPeriod: 'today' };
      }

      // Priority 2: Most liked THIS WEEK
      const weekPost = await fetchMostLiked(weekStart, 'WEEK');
      if (weekPost) {
        console.log('[useWatchHeroVideo] ✓ Using WEEK hero:', weekPost.id?.slice(0, 8));
        return { heroVideo: weekPost, trendingPeriod: 'this_week' };
      }

      // Priority 3: Most liked THIS MONTH
      const monthPost = await fetchMostLiked(monthStart, 'MONTH');
      if (monthPost) {
        console.log('[useWatchHeroVideo] ✓ Using MONTH hero:', monthPost.id?.slice(0, 8));
        return { heroVideo: monthPost, trendingPeriod: 'this_month' };
      }

      // Priority 4: ALL TIME fallback
      console.log('[useWatchHeroVideo] No recent videos, fetching ALL TIME fallback');
      const fallbackPost = await fetchMostLiked(null, 'ALL_TIME');
      
      if (fallbackPost) {
        console.log('[useWatchHeroVideo] ✓ Using ALL TIME hero:', fallbackPost.id?.slice(0, 8));
        return { heroVideo: fallbackPost, trendingPeriod: 'all_time' };
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
