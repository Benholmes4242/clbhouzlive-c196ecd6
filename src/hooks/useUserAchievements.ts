import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export interface Achievement {
  id: string;
  achievement_type: string;
  achievement_data: any;
  created_at: string;
}

export interface FormattedAchievement {
  id: string;
  emoji: string;
  message: string;
  timestamp: string;
  type: string;
}

export const useUserAchievements = (limit: number = 5) => {
  const { user } = useSupabaseSession();
  const [achievements, setAchievements] = useState<FormattedAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatAchievement = (achievement: Achievement): FormattedAchievement => {
    const data = achievement.achievement_data;
    const timeAgo = getTimeAgo(achievement.created_at);

    switch (achievement.achievement_type) {
      case 'trophy_unlock':
        return {
          id: achievement.id,
          emoji: data.trophy_emoji || '🏆',
          message: `You unlocked ${data.trophy_name}`,
          timestamp: timeAgo,
          type: 'trophy'
        };

      case 'course_played':
        return {
          id: achievement.id,
          emoji: '✨',
          message: `+${data.xp_gained} XP – Played ${data.course_name}!`,
          timestamp: timeAgo,
          type: 'course'
        };

      case 'xp_milestone':
        return {
          id: achievement.id,
          emoji: '🎉',
          message: `Reached ${data.milestone_xp.toLocaleString()} total XP milestone!`,
          timestamp: timeAgo,
          type: 'milestone'
        };

      case 'list_progress':
        return {
          id: achievement.id,
          emoji: data.emoji || '🏴',
          message: data.message || `Progress on ${data.list_name} list!`,
          timestamp: timeAgo,
          type: 'progress'
        };

      case 'badge_earned':
        return {
          id: achievement.id,
          emoji: data.badge_emoji || '🏅',
          message: `Earned the "${data.badge_name}" badge!`,
          timestamp: timeAgo,
          type: 'badge'
        };

      default:
        return {
          id: achievement.id,
          emoji: '🎯',
          message: 'New achievement unlocked!',
          timestamp: timeAgo,
          type: 'general'
        };
    }
  };

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 7) {
      return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    } else if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const fetchAchievements = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .rpc('get_user_recent_achievements', {
          user_id_param: user.id,
          limit_param: limit
        });

      if (fetchError) {
        console.error('Error fetching achievements:', fetchError);
        setError(fetchError.message);
        return;
      }

      const formattedAchievements = (data || []).map(formatAchievement);
      setAchievements(formattedAchievements);
    } catch (err) {
      console.error('Error in fetchAchievements:', err);
      setError('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  }, [user?.id, limit]);

  useEffect(() => {
    fetchAchievements();
  }, [user?.id, limit]);

  // Set up real-time subscription for new achievements
  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up user achievements subscription for user:', user.id);
    const channelName = `user_achievements_${user.id}`;
    
    const setupSubscription = async () => {
      try {
        // Import the channel manager
        import('@/utils/supabaseChannelManager').then(({ channelManager }) => {
          const channel = channelManager.createChannel(channelName);
          
          channel
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'user_achievements',
                filter: `user_id=eq.${user.id}`
              },
              () => {
                console.log('New user achievement detected, refetching...');
                // Inline the fetch logic to avoid dependency issues
                supabase
                  .rpc('get_user_recent_achievements', {
                    user_id_param: user.id,
                    limit_param: limit
                  })
                  .then(({ data, error: fetchError }) => {
                    if (fetchError) {
                      console.error('Error fetching achievements:', fetchError);
                      return;
                    }
                    const formattedAchievements = (data || []).map(formatAchievement);
                    setAchievements(formattedAchievements);
                  });
              }
            )
            .subscribe((status) => {
              if (status === 'SUBSCRIBED') {
                console.log('Successfully subscribed to user achievements');
              } else if (status === 'CHANNEL_ERROR') {
                console.warn('User achievements realtime subscription failed - continuing without realtime updates');
              }
            });
        });
      } catch (error) {
        console.warn('Failed to setup user achievements realtime subscription:', error);
        // App continues to work without realtime achievements updates
      }
    };

    setupSubscription();

    return () => {
      console.log('Cleaning up user achievements subscription');
      import('@/utils/supabaseChannelManager').then(({ channelManager }) => {
        channelManager.removeChannel(channelName);
      });
    };
  }, [user?.id]); // Remove limit from dependencies to prevent re-subscriptions

  return {
    achievements,
    loading,
    error,
    refetch: fetchAchievements
  };
};