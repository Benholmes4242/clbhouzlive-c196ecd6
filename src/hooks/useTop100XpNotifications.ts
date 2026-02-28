import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';
import { toast } from 'sonner';

export function useTop100XpNotifications() {
  const { user } = useSupabaseSession();

  useEffect(() => {
    if (!user) return;

    // Subscribe to new XP events for this user
    const channel = supabase
      .channel('user-xp-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_xp_events',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          const newEvent = payload.new;
          
          // Show toast for Top 100 bonus
          if (newEvent.reason === 'top100_new_course') {
            const courseName = newEvent.metadata?.course_name;
            toast.success('Top 100 unlocked', {
              description: `+${newEvent.amount} XP${courseName ? ` · ${courseName}` : ''}`,
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
}
