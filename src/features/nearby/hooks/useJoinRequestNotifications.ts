import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useJoinRequestNotifications() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let isMounted = true;

    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) return;

      channel = supabase
        .channel(`game-join-requests-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'game_join_requests',
            filter: `requester_user_id=eq.${user.id}`,
          },
          async (payload) => {
            const next = payload.new as any;
            const status = next.status as string | undefined;

            if (!status) return;

            if (status === 'approved') {
              toast.success("You're in");
              queryClient.invalidateQueries({ queryKey: ['userGames'] });
              queryClient.invalidateQueries({ queryKey: ['games'] });
              queryClient.invalidateQueries({ queryKey: ['gameJoinRequests'] });
              queryClient.invalidateQueries({ queryKey: ['myJoinRequests'] });
            } else if (status === 'declined') {
              toast("Unfortunately this game is no longer available.");
              queryClient.invalidateQueries({ queryKey: ['games'] });
              queryClient.invalidateQueries({ queryKey: ['gameJoinRequests'] });
              queryClient.invalidateQueries({ queryKey: ['myJoinRequests'] });
            }
          },
        )
        .subscribe();
    };

    setup();

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [queryClient]);
}
