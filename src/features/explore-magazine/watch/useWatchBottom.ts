/**
 * WS3 reads: the WATCH_S3_V1 RPCs. The spotlight is keyed by a per-visit key
 * WatchFeed mints on mount, so a fresh pick arrives each visit and stays put
 * while the page is open (no refetch on rerender, chip switch or focus).
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { WatchVideoRow } from './watchMiddle';
import { SPOTLIGHT_VIDEOS, TOP100_SHELF_LIMIT, type SpotlightRow, type Top100VideoRow } from './watchBottom';

export function useWatchSpotlight(userId: string | null | undefined, visitKey: string) {
  return useQuery<SpotlightRow | null>({
    queryKey: ['watch-s3', 'spotlight', userId, visitKey],
    enabled: !!userId,
    staleTime: Infinity,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_watch_spotlight');
      if (error) throw error;
      return (data ?? [])[0] ?? null;
    },
  });
}

export function useCreatorVideos(actorType: string | null, actorId: string | null) {
  return useQuery<WatchVideoRow[]>({
    queryKey: ['watch-s3', 'creator-videos', actorType, actorId],
    enabled: !!actorType && !!actorId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_creator_videos', { p_actor_type: actorType as string, p_actor_id: actorId as string, p_limit: SPOTLIGHT_VIDEOS });
      if (error) throw error;
      return (data ?? []) as WatchVideoRow[];
    },
  });
}

export function useTop100Videos(userId: string | null | undefined) {
  return useQuery<Top100VideoRow[]>({
    queryKey: ['watch-s3', 'top100', userId],
    enabled: !!userId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_watch_top100_videos', { p_limit: TOP100_SHELF_LIMIT });
      if (error) throw error;
      return data ?? [];
    },
  });
}
