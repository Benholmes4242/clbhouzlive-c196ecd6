import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

  const fetchSuggestedUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        setUsers([]);
        return;
      }

      console.log('Current user ID:', currentUser.id);

      // Get users with their latest posts and media, excluding current user
      const { data: usersWithPosts, error: usersError } = await supabase
        .from('user_profiles')
        .select(`
          id,
          display_name,
          username,
          profile_photo_url,
          home_club,
          eg_handicap_index
        `)
        .neq('id', currentUser.id)
        .eq('is_public', true)
        .limit(50);

      console.log('Fetched users (excluding current):', usersWithPosts?.length, usersWithPosts?.map(u => ({ id: u.id, name: u.display_name })));

      // Get posts separately due to relation issues
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
        .in('user_id', (usersWithPosts || []).map(u => u.id))
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Error fetching users:', usersError);
        setError('Failed to fetch users');
        return;
      }

      // Get current user's following list
      const { data: followingData } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', currentUser.id);

      const followingIds = new Set(followingData?.map(f => f.following_id) || []);

      // Process users and find their latest media - only include users with actual posts
      const processedUsers: SuggestedUserMedia[] = (usersWithPosts || [])
        .map(user => {
          // Additional safety check: never include current user
          if (user.id === currentUser.id) {
            console.log('WARNING: Current user found in results, filtering out:', user.id);
            return null;
          }

          // Find user's posts with media
          const userPosts = (postsData || [])
            .filter(post => post.user_id === user.id && post.post_media && post.post_media.length > 0)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

          // Skip users with no posts (exclude users with zero posts requirement)
          if (!userPosts || userPosts.length === 0) {
            console.log('Filtering out user with no media posts:', user.display_name || user.username);
            return null;
          }

          const latestPost = userPosts[0];
          const latestMedia = latestPost.post_media[0];

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
            isFollowing: followingIds.has(user.id),
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

      // Apply 5:1 ratio: 5 not-followed for every 1 followed
      const notFollowed = processedUsers.filter(u => !u.isFollowing);
      const followed = processedUsers.filter(u => u.isFollowing);
      
      const balanced: SuggestedUserMedia[] = [];
      let notFollowedIndex = 0;
      let followedIndex = 0;

      while (notFollowedIndex < notFollowed.length || followedIndex < followed.length) {
        // Add 5 not-followed users
        for (let i = 0; i < 5 && notFollowedIndex < notFollowed.length; i++) {
          balanced.push(notFollowed[notFollowedIndex++]);
        }
        
        // Add 1 followed user
        if (followedIndex < followed.length) {
          balanced.push(followed[followedIndex++]);
        }
      }

      // Limit to 30 users for performance
      const finalUsers = balanced.slice(0, 30);
      
      // Final safety check - log if current user somehow made it through
      const currentUserInResults = finalUsers.find(u => u.id === currentUser.id);
      if (currentUserInResults) {
        console.error('CRITICAL: Current user found in final results!', currentUserInResults);
      }
      
      console.log('Final suggested users:', finalUsers.length, finalUsers.map(u => ({ id: u.id, name: u.displayName })));
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
            following_id: userId
          });

        if (error) {
          console.error('Error following user:', error);
          return false;
        }
      }

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, isFollowing: !user.isFollowing }
          : user
      ));

      return true;
    } catch (error) {
      console.error('Error in toggleFollow:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchSuggestedUsers();
  }, []);

  return {
    users,
    loading,
    error,
    toggleFollow,
    refetch: fetchSuggestedUsers
  };
};