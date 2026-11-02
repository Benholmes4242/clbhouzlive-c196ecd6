/**
 * WS1 — THE FEATURED CREATORS READ. get_featured_creators(p_limit) returns
 * Ben's curated list already ordered (creators with a video in the last 7
 * days first, newest first, then his sort order), with blocked actors and
 * creators with no visible video excluded server-side. The app never reads
 * the featured_creators table directly.
 *
 * Signed-in only: the query is disabled without a userId and the RPC returns
 * nothing for a guest, so guests never see the row.
 *
 * ERRORED IS NOT EMPTY, as on every Watch read: the query throws and the row
 * renders nothing rather than pretending there are no creators.
 */
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

export interface FeaturedCreator {
  actor_type: 'personal' | 'business';
  actor_id: string;
  display_name: string;
  /** Username for a person, the business slug for a business. */
  handle: string;
  avatar_url: string | null;
  is_verified: boolean;
  /** Home club name, or the business city. */
  area: string | null;
  videos_7d: number;
  latest_video_at: string | null;
  sort_order: number;
}

export function useFeaturedCreators(limit: number, enabled: boolean) {
  return useQuery({
    queryKey: ['watch-featured-creators', limit],
    enabled,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_featured_creators' as never, { p_limit: limit } as never);
      if (error) throw error;
      return (data ?? []) as unknown as FeaturedCreator[];
    },
  });
}
