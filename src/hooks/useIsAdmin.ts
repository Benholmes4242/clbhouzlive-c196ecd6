/** Server-authoritative privilege read. Loading, signed-out and failed reads
 * are false; cached results are scoped to the authenticated user's id. */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export function useIsAdmin(): boolean {
  const { user } = useSupabaseSession();
  const query = useQuery({
    queryKey: ['is-admin', user?.id],
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const result = await supabase.rpc('is_admin');
      if (result?.error) throw result.error;
      return result?.data === true;
    },
  });
  return !!user && !query.isLoading && !query.isError && query.data === true;
}