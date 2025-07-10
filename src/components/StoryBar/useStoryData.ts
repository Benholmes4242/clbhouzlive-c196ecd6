
import { useEffect, useState } from 'react';
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { supabase } from "@/integrations/supabase/client";
import { StoryUser } from './types';

export const useStoryData = () => {
  const [stories, setStories] = useState<StoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSupabaseSession();

  useEffect(() => {
    const fetchStoriesData = async () => {
      if (!user) {
        // Show only "Your Profile" for non-authenticated users
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
        // Start with empty stories array - no longer showing "Your Profile"
        const newStories: StoryUser[] = [];

        // Get users that the current user follows
        const { data: followedUsers, error: followError } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id);

        console.log('Followed users:', followedUsers, 'Error:', followError);

        if (followedUsers && followedUsers.length > 0) {
          // Get profile data for followed users
          const followedIds = followedUsers.map(f => f.following_id);
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, username, display_name, profile_photo_url')
            .in('id', followedIds);

          if (profiles && profiles.length > 0) {
            profiles.forEach((profile: any) => {
              newStories.push({
                id: profile.id,
                type: 'friend' as const,
                user: profile.display_name || profile.username || 'User',
                username: profile.username || profile.id,
                avatar: profile.profile_photo_url || '',
                hasStory: false,
              });
            });
          }
        }

        setStories(newStories);
      } catch (error) {
        console.error('Error fetching stories data:', error);
        // Fallback to empty array on error since we're not showing "Your Profile"
        setStories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStoriesData();

    // Set up real-time subscription for follow changes
    const channel = supabase
      .channel('story-follows')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_follows',
          filter: `follower_id=eq.${user?.id}`,
        },
        () => {
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
