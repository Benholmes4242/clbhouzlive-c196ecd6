import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { FeedPost, MediaItem } from '@/components/media-system/types/media';

export interface CreatorWeeklyStats {
  views: number;
  likes: number;
  comments: number;
  newFollowers: number;
  profileVisits: number;
}

export interface CreatorProfileData {
  isCreator: boolean;
  creatorOnly: boolean;
  featuredPost: FeedPost | null;
  pinnedPosts: FeedPost[];
  weeklyStats: CreatorWeeklyStats;
}

const EMPTY_STATS: CreatorWeeklyStats = {
  views: 0,
  likes: 0,
  comments: 0,
  newFollowers: 0,
  profileVisits: 0,
};

function mapMediaRow(row: any): MediaItem {
  return {
    id: row.id,
    type: row.media_type === 'video' ? 'video' : 'image',
    hlsUrl: row.stream_id
      ? `https://customer-2ut3gw2axjz6s2ew.cloudflarestream.com/${row.stream_id}/manifest/video.m3u8`
      : undefined,
    mp4Url: row.media_type !== 'video' ? undefined : row.media_url,
    imageUrl: row.media_type === 'image' ? row.media_url : undefined,
    thumbnailUrl: row.poster_url ?? undefined,
    width: row.width ?? 0,
    height: row.height ?? 0,
    duration: row.duration_seconds ?? undefined,
    displayOrder: row.display_order ?? 0,
  };
}

async function fetchPostById(postId: string): Promise<FeedPost | null> {
  console.log('[fetchPostById] fetching postId:', postId);
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id, content, created_at, user_id, actor_type, actor_id, status, source_review_id, course_id,
      post_media(id, media_type, media_url, poster_url, stream_id, duration_seconds, width, height, display_order),
      user_profiles(username, display_name, profile_photo_url, is_verified)
    `)
    .eq('id', postId)
    .eq('status', 'published')
    .maybeSingle();

  console.log('[fetchPostById] result:', { data: !!data, error: error?.message, postId });

  if (error || !data) return null;

  const profile = (data as any).user_profiles;
  const media = ((data as any).post_media ?? [])
    .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map(mapMediaRow);

  return {
    id: data.id,
    userId: data.user_id,
    actorType: (data.actor_type as 'personal' | 'business') ?? 'personal',
    actorId: data.actor_id ?? data.user_id,
    username: profile?.username ?? '',
    displayName: profile?.display_name ?? '',
    avatarUrl: profile?.profile_photo_url ?? '',
    isVerified: profile?.is_verified ?? false,
    creatorRelation: 'none',
    caption: data.content ?? '',
    mediaItems: media,
    createdAt: data.created_at,
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    review: null,
    isReview: !!data.source_review_id,
    isLikedByMe: false,
    isFollowedByMe: false,
  };
}

async function fetchWeeklyStats(userId: string): Promise<CreatorWeeklyStats> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const dateStr = sevenDaysAgo.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('profile_daily_metrics')
    .select('post_views, post_likes, post_comments, new_followers, profile_visits')
    .eq('profile_id', userId)
    .gte('metric_date', dateStr);

  if (error || !data || data.length === 0) return EMPTY_STATS;

  return data.reduce(
    (acc, row) => ({
      views: acc.views + (row.post_views ?? 0),
      likes: acc.likes + (row.post_likes ?? 0),
      comments: acc.comments + (row.post_comments ?? 0),
      newFollowers: acc.newFollowers + (row.new_followers ?? 0),
      profileVisits: acc.profileVisits + (row.profile_visits ?? 0),
    }),
    { ...EMPTY_STATS },
  );
}

async function fetchCreatorProfile(userId: string): Promise<CreatorProfileData> {
  console.log('[useCreatorProfile] fetching for userId:', userId);
  // 1. Fetch creator flags
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('is_creator, creator_only, featured_post_id, pinned_post_ids')
    .eq('id', userId)
    .single();

  console.log('[useCreatorProfile] profile data:', {
    is_creator: profile?.is_creator,
    featured_post_id: profile?.featured_post_id,
    pinned_post_ids: profile?.pinned_post_ids,
  });

  if (error || !profile || !profile.is_creator) {
    return { isCreator: false, creatorOnly: false, featuredPost: null, pinnedPosts: [], weeklyStats: EMPTY_STATS };
  }

  // 2. Parallel fetch featured post, pinned posts, and weekly stats
  const pinnedIds: string[] = Array.isArray(profile.pinned_post_ids) ? profile.pinned_post_ids : [];

  const [featuredPost, pinnedPostResults, weeklyStats] = await Promise.all([
    profile.featured_post_id ? fetchPostById(profile.featured_post_id) : Promise.resolve(null),
    pinnedIds.length > 0
      ? Promise.all(pinnedIds.slice(0, 3).map(fetchPostById))
      : Promise.resolve([]),
    fetchWeeklyStats(userId),
  ]);

  console.log('[useCreatorProfile] featuredPost:', featuredPost?.id, 'pinnedPosts:', pinnedPostResults.filter(p => p !== null).length);

  return {
    isCreator: true,
    creatorOnly: profile.creator_only ?? false,
    featuredPost,
    pinnedPosts: pinnedPostResults.filter((p): p is FeedPost => p !== null),
    weeklyStats,
  };
}

export function useCreatorProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['creator-profile', userId],
    queryFn: () => fetchCreatorProfile(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}
