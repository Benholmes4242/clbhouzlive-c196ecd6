import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CLOUDFLARE_STREAM_SUBDOMAIN } from '@/media/constants';
import type { FeedPost } from '@/components/media-system/types/media';

interface ContinueWatchingRow {
  post_id: string;
  post_content: string | null;
  post_created_at: string;
  post_user_id: string;
  media_id: string;
  media_type: string;
  media_url: string;
  poster_url: string | null;
  stream_id: string | null;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  display_order: number | null;
  creator_username: string | null;
  creator_display_name: string | null;
  creator_avatar_url: string | null;
  creator_is_verified: boolean | null;
  like_count: number;
  comment_count: number;
  share_count: number;
  progress_seconds: number;
  total_seconds: number;
  last_interaction_at: string;
}

export interface VideosContinueWatchingPost extends FeedPost {
  progressSeconds: number;
  totalSeconds: number;
}

function rowToPost(row: ContinueWatchingRow): VideosContinueWatchingPost {
  const hlsUrl = row.media_url
    ? row.media_url
    : row.stream_id
      ? `https://${CLOUDFLARE_STREAM_SUBDOMAIN}/${row.stream_id}/manifest/video.m3u8`
      : undefined;

  const post: FeedPost = {
    id: row.post_id,
    userId: row.post_user_id,
    actorType: 'personal',
    actorId: row.post_user_id,
    username: row.creator_username ?? '',
    displayName: row.creator_display_name ?? '',
    avatarUrl: row.creator_avatar_url ?? '',
    isVerified: !!row.creator_is_verified,
    creatorRelation: 'none',
    caption: row.post_content ?? '',
    mediaItems: [{
      id: row.media_id,
      type: 'video',
      hlsUrl,
      imageUrl: row.poster_url ?? row.media_url,
      thumbnailUrl: row.poster_url ?? undefined,
      width: row.width ?? 0,
      height: row.height ?? 0,
      duration: row.duration_seconds ?? undefined,
      displayOrder: row.display_order ?? undefined,
    }],
    createdAt: row.post_created_at,
    likeCount: Number(row.like_count) || 0,
    commentCount: Number(row.comment_count) || 0,
    shareCount: Number(row.share_count) || 0,
    review: null,
    isReview: false,
    isLikedByMe: false,
    isFollowedByMe: false,
  };

  return {
    ...post,
    progressSeconds: row.progress_seconds,
    totalSeconds: row.total_seconds,
  };
}

/**
 * Long-form continue-watching feed (videos > 90s). Calls get_continue_watching
 * with p_format='video' so the Watch tab's mixed surface is unaffected.
 */
export function useVideosContinueWatching(userId: string | undefined, limit = 8) {
  return useQuery({
    queryKey: ['videos-continue-watching', userId, limit],
    enabled: !!userId,
    queryFn: async (): Promise<VideosContinueWatchingPost[]> => {
      if (!userId) return [];
      const { data, error } = await supabase.rpc('get_continue_watching' as any, {
        p_user_id: userId,
        p_limit: limit,
        p_format: 'video',
      });
      if (error) {
        if (import.meta.env.DEV) {
          console.error('[useVideosContinueWatching] RPC error:', error);
          throw error;
        }
        return [];
      }
      return ((data as ContinueWatchingRow[] | null) ?? []).map(rowToPost);
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
