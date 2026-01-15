import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';

// UUID v4 detection regex
const isUuid = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

// Phase 2 Perf: Specific column selects for reduced payload
// These match the actual user_profiles table columns
const PROFILE_PAGE_SELECT = `
  id,
  username,
  display_name,
  profile_photo_url,
  bio,
  location,
  is_verified_golfer,
  is_verified_business,
  is_creator,
  created_at,
  is_public,
  home_club,
  eg_handicap_index
`;

const PROFILE_CARD_SELECT = `
  id,
  username,
  display_name,
  profile_photo_url,
  bio,
  is_verified_golfer
`;

export const useUserProfileQueries = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useSupabaseSession();

  // Fetch user profile data - supports both UUID (id) and username
  // Phase 2 Perf: Using specific column select instead of select('*')
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', username],
    queryFn: async () => {
      if (!username) return null;
      
      // Detect if param is UUID or username and query accordingly
      const query = supabase.from('user_profiles').select(PROFILE_PAGE_SELECT);
      const { data, error } = await (isUuid(username) 
        ? query.eq('id', username) 
        : query.eq('username', username)
      ).single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!username
  });

  // Fetch current user profile data
  // Phase 2 Perf: Using PROFILE_CARD for current user (less data needed)
  const { data: currentUser, isLoading: currentUserLoading } = useQuery({
    queryKey: ['current-user', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select(PROFILE_CARD_SELECT)
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching current user:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch relationship status
  const { data: relationshipStatus, isLoading: relationshipLoading } = useQuery({
    queryKey: ['relationship-status', user?.id, profile?.id],
    queryFn: async () => {
      if (!user?.id || !profile?.id || user.id === profile.id) {
        return { isFollowing: false };
      }
      
      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', profile.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching relationship status:', error);
        return { isFollowing: false };
      }
      
      return { isFollowing: !!data };
    },
    enabled: !!user?.id && !!profile?.id
  });

  const isLoading = profileLoading || currentUserLoading || relationshipLoading;

  return {
    profile,
    currentUser,
    relationshipStatus,
    isLoading
  };
};