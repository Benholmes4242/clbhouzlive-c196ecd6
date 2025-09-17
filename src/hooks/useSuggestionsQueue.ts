import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SuggestedUser {
  id: string;
  displayName: string;
  username?: string;
  avatarUrl?: string;
  primaryClub?: string;
  handicap?: number | null;
  isFollowing: boolean;
  mutualsCount?: number;
  previewMedia?: { 
    type: 'photo' | 'video'; 
    url: string; 
    poster?: string; 
  };
  latestPostAt: string;
}

interface UseSuggestionsQueue {
  queue: SuggestedUser[];
  loading: boolean;
  error?: string;
  follow: (userId: string) => Promise<void>;
  dismiss: (userId: string) => Promise<void>;
  prefetchIfLow: () => Promise<void>;
  refetch: () => Promise<void>;
}

export const useSuggestionsQueue = (): UseSuggestionsQueue => {
  const [queue, setQueue] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const fetchSuggestions = useCallback(async (cursor?: string) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return [];

      // Get dismissed user IDs that haven't expired
      const { data: dismissedData } = await supabase
        .from('user_suggestion_dismissals')
        .select('dismissed_user_id')
        .eq('user_id', currentUser.id)
        .gt('expires_at', new Date().toISOString());

      const dismissedUserIds = dismissedData?.map(d => d.dismissed_user_id) || [];
      
      // Get users with their latest posts and media, excluding current user and dismissed users
      let query = supabase
        .from('user_profiles')
        .select(`
          id,
          display_name,
          username,
          profile_photo_url
        `)
        .neq('id', currentUser.id)
        .eq('is_public', true);

      // Only add the not.in filter if there are dismissed users
      if (dismissedUserIds.length > 0) {
        query = query.not('id', 'in', `(${dismissedUserIds.join(',')})`);
      }

      const { data: usersWithPosts, error: usersError } = await query.limit(50);

      if (usersError) {
        console.error('Error fetching users:', usersError);
        return [];
      }

      // Get posts separately
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

      // Get current user's following list
      const { data: followingData } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', currentUser.id);

      const followingIds = new Set(followingData?.map(f => f.following_id) || []);

      // Process users and find their latest media
      const processedUsers: SuggestedUser[] = (usersWithPosts || [])
        .map(user => {
          if (user.id === currentUser.id) return null;

          const userPosts = (postsData || [])
            .filter(post => post.user_id === user.id && post.post_media && post.post_media.length > 0)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

          if (!userPosts || userPosts.length === 0) return null;

          const latestPost = userPosts[0];
          const videoMedia = latestPost.post_media.find(m => m.media_type === 'video');
          const photoMedia = latestPost.post_media.find(m => m.media_type === 'image');

          let previewMedia = undefined;
          if (videoMedia) {
            previewMedia = {
              type: 'video' as const,
              url: videoMedia.media_url,
              poster: videoMedia.poster_url || undefined
            };
          } else if (photoMedia) {
            previewMedia = {
              type: 'photo' as const,
              url: photoMedia.media_url
            };
          }

          return {
            id: user.id,
            displayName: user.display_name || user.username || 'User',
            username: user.username ? `@${user.username}` : '@user',
            avatarUrl: user.profile_photo_url || undefined,
            isFollowing: followingIds.has(user.id),
            previewMedia,
            latestPostAt: latestPost.created_at
          };
        })
        .filter(Boolean) as SuggestedUser[];

      // Sort by latest post time
      processedUsers.sort((a, b) => 
        new Date(b.latestPostAt).getTime() - new Date(a.latestPostAt).getTime()
      );

      // Apply 5:1 ratio: 5 not-followed for every 1 followed
      const notFollowed = processedUsers.filter(u => !u.isFollowing);
      const followed = processedUsers.filter(u => u.isFollowing);
      
      const balanced: SuggestedUser[] = [];
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

      return balanced.slice(0, 30);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      return [];
    }
  }, []);

  const loadInitialSuggestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const suggestions = await fetchSuggestions();
      setQueue(suggestions);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      setError('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  }, [fetchSuggestions]);

  const follow = useCallback(async (userId: string) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      // Optimistic update
      setQueue(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, isFollowing: true }
          : user
      ));

      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: currentUser.id,
          following_id: userId
        });

      if (error) {
        // Rollback on error
        setQueue(prev => prev.map(user => 
          user.id === userId 
            ? { ...user, isFollowing: false }
            : user
        ));
        toast.error('Failed to follow user');
        console.error('Error following user:', error);
      } else {
        toast.success('User followed!');
      }
    } catch (error) {
      console.error('Error in follow:', error);
      toast.error('Failed to follow user');
    }
  }, []);

  const dismiss = useCallback(async (userId: string) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      // Remove from queue immediately
      setQueue(prev => prev.filter(user => user.id !== userId));
      setDismissedIds(prev => new Set([...prev, userId]));

      // Call API to persist dismissal with 14-day TTL
      const { error } = await supabase
        .from('user_suggestion_dismissals')
        .insert({
          user_id: currentUser.id,
          dismissed_user_id: userId,
          expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days
        });

      if (error) {
        console.error('Error dismissing user:', error);
        // Don't revert UI - dismissal should work locally even if API fails
      }

      // Prefetch if queue is getting low
      if (queue.length <= 8) {
        prefetchIfLow();
      }
    } catch (error) {
      console.error('Error in dismiss:', error);
    }
  }, [queue.length]);

  const prefetchIfLow = useCallback(async () => {
    if (queue.length <= 8) {
      try {
        const newSuggestions = await fetchSuggestions();
        const filteredSuggestions = newSuggestions.filter(
          suggestion => !dismissedIds.has(suggestion.id) && 
          !queue.some(existing => existing.id === suggestion.id)
        );
        
        setQueue(prev => [...prev, ...filteredSuggestions]);
      } catch (error) {
        console.error('Error prefetching suggestions:', error);
      }
    }
  }, [queue.length, dismissedIds, fetchSuggestions]);

  useEffect(() => {
    loadInitialSuggestions();
  }, [loadInitialSuggestions]);

  return {
    queue,
    loading,
    error: error || undefined,
    follow,
    dismiss,
    prefetchIfLow,
    refetch: loadInitialSuggestions
  };
};