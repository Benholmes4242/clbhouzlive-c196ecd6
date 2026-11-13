/** One viewer-scoped media read per rail surface. The RPC alone owns privacy
 * and latest-media qualification; images are posters, never playable tiles. */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export interface FollowTileMedia { media_type: 'image' | 'video'; image_url: string; aspect_ratio: number; posted_at: string }
const EMPTY = new Map<string, FollowTileMedia>();
export function useFollowTileMedia(personIds: string[], businessIds: string[]) {
  const { user } = useSupabaseSession();
  const viewerId = user?.id ?? null;
  const people = personIds.slice(0, 100);
  const businesses = businessIds.slice(0, 100);
  const ids = [...people.map(id => `p:${id}`), ...businesses.map(id => `b:${id}`)].sort();
  const enabled = !!viewerId && user?.is_anonymous !== true && ids.length > 0;
  const query = useQuery({
    queryKey: ['follow-tile-media', viewerId, ids], enabled,
    staleTime: 10 * 60_000, refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_follow_tile_media', { p_user_ids: people, p_business_ids: businesses });
      if (error) throw error;
      const media = new Map<string, FollowTileMedia>();
      for (const row of data ?? []) {
        if (row.image_url && (row.kind === 'person' || row.kind === 'business') && (row.media_type === 'image' || row.media_type === 'video')) {
          media.set(`${row.kind === 'person' ? 'p' : 'b'}:${row.id}`, { ...row, media_type: row.media_type });
        }
      }
      return media;
    },
  });
  return { media: query.data ?? EMPTY, settled: !enabled || query.isFetched || query.isError };
}