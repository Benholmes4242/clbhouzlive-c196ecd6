import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';

/**
 * The ONLY client writer of the canonical home club.
 *
 * Writes `primary_club_id` (canonical FK to golf_clubs.id) AND the
 * denormalised `home_club` name in ONE operation, and clears any pending
 * placeholder. `home_club_id` stays legacy and is never written.
 */
export function useSetHomeClub() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (club: { id: string; name: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error('Not signed in');

      const { error } = await supabase
        .from('user_profiles')
        .update({
          primary_club_id: club.id,
          home_club: club.name,
          home_club_pending_name: null,
          home_club_pending_key: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
      if (error) throw error;
      return { userId, club };
    },
    onSuccess: ({ userId }) => {
      qc.invalidateQueries({ queryKey: ['user-profile', userId] });
      qc.invalidateQueries({ queryKey: ['profile-clubs'] });
      qc.invalidateQueries({ queryKey: ['home-club-status', userId] });
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : 'Could not save your home club');
    },
  });
}
