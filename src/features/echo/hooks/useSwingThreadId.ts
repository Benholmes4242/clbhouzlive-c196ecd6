import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSwingThreadId(swingId?: string) {
  return useQuery({
    queryKey: ['swing-thread-id', swingId],
    enabled: !!swingId,
    queryFn: async (): Promise<string | null> => {
      if (!swingId) return null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Find thread strictly by user_id, no fallback to generic threads
      // Since we don't have swing_id column, we'll need to match by user
      // and filter to only swing-related threads
      const { data, error } = await supabase
        .from('echo_threads')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data?.id ?? null;
    },
  });
}
