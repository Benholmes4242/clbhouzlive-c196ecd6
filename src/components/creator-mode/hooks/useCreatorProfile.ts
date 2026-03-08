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
  // Fetch post + media (no user_profiles join to avoid ambiguous FK error)
  const { data: postData, error: postError } = await supabase
    .from('posts')
    .select(`
      id, content, created_at, user_id, actor_type, actor_id, status, source_review_id, course_id,
      post_media(id, media_type, media_url, poster_url, stream_id, duration_seconds, width, height, display_order)
    `)
    .eq('id', postId)
    .eq('status', 'published')
    .maybeSingle();

  if (postError || !postData) return null;

  // Fetch profile, engagement counts, and course name in parallel
  const courseId = postData.course_id;
  const [{ data: profileData }, { count: likeCount }, { count: commentCount }, courseResult] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('username, display_name, profile_photo_url, is_verified')
      .eq('id', postData.user_id)
      .maybeSingle(),
    supabase.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', postId),
    supabase.from('post_comments').select('*', { count: 'exact', head: true }).eq('post_id', postId),
    courseId
      ? supabase.from('golf_courses').select('name').eq('id', courseId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const media = ((postData as any).post_media ?? [])
    .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map(mapMediaRow);

  return {
    id: postData.id,
    userId: postData.user_id,
    actorType: (postData.actor_type as 'personal' | 'business') ?? 'personal',
    actorId: postData.actor_id ?? postData.user_id,
    username: profileData?.username ?? '',
    displayName: profileData?.display_name ?? '',
    avatarUrl: profileData?.profile_photo_url ?? '',
    isVerified: profileData?.is_verified ?? false,
    creatorRelation: 'none',
    caption: postData.content ?? '',
    mediaItems: media,
    createdAt: postData.created_at,
    likeCount: likeCount ?? 0,
    commentCount: commentCount ?? 0,
    shareCount: 0,
    review: null,
    isReview: !!postData.source_review_id,
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
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('is_creator, creator_only, featured_post_id, pinned_post_ids')
    .eq('id', userId)
    .single();

  if (error || !profile || !profile.is_creator) {
    return { isCreator: false, creatorOnly: false, featuredPost: null, pinnedPosts: [], weeklyStats: EMPTY_STATS };
  }

  const pinnedIds: string[] = Array.isArray(profile.pinned_post_ids) ? profile.pinned_post_ids : [];

  const [featuredPost, pinnedPostResults, weeklyStats] = await Promise.all([
    profile.featured_post_id ? fetchPostById(profile.featured_post_id) : Promise.resolve(null),
    pinnedIds.length > 0
      ? Promise.all(pinnedIds.slice(0, 3).map(fetchPostById))
      : Promise.resolve([]),
    fetchWeeklyStats(userId),
  ]);

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
