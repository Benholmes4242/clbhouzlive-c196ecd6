
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
        // Show static data for non-authenticated users
        setStories([
          {
            id: 'add',
            type: 'add',
            user: 'Your Profile',
            username: 'your-profile',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          }
        ]);
        setLoading(false);
        return;
      }

      try {
        // Start with "Your Profile" story
        const newStories: StoryUser[] = [
          {
            id: 'add',
            type: 'add',
            user: 'Your Profile',
            username: 'your-profile',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          }
        ];

        // Fetch friends (accepted friend relationships)
        const { data: friendsData } = await supabase
          .from('user_friends')
          .select(`
            friend_id,
            user_profiles!user_friends_friend_id_fkey (
              id,
              username,
              display_name,
              profile_photo_url
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'accepted')
          .limit(10);

        if (friendsData && friendsData.length > 0) {
          // User has friends, show them
          friendsData.forEach((friendship: any) => {
            const profile = friendship.user_profiles;
            if (profile) {
              newStories.push({
                id: profile.id,
                type: 'friend',
                user: profile.display_name || profile.username || 'Friend',
                username: profile.username || profile.id,
                avatar: profile.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
                hasStory: true,
              });
            }
          });
        } else {
          // No friends, fetch random users to toggle through
          const friendIds = friendsData?.map((f: any) => f.friend_id) || [];
          const excludeIds = [user.id, ...friendIds];

          const { data: randomUsers } = await supabase
            .from('user_profiles')
            .select('id, username, display_name, profile_photo_url, home_club')
            .eq('is_public', true)
            .not('id', 'in', `(${excludeIds.join(',')})`)
            .limit(20); // Fetch more users to toggle through

          if (randomUsers && randomUsers.length > 0) {
            randomUsers.forEach((profile: any) => {
              newStories.push({
                id: profile.id,
                type: 'suggested',
                user: profile.display_name || profile.username || 'Player',
                username: profile.username || profile.id,
                avatar: profile.profile_photo_url || `https://images.unsplash.com/photo-${Math.random() > 0.5 ? '1507003211169-0a1dd7228f2d' : '1500648767791-00dcc994a43e'}?w=150&h=150&fit=crop&crop=face`,
                hasStory: false,
              });
            });
          }
        }

        setStories(newStories);
      } catch (error) {
        console.error('Error fetching stories data:', error);
        // Fallback to static data on error
        setStories([
          {
            id: 'add',
            type: 'add',
            user: 'Your Profile',
            username: 'your-profile',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchStoriesData();
  }, [user]);

  return { stories, loading };
};
