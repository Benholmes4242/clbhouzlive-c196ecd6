/** PF3B: callers collect exactly-one-video ids at PAGE level. Cards never read.
 * Missing rows are cached as null by post+viewer, so appended pages fetch only
 * missing posts. Errors expose no stale details; guest/signed-out returns empty. */
import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useIsGuest } from '@/features/guest/useIsGuest';
import { normalizeVideoDetails, type PostVideoDetails } from '@/features/video-details/videoDetailsModel';
export const VIDEO_DETAILS_BATCH = 100;
export function usePostVideoDetails(postIds: readonly string[]): Map<string, PostVideoDetails> {
  const { user } = useSupabaseSession();
  const guest = useIsGuest();
  const client = useQueryClient();
  const ids = useMemo(() => [...new Set(postIds.filter(Boolean))].sort(), [postIds]);
  const allowed = !!user?.id && !guest;
  const query = useQuery({ queryKey: ['post-video-details-page', user?.id, ids.join(',')], enabled: allowed && ids.length > 0, staleTime: 300_000, retry: false,
    queryFn: async () => {
      const map = new Map<string, PostVideoDetails>();
      const missing: string[] = [];
      for (const id of ids) {
        const key = ['post-video-details', user?.id, id];
        const cached = client.getQueryData<PostVideoDetails | null>(key);
        const updated = client.getQueryState(key)?.dataUpdatedAt ?? 0;
        if (cached !== undefined && Date.now() - updated < 300_000) { if (cached) map.set(id, cached); } else missing.push(id);
      }
      for (let i = 0; i < missing.length; i += VIDEO_DETAILS_BATCH) {
        const batch = missing.slice(i, i + VIDEO_DETAILS_BATCH);
        try {
          const { data, error } = await supabase.rpc('get_post_video_details', { p_post_ids: batch });
          if (error) return new Map<string, PostVideoDetails>();
          const rows = new Map<string, PostVideoDetails>();
          for (const row of data ?? []) { const value = normalizeVideoDetails(row as unknown as Record<string, unknown>); if (batch.includes(value.postId)) rows.set(value.postId, value); }
          for (const id of batch) { const value = rows.get(id) ?? null; client.setQueryData(['post-video-details', user?.id, id], value); if (value) map.set(id, value); }
        } catch { return new Map<string, PostVideoDetails>(); }
      }
      return map;
    } });
  return allowed && !query.isError ? query.data ?? new Map() : new Map();
}