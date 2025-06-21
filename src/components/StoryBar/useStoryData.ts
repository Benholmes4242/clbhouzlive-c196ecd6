
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";

export interface Story {
  id: string;
  type: 'your_profile' | 'friend_profile';
  name: string;
  username?: string;
  image: string;
  hasStory?: boolean;
}

export const useStoryData = () => {
  const { user } = useSupabaseSession();

  const { data: stories = [], isLoading: loading } = useQuery({
    queryKey: ['stories', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const stories: Story[] = [];

      // Get user's own profile
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('profile_photo_url, display_name, username')
        .eq('id', user.id)
        .maybeSingle();

      // Add user's own profile as first story
      stories.push({
        id: 'your_profile',
        type: 'your_profile',
        name: 'Your Profile',
        username: userProfile?.username || undefined,
        image: userProfile?.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        hasStory: false
      });

      // Get friends
      const { data: friendsData } = await supabase
        .from('user_friends')
        .select(`
          user_id,
          friend_id,
          user_profiles!user_friends_friend_id_fkey (
            id,
            display_name,
            username,
            profile_photo_url
          ),
          friend_profiles:user_profiles!user_friends_user_id_fkey (
            id,
            display_name,
            username,
            profile_photo_url
          )
        `)
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (friendsData) {
        friendsData.forEach((friendship: any) => {
          const friendProfile = friendship.user_id === user.id 
            ? friendship.user_profiles 
            : friendship.friend_profiles;

          if (friendProfile) {
            stories.push({
              id: friendProfile.id,
              type: 'friend_profile',
              name: friendProfile.display_name || friendProfile.username || 'Friend',
              username: friendProfile.username,
              image: friendProfile.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
              hasStory: false
            });
          }
        });
      }

      return stories;
    },
    enabled: !!user,
  });

  return { stories, loading };
};
