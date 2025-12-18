import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ClubMini = { id: string; name: string };

export type HomeClubsPayload = {
  primary: ClubMini | null;
  additional_count: number;
  additional_preview: ClubMini[];
};

export type HomeClubsMap = Record<string, HomeClubsPayload>;

/**
 * Batch fetch home clubs for multiple users with visibility rules applied.
 * Uses the get_home_clubs_for_users RPC which respects visibility settings.
 */
export function useHomeClubsMap(userIds: string[], viewerId?: string | null) {
  const [map, setMap] = useState<HomeClubsMap>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!viewerId || userIds.length === 0) {
        setMap({});
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_home_clubs_for_users', {
          p_user_profile_ids: userIds,
          p_viewer_id: viewerId,
        });

        if (error) throw error;

        // Supabase returns jsonb as object already
        setMap((data || {}) as HomeClubsMap);
      } catch (e) {
        console.error('Failed to load home clubs map:', e);
        setMap({});
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [viewerId, JSON.stringify(userIds)]);

  return { homeClubsMap: map, loading };
}

/**
 * Fetch home clubs for a single user with visibility rules applied.
 * Uses the get_home_clubs_for_user RPC.
 */
export function useUserHomeClubs(userId?: string | null, viewerId?: string | null) {
  const [data, setData] = useState<HomeClubsPayload | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!userId || !viewerId) {
        setData(null);
        return;
      }

      setLoading(true);
      try {
        const { data: result, error } = await supabase.rpc('get_home_clubs_for_user', {
          p_user_profile_id: userId,
          p_viewer_id: viewerId,
        });

        if (error) throw error;

        setData(result as HomeClubsPayload | null);
      } catch (e) {
        console.error('Failed to load home clubs for user:', e);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [userId, viewerId]);

  return { clubs: data, loading };
}
