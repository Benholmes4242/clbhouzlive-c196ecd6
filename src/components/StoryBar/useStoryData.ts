
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

        // Try multiple approaches to fetch friends
        console.log('Attempting to fetch friends with different queries...');

        // First, try the original query
        const { data: friendsData1, error: friendsError1 } = await supabase
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

        console.log('Query 1 (original):', { friendsData1, friendsError1 });

        // Second, try querying both directions of friendship
        const { data: friendsData2, error: friendsError2 } = await supabase
          .from('user_friends')
          .select(`
            user_id,
            friend_id,
            status,
            user_profiles!user_friends_friend_id_fkey (
              id,
              username,
              display_name,
              profile_photo_url
            )
          `)
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
          .eq('status', 'accepted');

        console.log('Query 2 (bidirectional):', { friendsData2, friendsError2 });

        // Third, try a simple query without joins first
        const { data: friendsData3, error: friendsError3 } = await supabase
          .from('user_friends')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'accepted');

        console.log('Query 3 (simple):', { friendsData3, friendsError3 });

        // Use the first successful query that returns data
        let friendsToProcess: any[] = [];
        
        if (friendsData1 && friendsData1.length > 0) {
          friendsToProcess = friendsData1;
          console.log('Using Query 1 results');
        } else if (friendsData2 && friendsData2.length > 0) {
          friendsToProcess = friendsData2;
          console.log('Using Query 2 results');
        } else if (friendsData3 && friendsData3.length > 0) {
          console.log('Using Query 3 results, fetching profiles separately');
          // Fetch profiles separately
          const friendIds = friendsData3.map(f => f.friend_id);
          const { data: profilesData } = await supabase
            .from('user_profiles')
            .select('id, username, display_name, profile_photo_url')
            .in('id', friendIds);
          
          console.log('Fetched profiles separately:', profilesData);
          
          // Combine the data
          friendsToProcess = friendsData3.map(friendship => ({
            ...friendship,
            user_profiles: profilesData?.find(p => p.id === friendship.friend_id)
          }));
        }

        console.log('Final friends to process:', friendsToProcess);
        console.log('Number of friends to process:', friendsToProcess.length);

        if (friendsToProcess && friendsToProcess.length > 0) {
          // Add friends to the stories
          friendsToProcess.forEach((friendship: any) => {
            const profile = friendship.user_profiles;
            console.log('Processing friend profile:', profile);
            
            if (profile) {
              const friendStory = {
                id: profile.id,
                type: 'friend' as const,
                user: profile.display_name || profile.username || 'Friend',
                username: profile.username || profile.id,
                avatar: profile.profile_photo_url || '',
                hasStory: false,
              };
              
              console.log('Adding friend story:', friendStory);
              newStories.push(friendStory);
            }
          });
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
