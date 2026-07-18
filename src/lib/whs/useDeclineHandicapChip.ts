import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from '@/lib/toast';

/**
 * Returns a handler that hides the "Connect HCP" header chip for the current
 * user. Writes user_profiles.hide_handicap_chip = true, invalidates profile
 * caches so the chip disappears immediately, and shows a confirming toast.
 * The Settings toggle is the single source of truth for reversal.
 */
export function useDeclineHandicapChip(): () => Promise<void> {
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();

  return useCallback(async () => {
    if (!user?.id) return;
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ hide_handicap_chip: true })
        .eq('id', user.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['user-profile', user.id] });
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      toast.success('Connect HCP hidden. Re-enable anytime in Settings.');
    } catch (e) {
      console.error('[useDeclineHandicapChip]', e);
      toast.error('Could not update. Please try again.');
    }
  }, [user?.id, queryClient]);
}
