import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useEchoThreadIdBySwingId(swingId?: string, incomingThreadId?: string | null) {
  return useQuery({
    queryKey: ['echo-thread-id-by-swing', swingId, incomingThreadId],
    enabled: !!swingId,
    queryFn: async (): Promise<string | null> => {
      if (incomingThreadId) return incomingThreadId;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !swingId) return null;

      // Try to find most recent thread for this user
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
