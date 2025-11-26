import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SocialUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  homeClub: string | null;
  handicapIndex: number | null;
}

export function useFollowers(profileUserId: string | undefined) {
  return useQuery({
    queryKey: ['followers-list', profileUserId],
    enabled: !!profileUserId,
    queryFn: async (): Promise<SocialUser[]> => {
      if (!profileUserId) return [];

      // Get user_follows rows where this user is being followed
      const { data: followsData, error: followsError } = await supabase
        .from('user_follows')
        .select('follower_id')
        .eq('following_id', profileUserId);

      if (followsError) {
        console.error('Error fetching followers:', followsError);
        throw followsError;
      }

      if (!followsData || followsData.length === 0) return [];

      const followerIds = followsData.map(f => f.follower_id);

      // Fetch profiles for all followers
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, username, display_name, profile_photo_url, home_club, eg_handicap_index')
        .in('id', followerIds);

      if (profilesError) {
        console.error('Error fetching follower profiles:', profilesError);
        throw profilesError;
      }

      return (profiles || []).map(profile => ({
        id: profile.id,
        username: profile.username || '',
        displayName: profile.display_name || 'User',
        avatarUrl: profile.profile_photo_url,
        homeClub: profile.home_club,
        handicapIndex: profile.eg_handicap_index
      }));
    },
    staleTime: 30_000,
  });
}

export function useFollowing(profileUserId: string | undefined) {
  return useQuery({
    queryKey: ['following-list', profileUserId],
    enabled: !!profileUserId,
    queryFn: async (): Promise<SocialUser[]> => {
      if (!profileUserId) return [];

      // Get user_follows rows where this user is following others
      const { data: followsData, error: followsError } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', profileUserId);

      if (followsError) {
        console.error('Error fetching following:', followsError);
        throw followsError;
      }

      if (!followsData || followsData.length === 0) return [];

      const followingIds = followsData.map(f => f.following_id);

      // Fetch profiles for all following
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, username, display_name, profile_photo_url, home_club, eg_handicap_index')
        .in('id', followingIds);

      if (profilesError) {
        console.error('Error fetching following profiles:', profilesError);
        throw profilesError;
      }

      return (profiles || []).map(profile => ({
        id: profile.id,
        username: profile.username || '',
        displayName: profile.display_name || 'User',
        avatarUrl: profile.profile_photo_url,
        homeClub: profile.home_club,
        handicapIndex: profile.eg_handicap_index
      }));
    },
    staleTime: 30_000,
  });
}

export function useFriends(profileUserId: string | undefined) {
  return useQuery({
    queryKey: ['friends-list', profileUserId],
    enabled: !!profileUserId,
    queryFn: async (): Promise<SocialUser[]> => {
      if (!profileUserId) return [];

      // Get accepted friendships where user is either party
      const { data, error } = await supabase
        .from('user_friends')
        .select('user_id, friend_id')
        .eq('status', 'accepted')
        .or(`user_id.eq.${profileUserId},friend_id.eq.${profileUserId}`);

      if (error) {
        console.error('Error fetching friends:', error);
        throw error;
      }

      if (!data || data.length === 0) return [];

      // Get the "other user" IDs (the friend, not the profile user)
      const friendIds = data.map(row => 
        row.user_id === profileUserId ? row.friend_id : row.user_id
      );

      // Fetch profiles for all friends
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, username, display_name, profile_photo_url, home_club, eg_handicap_index')
        .in('id', friendIds);

      if (profilesError) {
        console.error('Error fetching friend profiles:', profilesError);
        throw profilesError;
      }

      return (profiles || []).map(profile => ({
        id: profile.id,
        username: profile.username || '',
        displayName: profile.display_name || 'User',
        avatarUrl: profile.profile_photo_url,
        homeClub: profile.home_club,
        handicapIndex: profile.eg_handicap_index
      }));
    },
    staleTime: 30_000,
  });
}
