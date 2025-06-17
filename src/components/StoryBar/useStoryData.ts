
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
            username: 'your-profile',
            avatar: currentUserProfile?.profile_photo_url || '',
          }
        ];

        // 1. Fetch friends (bidirectional - where current user is either user_id or friend_id)
        const { data: friendsData, error: friendsError } = await supabase
          .from('user_friends')
          .select(`
            user_id,
            friend_id,
            user_profiles!user_friends_user_id_fkey (
              id,
              username,
              display_name,
              profile_photo_url
            ),
            friend_profiles:user_profiles!user_friends_friend_id_fkey (
              id,
              username,
              display_name,
              profile_photo_url
            )
          `)
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
          .eq('status', 'accepted');

        console.log('Friends data:', friendsData, 'Friends error:', friendsError);

        const friendIds: string[] = [];
        
        if (friendsData && friendsData.length > 0) {
          // Process bidirectional friend relationships
          friendsData.forEach((friendship: any) => {
            let friendProfile = null;
            
            // Determine which profile is the friend (not the current user)
            if (friendship.user_id === user.id && friendship.friend_profiles) {
              friendProfile = friendship.friend_profiles;
            } else if (friendship.friend_id === user.id && friendship.user_profiles) {
              friendProfile = friendship.user_profiles;
            }
            
            if (friendProfile && !friendIds.includes(friendProfile.id)) {
              friendIds.push(friendProfile.id);
              newStories.push({
                id: friendProfile.id,
                type: 'friend',
                user: friendProfile.display_name || friendProfile.username || 'Friend',
                username: friendProfile.username || friendProfile.id,
                avatar: friendProfile.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
                hasStory: true,
              });
            }
          });
        }

        console.log('Friend IDs found:', friendIds);

        // 2. Fetch suggested users (excluding current user and friends)
        const excludeIds = [user.id, ...friendIds];
        
        let query = supabase
          .from('user_profiles')
          .select('id, username, display_name, profile_photo_url, home_club')
          .eq('is_public', true);

        // Only add the not filter if we have IDs to exclude
        if (excludeIds.length > 0) {
          query = query.not('id', 'in', `(${excludeIds.join(',')})`);
        }

        const { data: suggestedUsers, error: suggestedError } = await query.limit(10);

        console.log('Suggested users data:', suggestedUsers, 'Suggested error:', suggestedError);

        if (suggestedUsers && suggestedUsers.length > 0) {
          // Add suggested users (lower priority than friends)
          suggestedUsers.forEach((profile: any) => {
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

        // 3. Only add mock data if we have very few users total
        if (newStories.length < 4) {
          console.log('Adding minimal mock data as fallback');
          const mockUsers = [
            {
              id: 'mock-1',
              type: 'suggested' as const,
              user: 'Mike Johnson',
              username: 'mike_golf_pro',
              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
              hasStory: false,
            },
            {
              id: 'mock-2',
              type: 'suggested' as const,
              user: 'Sarah Chen',
              username: 'sarah_golf',
              avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b302?w=150&h=150&fit=crop&crop=face',
              hasStory: false,
            }
          ].filter(mockUser => !newStories.find(story => story.username === mockUser.username));
          
          newStories.push(...mockUsers.slice(0, 2)); // Only add 2 mock users max
        }

        console.log('Final stories order:', newStories.map(s => ({ type: s.type, user: s.user, id: s.id })));
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
