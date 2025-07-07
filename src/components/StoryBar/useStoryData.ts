
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
      console.log('Fetching stories data, user:', user?.id);
      
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
        const { data: currentUserProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('profile_photo_url, display_name, username')
          .eq('id', user.id)
          .maybeSingle();

        console.log('Current user profile:', currentUserProfile, 'Profile error:', profileError);

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

        // First, let's see what's actually in the user_friends table
        console.log('Checking all user_friends data...');
        const { data: allFriends, error: allFriendsError } = await supabase
          .from('user_friends')
          .select('*');
        
        console.log('All friends in database:', allFriends, 'Error:', allFriendsError);

        // Check for friends where current user is either user_id or friend_id
        const { data: myFriendships, error: myFriendshipsError } = await supabase
          .from('user_friends')
          .select('*')
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);
        
        console.log('My friendships (both directions):', myFriendships, 'Error:', myFriendshipsError);

        if (myFriendships && myFriendships.length > 0) {
          // Get friend IDs (excluding current user)
          const friendIds = myFriendships
            .filter(f => f.status === 'accepted')
            .map(f => f.user_id === user.id ? f.friend_id : f.user_id)
            .filter(id => id !== user.id);
          
          console.log('Friend IDs to fetch:', friendIds);

          if (friendIds.length > 0) {
            // Fetch friend profiles
            const { data: friendProfiles, error: profilesError } = await supabase
              .from('user_profiles')
              .select('id, username, display_name, profile_photo_url')
              .in('id', friendIds);
            
            console.log('Friend profiles:', friendProfiles, 'Profiles error:', profilesError);

            if (friendProfiles && friendProfiles.length > 0) {
              friendProfiles.forEach((profile: any) => {
                console.log('Adding friend story for profile:', profile);
                
                const friendStory = {
                  id: profile.id,
                  type: 'friend' as const,
                  user: profile.display_name || profile.username || 'Friend',
                  username: profile.username || profile.id,
                  avatar: profile.profile_photo_url || '',
                  hasStory: false,
                };
                
                console.log('Friend story created:', friendStory);
                newStories.push(friendStory);
              });
            }
          }
        }

        console.log('Final stories array:', newStories);
        console.log('Stories with avatars:', newStories.filter(s => s.avatar));
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
