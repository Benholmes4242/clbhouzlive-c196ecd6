/**
 * useUnseenLevelUps -- surfaces the oldest unseen 'up' event so the
 * client can present a one-shot celebration sheet on foreground.
 *
 * Only the summit user's own row is returned (RLS enforces this).
 * Order asc + limit 1 means a stack of unseen level-ups celebrates in
 * order; each foreground marks the current one seen_at, revealing the
 * next on the following visibility change.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UnseenLevelUpEvent {
  id: string;
  user_id: string;
  level: number;
  label: string;
  medals: number;
  created_at: string;
}

export function useUnseenLevelUps(userId: string | null | undefined) {
  return useQuery<UnseenLevelUpEvent | null>({
    queryKey: ['gam', 'unseen-level-ups', userId],
    enabled: Boolean(userId),
    staleTime: 30 * 1000,
    retry: false,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('gam_user_level_events')
          .select('id,user_id,level,label,medals,created_at')
          .eq('user_id', userId as string)
          .eq('kind', 'up')
          .is('seen_at', null)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();
        if (error) return null;
        return (data as UnseenLevelUpEvent | null) ?? null;
      } catch {
        return null;
      }
    },
  });
}

export default useUnseenLevelUps;
