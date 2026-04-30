import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useDiscoveryExclusions } from './useDiscoveryExclusions';

interface SuggestedUserMedia {
  id: string;
  displayName: string;
  handle: string;
  isFollowing: boolean;
  profilePhotoUrl?: string;
  homeClub?: string;
  handicap?: number;
  latestVideo?: {
    url: string;
    poster?: string;
  };
  latestPhoto?: {
    url: string;
  };
  latestPostAt: string;
}

export const useSuggestedUsersDiscover = () => {
  const [users, setUsers] = useState<SuggestedUserMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      setLoading(true);
      setError(null);

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        setUsers([]);
        return;
      }

      // Wait for exclusions to be ready
      if (!exclusions) {
        console.log('Waiting for exclusions data...');
        return;
      }

      console.log('Current user ID:', currentUser.id);
      console.log('Excluded IDs count:', exclusions.excludedIds.size);

      // Get users with their latest posts and media, excluding current user
      const { data: usersWithPosts, error: usersError } = await supabase
        .from('user_profiles')
        .select(`
          id,
          display_name,
          username,
          profile_photo_url,
          home_club,
          eg_handicap_index,
          created_at
        `)
        .neq('id', currentUser.id)
        .eq('is_public', true)
        .is('deleted_at', null)
        .not('profile_photo_url', 'is', null)
        .limit(100); // Fetch more to account for filtering

      if (usersError) {
        console.error('Error fetching users:', usersError);
        setError('Failed to fetch users');
        return;
      }

      // Filter out all excluded users (followed, friends, pending requests, blocked)
      const eligibleUsers = (usersWithPosts || []).filter(user => !exclusions.excludedIds.has(user.id));

      console.log('Users after exclusion filtering:', eligibleUsers.length, 'from', usersWithPosts?.length);

      if (eligibleUsers.length === 0) {
        setUsers([]);
        return;
      }

      // Get posts separately for eligible users only
      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          created_at,
          post_media (
            id,
            media_type,
            media_url,
            poster_url
          )
        `)
        .in('user_id', eligibleUsers.map(u => u.id))
        .order('created_at', { ascending: false });

      // Process users and find their latest media - only include users with actual posts
      const processedUsers: SuggestedUserMedia[] = eligibleUsers
        .map(user => {
          // Find user's posts with media
          const userPosts = (postsData || [])
            .filter(post => post.user_id === user.id && post.post_media && post.post_media.length > 0)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

          // No posts — still show the user, just no media preview
          if (!userPosts || userPosts.length === 0) {
            return {
              id: user.id,
              displayName: user.display_name || user.username || 'User',
              handle: user.username ? `@${user.username}` : '@user',
              isFollowing: false,
              profilePhotoUrl: user.profile_photo_url || undefined,
              homeClub: user.home_club || undefined,
              handicap: user.eg_handicap_index || undefined,
              latestVideo: undefined,
              latestPhoto: undefined,
              latestPostAt: user.created_at || new Date().toISOString(),
            };
          }

          const latestPost = userPosts[0];

          let latestVideo = undefined;
          let latestPhoto = undefined;

          // Prefer video over photo
          const videoMedia = latestPost.post_media.find(m => m.media_type === 'video');
          const photoMedia = latestPost.post_media.find(m => m.media_type === 'image');

          if (videoMedia) {
            latestVideo = {
              url: videoMedia.media_url,
              poster: videoMedia.poster_url || undefined
            };
          } else if (photoMedia) {
            latestPhoto = {
              url: photoMedia.media_url
            };
          }

          return {
            id: user.id,
            displayName: user.display_name || user.username || 'User',
            handle: user.username ? `@${user.username}` : '@user',
            isFollowing: false, // Always false since we filtered out followed users
            profilePhotoUrl: user.profile_photo_url || undefined,
            homeClub: user.home_club || undefined,
            handicap: user.eg_handicap_index || undefined,
            latestVideo,
            latestPhoto,
            latestPostAt: latestPost.created_at
          };
        })
        .filter(Boolean) as SuggestedUserMedia[];

      // Sort by latest post time
      processedUsers.sort((a, b) => 
        new Date(b.latestPostAt).getTime() - new Date(a.latestPostAt).getTime()
      );

      // Limit to 30 users for performance
      const finalUsers = processedUsers.slice(0, 30);
      
      console.log('Final suggested users:', finalUsers.length);
      setUsers(finalUsers);

    } catch (error) {
      console.error('Error in fetchSuggestedUsers:', error);
      setError('Failed to fetch suggested users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async (userId: string): Promise<boolean> => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return false;

      const userToUpdate = users.find(u => u.id === userId);
      if (!userToUpdate) return false;

      if (userToUpdate.isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', userId);

        if (error) {
          console.error('Error unfollowing user:', error);
          return false;
        }
      } else {
        // Follow
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: currentUser.id,
            follower_actor_id: currentUser.id,
            follower_actor_type: 'personal',
            following_id: userId
          });

        if (error) {
          console.error('Error following user:', error);
          return false;
        }
      }

      // Invalidate caches to refresh exclusions and suggested users
      queryClient.invalidateQueries({ queryKey: ['discovery-exclusions'] });
      
      // Remove the user from local state immediately (they now have a relationship)
      setUsers(prev => prev.filter(user => user.id !== userId));

      return true;
    } catch (error) {
      console.error('Error in toggleFollow:', error);
      return false;
    }
  };

  // Refetch when exclusions change
  useEffect(() => {
    if (currentUserId && exclusions && !exclusionsLoading) {
      fetchSuggestedUsers();
    }
  }, [currentUserId, exclusions, exclusionsLoading]);

  return {
    users,
    loading: loading || exclusionsLoading,
    error,
    toggleFollow,
    refetch: fetchSuggestedUsers
  };
};
