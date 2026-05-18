import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useMarkBadgeSeen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (badgeId: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.rpc as any)('gam_mark_badge_seen', { p_badge_id: badgeId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gam_rpc', 'get_user_achievements_for_viewer'] });
    },
  });
}
