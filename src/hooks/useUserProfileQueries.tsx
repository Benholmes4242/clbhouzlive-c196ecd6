
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export const useUserProfileQueries = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useSupabaseSession();

  console.log('useUserProfileQueries - username:', username);
  console.log('useUserProfileQueries - currentUser:', currentUser);

  // Fetch the user profile by username or ID
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['userProfile', username],
    queryFn: async () => {
      if (!username) {
        console.log('No username provided');
        return null;
      }
      
      console.log('Fetching profile for username:', username);
      
      // First try to find by username
      let { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('username', username)
        .eq('is_public', true)
        .maybeSingle();
      
      console.log('Query by username result:', { data, error });
      
      // If not found by username, try to find by ID (fallback for users without usernames)
      if (!data && !error) {
        console.log('No data found by username, trying by ID');
        const { data: idData, error: idError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', username)
          .eq('is_public', true)
          .maybeSingle();
        
        console.log('Query by ID result:', { data: idData, error: idError });
        data = idData;
        error = idError;
      }
      
      if (error) {
        console.error('Profile query error:', error);
        throw error;
      }
      
      console.log('Final profile data:', data);
      return data;
    },
    enabled: !!username,
    retry: 3,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch current user profile to get user_type
  const { data: currentUserProfile } = useQuery({
    queryKey: ['currentUserProfile', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', currentUser.id)
        .maybeSingle();
      
      if (error) {
        console.error('Current user profile error:', error);
        throw error;
      }
      return data;
    },
    enabled: !!currentUser?.id,
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

  console.log('useUserProfileQueries - final state:', {
    profile,
    isLoading,
    error,
    relationshipStatus,
    currentUser: currentUserProfile ? { ...currentUser, ...currentUserProfile } : currentUser
  });

  return {
    profile,
    isLoading,
    relationshipStatus,
    currentUser: currentUserProfile ? { ...currentUser, ...currentUserProfile } : currentUser
  };
};
