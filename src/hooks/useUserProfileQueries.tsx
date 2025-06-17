
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export const useUserProfileQueries = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useSupabaseSession();

  // Fetch the user profile by username or ID
  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile', username],
    queryFn: async () => {
      if (!username) return null;
      
      // First try to find by username
      let { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('username', username)
        .eq('is_public', true)
        .maybeSingle();
      
      // If not found by username, try to find by ID (fallback for users without usernames)
      if (!data && !error) {
        const { data: idData, error: idError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', username)
          .eq('is_public', true)
          .maybeSingle();
        
        data = idData;
        error = idError;
      }
      
      if (error) throw error;
      return data;
    },
    enabled: !!username,
  });

  // Check relationship status with current user
  const { data: relationshipStatus } = useQuery({
    queryKey: ['relationshipStatus', currentUser?.id, profile?.id],
    queryFn: async () => {
      if (!currentUser?.id || !profile?.id || currentUser.id === profile.id) return null;
      
      // Check if following
      const { data: followData } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('following_id', profile.id)
        .maybeSingle();

      // Check friend status - look for bidirectional relationships
      const { data: friendData } = await supabase
        .from('user_friends')
        .select('status')
        .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${profile.id}),and(user_id.eq.${profile.id},friend_id.eq.${currentUser.id})`)
        .maybeSingle();

      // Properly type the friend status
      const friendStatus = friendData?.status;
      const validFriendStatus: 'pending' | 'accepted' | null = 
        friendStatus === 'pending' || friendStatus === 'accepted' ? friendStatus as 'pending' | 'accepted' : null;

      return {
        isFollowing: !!followData,
        friendStatus: validFriendStatus
      };
    },
    enabled: !!currentUser?.id && !!profile?.id && currentUser.id !== profile.id,
  });

  return {
    profile,
    isLoading,
    relationshipStatus,
    currentUser
  };
};
