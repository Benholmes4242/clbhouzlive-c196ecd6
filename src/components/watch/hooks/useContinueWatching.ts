import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CLOUDFLARE_STREAM_SUBDOMAIN } from '@/media/constants';
import type { FeedPost } from '@/components/media-system/types/media';

export interface ContinueWatchingPost extends FeedPost {
  progressSeconds: number;
  totalSeconds: number;
}

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

function rowToMediaItem(row: ContinueWatchingRow) {
  // Prefer the canonical media_url from the DB (always carries the correct
  // Cloudflare Stream customer subdomain). Fall back to constructing from
  // stream_id + the canonical subdomain constant if media_url is missing.
  const hlsUrl = row.media_url
    ? row.media_url
    : row.stream_id
      ? `https://${CLOUDFLARE_STREAM_SUBDOMAIN}/${row.stream_id}/manifest/video.m3u8`
      : undefined;

  return {
    id: row.media_id,
    type: 'video' as const,
    hlsUrl,
    imageUrl: row.poster_url ?? row.media_url,
    thumbnailUrl: row.poster_url ?? undefined,
    width: row.width ?? 0,
    height: row.height ?? 0,
    duration: row.duration_seconds ?? undefined,
    displayOrder: row.display_order ?? undefined,
  };
}

/**
 * Build one ContinueWatchingPost from one or more rows that share a post_id.
 * The RPC fans post-level progress out across media rows; we collapse it
 * back to a single post with all its media items in display_order.
 *
 * progress_seconds / total_seconds / last_interaction_at are post-level and
 * identical across rows in the same group — so we read them from rows[0].
 */
function rowsToPost(rows: ContinueWatchingRow[]): ContinueWatchingPost {
  const lead = rows[0];
  const mediaItems = rows
    .map(rowToMediaItem)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  const post: FeedPost = {
    id: lead.post_id,
    userId: lead.post_user_id,
    actorType: 'personal',
    actorId: lead.post_user_id,
    username: lead.creator_username ?? '',
    displayName: lead.creator_display_name ?? '',
    avatarUrl: lead.creator_avatar_url ?? '',
    isVerified: !!lead.creator_is_verified,
    creatorRelation: 'none',
    caption: lead.post_content ?? '',
    mediaItems,
    createdAt: lead.post_created_at,
    likeCount: Number(lead.like_count) || 0,
    commentCount: Number(lead.comment_count) || 0,
    shareCount: Number(lead.share_count) || 0,
    review: null,
    isReview: false,
    isLikedByMe: false,
    isFollowedByMe: false,
  };

  return {
    ...post,
    progressSeconds: lead.progress_seconds,
    totalSeconds: lead.total_seconds,
  };
}

export function useContinueWatching(userId: string | undefined, limit = 10) {
  const query = useQuery({
    queryKey: ['continue-watching', userId, limit],
    queryFn: async (): Promise<ContinueWatchingPost[]> => {
      if (!userId) return [];
      const { data, error } = await (supabase.rpc as any)('get_continue_watching', {
        p_user_id: userId,
        p_limit: limit,
      });
      if (error) {
        if (import.meta.env.DEV) {
          console.error('[ContinueWatching] RPC error:', error);
          throw error;
        }
        return [];
      }
      const rows = (data as ContinueWatchingRow[] | null) ?? [];

      // Group rows by post_id. Map preserves insertion order, so the first row
      // for each post (by RPC's ORDER BY last_interaction_at DESC) wins the
      // group's position in the rail — preserving "most recently watched first".
      const grouped = new Map<string, ContinueWatchingRow[]>();
      for (const row of rows) {
        const existing = grouped.get(row.post_id);
        if (existing) {
          existing.push(row);
        } else {
          grouped.set(row.post_id, [row]);
        }
      }

      return Array.from(grouped.values()).map(rowsToPost);
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  return {
    posts: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
