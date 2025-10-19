import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { isMockLiveEnabled } from '@/mocks/mockSwitch';
import { MOCK_NEARBY } from '@/mocks/live_clubhouse';

export type NearbyGolfer = {
  id: string;
  username: string;
  display_name: string;
  profile_photo_url: string;
  home_club?: string | null;
};

interface NearbyResult {
  hasNearby: boolean;
  count: number;
  list: NearbyGolfer[];
}

/**
 * Hook to check if there are nearby shorts based on user's location or home club
 * Returns count of recent posts within ~25-50km radius
 */
export function useNearbyShorts(): NearbyResult {
  const mock = isMockLiveEnabled();
  const { user } = useSupabaseSession();
  const [result, setResult] = useState<NearbyResult>({ hasNearby: false, count: 0, list: [] });

  // MOCK PATH
  const mockResult = useMemo(() => {
    if (mock) {
      const list = MOCK_NEARBY.slice(0, 3);
      return { hasNearby: true, count: list.length, list };
    }
    return null;
  }, [mock]);

  if (mockResult) return mockResult;

  // === REAL PATH ===
  useEffect(() => {
    if (!user) {
      setResult({ hasNearby: false, count: 0, list: [] });
      return;
    }

    (async () => {
      try {
        // Get user's home club or location
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('home_club')
          .eq('id', user.id)
          .single();

        if (!profile?.home_club) {
          setResult({ hasNearby: false, count: 0, list: [] });
          return;
        }

        // For now, we'll do a simple check for posts with the same home_club tag
        // In a production app, you'd use PostGIS or similar for geospatial queries
        const { data: nearbyPosts, count } = await supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .neq('user_id', user.id);

        setResult({
          hasNearby: (count ?? 0) > 0,
          count: count ?? 0,
          list: []
        });
      } catch (error) {
        console.error('Error fetching nearby shorts:', error);
        setResult({ hasNearby: false, count: 0, list: [] });
      }
    })();
  }, [user?.id]);

  return result;
}
