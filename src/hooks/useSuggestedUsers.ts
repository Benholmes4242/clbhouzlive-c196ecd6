import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useDiscoveryExclusions } from './useDiscoveryExclusions';
import { isMockLiveEnabled } from '@/mocks/mockSwitch';

interface SuggestedUser {
  id: string;
  displayName: string;
  username: string;
  profileImage: string;
  bio?: string;
  followersCount: number;
  isVerified?: boolean;
  isReal: boolean;
  lastPortraitVideo?: string;
}

export const useSuggestedUsers = () => {
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const queryClient = useQueryClient();

  // Get exclusion data from the centralized hook
  const { data: exclusions, isLoading: exclusionsLoading } = useDiscoveryExclusions(currentUserId);

  // Fetch current user on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id);
    };
    fetchCurrentUser();
  }, []);

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
          isReal: false,
          lastPortraitVideo: clone.profile_video_url
        }));

        setUsers(transformedMockUsers);
        setLoading(false);
        return;
      }

      // Wait for exclusions to be ready for real users
      if (!exclusions) {
        console.log('Waiting for exclusions data...');
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
        .neq('id', user!.id)
        .eq('is_public', true)
        .limit(50); // Fetch more to account for filtering

      if (error) {
        console.error('Error fetching suggested users:', error);
        setUsers([]);
        return;
      }

      // Filter out all excluded users (followed, friends, pending requests, blocked)
      const eligibleUsers = (realUsers || []).filter(u => !exclusions.excludedIds.has(u.id));

      console.log('Users after exclusion filtering:', eligibleUsers.length, 'from', realUsers?.length);

      // Get follower counts for eligible users only
      const usersWithFollowerCounts = await Promise.all(
        eligibleUsers.map(async (profile) => {
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

      // Transform real users to match our interface
      const transformedRealUsers: SuggestedUser[] = usersWithFollowerCounts.map(user => ({
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

      // Limit to 15 users
      setUsers(transformedRealUsers.slice(0, 15));

    } catch (error) {
      console.error('Error in fetchSuggestedUsers:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Refetch when exclusions change
  useEffect(() => {
    if (currentUserId && exclusions && !exclusionsLoading) {
      fetchSuggestedUsers();
    } else if (isMockLiveEnabled()) {
      // For mock mode, fetch immediately
      fetchSuggestedUsers();
    }
  }, [currentUserId, exclusions, exclusionsLoading]);

  const invalidateAndRefetch = () => {
    queryClient.invalidateQueries({ queryKey: ['discovery-exclusions'] });
    fetchSuggestedUsers();
  };

  return { users, loading: loading || exclusionsLoading, refetch: invalidateAndRefetch };
};
