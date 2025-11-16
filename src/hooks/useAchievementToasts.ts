import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';
import { channelManager } from '@/utils/supabaseChannelManager';

export interface AchievementToastData {
  achievementId: string;
  name: string;
  description: string;
  category: string;
  points: number;
  unlockedAt?: string;
}

export function useAchievementToasts() {
  const { user } = useSupabaseSession();
  const [toastQueue, setToastQueue] = useState<AchievementToastData[]>([]);
  const [currentToast, setCurrentToast] = useState<AchievementToastData | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const channelName = `achievements-${user.id}`;
    const channel = channelManager.createChannel(channelName);

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_achievements',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload: any) => {
          console.log('🏆 New achievement unlocked:', payload);
          
          // Fetch the full achievement data
          const { data, error } = await supabase
            .from('user_achievements')
            .select(`
              achievement_id,
              unlocked_at,
              achievements (
                code,
                name,
                description,
                category,
                points
              )
            `)
            .eq('user_id', user.id)
            .eq('achievement_id', payload.new.achievement_id)
            .single();

          if (error) {
            console.error('Error fetching achievement data:', error);
            return;
          }

          if (data && data.achievements) {
            const achievementData: AchievementToastData = {
              achievementId: data.achievement_id,
              name: (data.achievements as any).name,
              description: (data.achievements as any).description,
              category: (data.achievements as any).category,
              points: (data.achievements as any).points || 0,
              unlockedAt: data.unlocked_at,
            };

            setToastQueue((prev) => [...prev, achievementData]);
          }
        }
      )
      .subscribe();

    return () => {
      channelManager.removeChannel(channelName);
    };
  }, [user?.id]);

  // Process queue - show one toast at a time
  useEffect(() => {
    if (toastQueue.length > 0 && !currentToast) {
      setCurrentToast(toastQueue[0]);
      setToastQueue((prev) => prev.slice(1));
    }
  }, [toastQueue, currentToast]);

  const dismissToast = () => {
    setCurrentToast(null);
  };

  return {
    currentToast,
    dismissToast,
  };
}
