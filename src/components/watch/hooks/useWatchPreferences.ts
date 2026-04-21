import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { UcpSignalType } from './useUcpSignal';

export interface WatchPreferenceRow {
  id: string;
  postId: string;
  signalType: UcpSignalType;
  progressSeconds: number | null;
  totalSeconds: number | null;
  lastInteractionAt: string;
  caption: string | null;
  thumbnailUrl: string | null;
  creatorUsername: string | null;
  creatorDisplayName: string | null;
  creatorAvatarUrl: string | null;
}

interface RawRow {
  id: string;
  post_id: string;
  signal_type: UcpSignalType;
  progress_seconds: number | null;
  total_seconds: number | null;
  last_interaction_at: string;
  posts?: {
    content: string | null;
    user_id: string;
    user_profiles?: {
      username: string | null;
      display_name: string | null;
      profile_photo_url: string | null;
    } | null;
    post_media?: Array<{
      poster_url: string | null;
      media_url: string | null;
      display_order: number | null;
    }> | null;
  } | null;
}

function mapRow(row: RawRow): WatchPreferenceRow {
  const firstMedia = (row.posts?.post_media ?? [])
    .slice()
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))[0];
  return {
    id: row.id,
    postId: row.post_id,
    signalType: row.signal_type,
    progressSeconds: row.progress_seconds,
    totalSeconds: row.total_seconds,
    lastInteractionAt: row.last_interaction_at,
    caption: row.posts?.content ?? null,
    thumbnailUrl: firstMedia?.poster_url ?? firstMedia?.media_url ?? null,
    creatorUsername: row.posts?.user_profiles?.username ?? null,
    creatorDisplayName: row.posts?.user_profiles?.display_name ?? null,
    creatorAvatarUrl: row.posts?.user_profiles?.profile_photo_url ?? null,
  };
}

/**
 * Fetches user_content_preferences rows for the watch-preferences page,
 * joined with post + creator data for display.
 */
export function useWatchPreferences(
  userId: string | undefined,
  signalType: UcpSignalType,
) {
  return useQuery({
    queryKey: ['watch-preferences', userId, signalType],
    queryFn: async (): Promise<WatchPreferenceRow[]> => {
      if (!userId) return [];
      const { data, error } = await (supabase
        .from('user_content_preferences') as any)
        .select(`
          id,
          post_id,
          signal_type,
          progress_seconds,
          total_seconds,
          last_interaction_at,
          posts:post_id (
            content,
            user_id,
            user_profiles:user_id (username, display_name, profile_photo_url),
            post_media (poster_url, media_url, display_order)
          )
        `)
        .eq('user_id', userId)
        .eq('signal_type', signalType)
        .order('last_interaction_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('[useWatchPreferences] error:', error);
        return [];
      }
      return ((data as RawRow[] | null) ?? []).map(mapRow);
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}
