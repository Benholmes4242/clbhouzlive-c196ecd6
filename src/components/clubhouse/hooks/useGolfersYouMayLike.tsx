import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface GolferProfile {
  id: string;
  display_name: string | null;
  username: string | null;
  profile_photo_url: string | null;
  most_recent_video: {
    id: string;
    media_url: string;
    post_id: string;
    created_at: string;
  };
  is_following: boolean;
}

const ITEMS_PER_PAGE = 12;

export const useGolfersYouMayLike = () => {
  const { user } = useSupabaseSession();
  const [golfers, setGolfers] = useState<GolferProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const fetchGolfers = useCallback(async (reset = false) => {
    if (!user) return;

    setLoading(true);
    const currentOffset = reset ? 0 : offset;

    try {
      // First, get video posts with their media
      const { data: videoPosts, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          created_at,
          post_media!inner(
            id,
            media_url,
            media_type,
            created_at
          )
        `)
        .eq('post_media.media_type', 'video')
        .neq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + ITEMS_PER_PAGE * 3 - 1);

      if (postsError) throw postsError;

      if (!videoPosts || videoPosts.length === 0) {
        setHasMore(false);
        setLoading(false);
        return;
      }

      // Get unique user IDs from video posts
      const userIds = [...new Set(videoPosts.map(post => post.user_id))];
      
      // Get user profiles for these users
      const { data: userProfiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Create a map of user profiles for quick lookup
      const profileMap = new Map(userProfiles?.map(profile => [profile.id, profile]) || []);
      
      // Process and deduplicate users, keeping only the most recent video per user
      const userMap = new Map<string, any>();
      
      videoPosts.forEach(post => {
        const userId = post.user_id;
        const userProfile = profileMap.get(userId);
        
        if (!userMap.has(userId) && userProfile && post.post_media.length > 0) {
          userMap.set(userId, {
            id: userId,
            display_name: userProfile.display_name,
            username: userProfile.username,
            profile_photo_url: userProfile.profile_photo_url,
            most_recent_video: {
              id: post.post_media[0].id,
              media_url: post.post_media[0].media_url,
              post_id: post.id,
              created_at: post.post_media[0].created_at
            }
          });
        }
      });

      const uniqueUsers = Array.from(userMap.values());

      // Get follow status for these users
      const followUserIds = uniqueUsers.map(u => u.id);
      const { data: followData, error: followError } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .in('following_id', followUserIds);

      if (followError) throw followError;

      const followingIds = new Set(followData?.map(f => f.following_id) || []);

      const processedGolfers: GolferProfile[] = uniqueUsers.map(golfer => ({
        id: golfer.id,
        display_name: golfer.display_name,
        username: golfer.username,
        profile_photo_url: golfer.profile_photo_url,
        most_recent_video: {
          id: golfer.most_recent_video.id,
          media_url: golfer.most_recent_video.media_url,
          post_id: golfer.most_recent_video.post_id,
          created_at: golfer.most_recent_video.created_at
        },
        is_following: followingIds.has(golfer.id)
      }));

      console.log('Processed golfers with video data:', processedGolfers.map(g => ({
        name: g.display_name || g.username,
        videoUrl: g.most_recent_video.media_url,
        hasValidVideo: !!g.most_recent_video.media_url && g.most_recent_video.media_url.length > 0
      })));

      if (reset) {
        setGolfers(processedGolfers);
      } else {
        setGolfers(prev => [...prev, ...processedGolfers]);
      }

      setOffset(currentOffset + processedGolfers.length);
      setHasMore(processedGolfers.length === ITEMS_PER_PAGE);

    } catch (error) {
      console.error('Error fetching golfers you may like:', error);
    } finally {
      setLoading(false);
    }
  }, [user, offset]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchGolfers(false);
    }
  }, [fetchGolfers, loading, hasMore]);

  useEffect(() => {
    if (user) {
      fetchGolfers(true);
    }
  }, [user]);

  return {
    golfers,
    loading,
    loadMore,
    hasMore,
    refetch: () => fetchGolfers(true)
  };
};
