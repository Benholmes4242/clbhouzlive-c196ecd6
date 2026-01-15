import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isMockLiveEnabled } from '@/mocks/mockSwitch';

interface SuggestedUser {
  id: string;
  displayName: string;
  username: string;
  profileImage: string;
  bio?: string;
  followersCount: number;
  isVerified?: boolean;
  isReal: boolean; // To distinguish real vs mock users
  lastPortraitVideo?: string; // URL of their last uploaded portrait video
}

export const useSuggestedUsers = () => {
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSuggestedUsers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const useMockProfiles = isMockLiveEnabled();
      
      if (!user && !useMockProfiles) {
        setLoading(false);
        return;
      }

      if (useMockProfiles) {
        // Fetch cloned profiles from mock_profile_clones table
        const { data: mockClones, error: mockError } = await supabase
          .from('mock_profile_clones')
          .select('id, display_name, username, profile_photo_url, bio, followers_count, is_verified, profile_video_url')
          .limit(20);

        if (mockError) {
          console.error('Error fetching mock profile clones:', mockError);
          setUsers([]);
          return;
        }

        const transformedMockUsers: SuggestedUser[] = (mockClones || []).map(clone => ({
          id: clone.id,
          displayName: clone.display_name || 'User',
          username: clone.username ? `@${clone.username}` : '@user',
          profileImage: clone.profile_photo_url || 'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=100&h=100&fit=crop&crop=face',
          bio: clone.bio || '',
          followersCount: clone.followers_count || 0,
          isVerified: clone.is_verified || false,
          isReal: false, // These are mock clones
          lastPortraitVideo: clone.profile_video_url
        }));

        setUsers(transformedMockUsers);
        setLoading(false);
        return;
      }

      // Real users flow (when mock flag is false)
      const { data: realUsers, error } = await supabase
        .from('user_profiles')
        .select(`
          id,
          display_name,
          username,
          profile_photo_url,
          bio,
          profile_video_url
        `)
        .neq('id', user!.id) // Exclude current user
        .eq('is_public', true)
        .limit(15);

      // Get follower counts separately for each user
      const usersWithFollowerCounts = await Promise.all(
        (realUsers || []).map(async (profile) => {
          const { count } = await supabase
            .from('user_follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', profile.id);
          
          return {
            ...profile,
            followers_count: count || 0
          };
        })
      );

      if (error) {
        console.error('Error fetching suggested users:', error);
        setUsers([]);
        return;
      }

      // Filter out users that current user is already following
      const followedUserIds = new Set();
      const { data: followingData } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user!.id);
      
      followingData?.forEach(follow => followedUserIds.add(follow.following_id));

      const unfollowedUsers = usersWithFollowerCounts.filter(u => !followedUserIds.has(u.id));

      // Transform real users to match our interface
      const transformedRealUsers: SuggestedUser[] = unfollowedUsers.map(user => ({
        id: user.id,
        displayName: user.display_name || user.username || 'User',
        username: user.username ? `@${user.username}` : '@user',
        profileImage: user.profile_photo_url || 'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=100&h=100&fit=crop&crop=face',
        bio: user.bio || '',
        followersCount: user.followers_count || 0,
        isVerified: false,
        isReal: true,
        lastPortraitVideo: user.profile_video_url
      }));

      setUsers(transformedRealUsers);

    } catch (error) {
      console.error('Error in fetchSuggestedUsers:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestedUsers();
  }, []);

  return { users, loading, refetch: fetchSuggestedUsers };
};