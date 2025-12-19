import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ExploreContentItem } from '@/components/explore/types';
import { isValidImageUrl } from './urlValidation';

/**
 * useUnifiedFollowingFeed - Returns a single chronological feed
 * 
 * Phase 4 requirements:
 * - One feed, one scroll
 * - Chronological-first
 * - Videos, photos, moments interleaved naturally by timestamp
 * - No discovery injection
 */
export function useUnifiedFollowingFeed(pageSize = 20) {
  const [items, setItems] = useState<ExploreContentItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [followingCount, setFollowingCount] = useState(0);

  const load = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const nextOffset = reset ? 0 : offset;

      // Get followed user ids
      const { data: following, error: fErr } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (fErr) throw fErr;
      const followedIds = (following ?? []).map(f => f.following_id);
      setFollowingCount(followedIds.length);
      
      if (followedIds.length === 0) {
        setItems([]);
        setHasMore(false);
        setLoading(false);
        return;
      }

      // Fetch ALL posts (videos + photos) in one query, ordered chronologically
      const { data: posts, error: pErr } = await supabase
        .from('posts')
        .select(`
          id, content, created_at, user_id,
          post_media (id, media_type, media_url, duration_seconds, width, height)
        `)
        .in('user_id', followedIds)
        .order('created_at', { ascending: false })
        .range(nextOffset, nextOffset + pageSize - 1);

      if (pErr) throw pErr;

      // Get unique user IDs
      const userIds = [...new Set((posts ?? []).map(post => post.user_id))];
      
      // Get user profiles
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .in('id', userIds);

      const mapPost = (post: any): ExploreContentItem | null => {
        const m = post.post_media?.[0];
        if (!m) return null;
        
        const kind = m.media_type === 'video' ? 'video' : 'image';
        
        const isValid =
          (kind === 'image' && isValidImageUrl(m.media_url)) ||
          (kind === 'video' && !!m.media_url);
          
        if (!isValid) return null;

        const userProfile = profiles?.find(p => p.id === post.user_id);
        
        return {
          id: post.id,
          type: kind,
          src: m.media_url,
          duration: m.duration_seconds ? `${m.duration_seconds}s` : undefined,
          durationSeconds: m.duration_seconds ?? undefined,
          createdAt: post.created_at,
          user: {
            id: post.user_id,
            name: userProfile?.display_name || userProfile?.username || 'User',
            username: userProfile?.username || undefined,
            avatar: userProfile?.profile_photo_url || undefined,
          },
          title: post.content || '',
          likes: 0, // De-emphasized per Phase 4
          comments: 0,
          shares: 0,
          isFollowing: true,
        };
      };

      const newItems = (posts ?? [])
        .map(mapPost)
        .filter(Boolean) as ExploreContentItem[];

      setItems(prev => reset ? newItems : [...prev, ...newItems]);
      setHasMore((posts ?? []).length === pageSize);
      setOffset(nextOffset + pageSize);
      setLoading(false);
    } catch (error) {
      console.error('Error loading unified following feed:', error);
      setLoading(false);
    }
  }, [offset, pageSize]);

  useEffect(() => {
    load(true);
  }, []); // Initial load

  return {
    items,
    loading,
    hasMore,
    followingCount,
    loadMore: () => load(false),
    reset: () => load(true),
  };
}
