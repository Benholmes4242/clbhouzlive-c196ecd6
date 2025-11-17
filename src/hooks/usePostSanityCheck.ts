import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Dev-only hook to check for orphaned posts (posts without media).
 * Only runs when enabled (typically in development environments).
 */
export function usePostSanityCheck(isEnabled: boolean) {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEnabled) return;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: rpcError } = await supabase.rpc('count_orphan_posts');
        
        if (rpcError) throw rpcError;

        setCount(data ?? 0);
      } catch (err: any) {
        console.error('Failed to fetch orphan post count', err);
        setError('Failed to fetch orphan post count');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [isEnabled]);

  return { count, loading, error };
}
