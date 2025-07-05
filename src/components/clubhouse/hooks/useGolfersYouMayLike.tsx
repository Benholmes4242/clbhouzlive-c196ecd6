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
      // First, get users who have video posts
      const { data: usersWithVideos, error: usersError } = await supabase
        .from('user_profiles')
        .select(`
          id,
          display_name,
          username,
          profile_photo_url,
          post_media!inner(
            id,
            media_url,
            post_id,
            created_at,
            posts!inner(
              user_id
            )
          )
        `)
        .eq('post_media.media_type', 'video')
        .neq('id', user.id)
        .order('post_media.created_at', { ascending: false })
        .range(currentOffset, currentOffset + ITEMS_PER_PAGE - 1);

      if (usersError) throw usersError;

      if (!usersWithVideos || usersWithVideos.length === 0) {
        setHasMore(false);
        setLoading(false);
        return;
      }

      // Process and deduplicate users, keeping only the most recent video per user
      const userMap = new Map<string, any>();
      
      usersWithVideos.forEach(user => {
        if (!userMap.has(user.id)) {
          userMap.set(user.id, {
            ...user,
            most_recent_video: user.post_media[0] // Already ordered by created_at desc
          });
        }
      });

      const uniqueUsers = Array.from(userMap.values());

      // Get follow status for these users
      const userIds = uniqueUsers.map(u => u.id);
      const { data: followData, error: followError } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .in('following_id', userIds);

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
