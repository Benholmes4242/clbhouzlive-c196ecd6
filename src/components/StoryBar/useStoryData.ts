
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
      console.log('Fetching stories data, user:', user);
      
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

        // Fetch accepted friends
        const { data: friendsData, error: friendsError } = await supabase
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
          .eq('status', 'accepted');

        console.log('Friends data:', friendsData, 'Friends error:', friendsError);

        if (friendsData && friendsData.length > 0) {
          // Add friends to the stories
          friendsData.forEach((friendship: any) => {
            const profile = friendship.user_profiles;
            if (profile) {
              newStories.push({
                id: profile.id,
                type: 'friend',
                user: profile.display_name || profile.username || 'Friend',
                username: profile.username || profile.id,
                avatar: profile.profile_photo_url || '',
                hasStory: false, // Friends don't have stories, just profile access
              });
            }
          });
        }

        console.log('Final stories:', newStories.map(s => ({ type: s.type, user: s.user })));
        setStories(newStories);
      } catch (error) {
        console.error('Error fetching stories data:', error);
        // Fallback to just "Your Profile" on error
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

    fetchStoriesData();
  }, [user]);

  return { stories, loading };
};
