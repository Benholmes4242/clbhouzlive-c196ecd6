import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type RecommendedCreator = {
  id: string;
  username: string | null;
  display_name: string | null;
  profile_photo_url: string | null;
};

export function useRecommendedCreators(limit = 24) {
  const [data, setData] = useState<RecommendedCreator[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);

      // Fetch public creators with profile photos (best proxy for quality content creators)
      const { data: creators, error: err } = await supabase
        .from('user_profiles')
        .select('id, username, display_name, profile_photo_url')
        .eq('is_public', true)
        .not('profile_photo_url', 'is', null)
        .not('display_name', 'is', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!mounted) return;

      if (err) {
        setError(err.message);
        setData([]);
      } else {
        setData(creators ?? []);
      }
      setLoading(false);
    })();

    return () => { mounted = false; };
  }, [limit]);

  return { data, isLoading, error };
}
