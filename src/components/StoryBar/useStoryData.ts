
import { useEffect, useState } from 'react';
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { supabase } from "@/integrations/supabase/client";
import { StoryUser } from './types';

export const useStoryData = () => {
  const [stories, setStories] = useState<StoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSupabaseSession();

  const fetchStoriesData = async () => {
    if (!user) {
      setStories([
        {
          id: 'add',
          type: 'add',
          user: 'Your Profile',
          username: 'your-profile',
          avatar: '',
        }
      ]);
      setLoading(false);
      return;
    }

    try {
      // Get current user's profile
      const { data: currentUserProfile } = await supabase
        .from('user_profiles')
        .select('profile_photo_url, display_name, username')
        .eq('id', user.id)
        .maybeSingle();

      // Start with "Your Profile" story
      const newStories: StoryUser[] = [
        {
          id: 'add',
          type: 'add',
          user: currentUserProfile?.display_name || 'Your Profile',
          username: currentUserProfile?.username || 'your-profile',
          avatar: currentUserProfile?.profile_photo_url || '',
        }
      ];

      // Get users that the current user follows
      const { data: followedUsers, error: followError } = await supabase
        .from('user_follows')
        .select(`
          following_id,
          user_profiles!inner (
            id,
            username,
            display_name,
            profile_photo_url
          )
        `)
        .eq('follower_id', user.id);

      console.log('Followed users query result:', followedUsers, 'Error:', followError);

      if (followedUsers && followedUsers.length > 0) {
        followedUsers.forEach((follow: any) => {
          const profile = follow.user_profiles;
          if (profile) {
            newStories.push({
              id: profile.id,
              type: 'friend' as const,
              user: profile.display_name || profile.username || 'User',
              username: profile.username || profile.id,
              avatar: profile.profile_photo_url || '',
              hasStory: false,
            });
          }
        });
      }

      setStories(newStories);
    } catch (error) {
      console.error('Error fetching stories data:', error);
      setStories([
        {
          id: 'add',
          type: 'add',
          user: 'Your Profile',
          username: 'your-profile',
          avatar: '',
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoriesData();

    // Set up real-time subscription for follow changes only if user exists
    if (!user?.id) return;

    const channel = supabase
      .channel('follow-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_follows',
          filter: `follower_id=eq.${user.id}`,
        },
        () => {
          // Refetch stories when follow relationships change
          fetchStoriesData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { stories, loading };
};
