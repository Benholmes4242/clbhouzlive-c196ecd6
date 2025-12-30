import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ExploreContentItem } from '@/components/explore/types';
import { isValidImageUrl } from '@/hooks/explore/urlValidation';

export type CommunityMediaFilter = 'all' | 'shorts' | 'videos' | 'photos';
export type CommunitySortOption = 'newest' | 'most-liked' | 'most-discussed' | 'friends-first';

export interface CommunityContentItem extends ExploreContentItem {
  relationshipType: 'friend' | 'following';
  createdAt: string;
  likeCount: number;
  commentCount: number;
}

interface UseCommunityFeedOptions {
  pageSize?: number;
  mediaFilter?: CommunityMediaFilter;
  sortOption?: CommunitySortOption;
}

/**
 * useCommunityFeed - Returns posts from friends AND followed users only
 * 
 * Filters:
 * - All: videos + photos
 * - Shorts: videos <= 180s
 * - Videos: all videos
 * - Photos: photos only
 * 
 * Sort:
 * - Newest first: created_at DESC
 * - Most liked: like_count DESC
 * - Most discussed: comment_count DESC
 * - Friends first: friends sorted by newest, then followed sorted by newest
 */
export function useCommunityFeed({
  pageSize = 20,
  mediaFilter = 'all',
  sortOption = 'newest',
}: UseCommunityFeedOptions = {}) {
  const [items, setItems] = useState<CommunityContentItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [communityCount, setCommunityCount] = useState({ friends: 0, following: 0 });

  const load = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const nextOffset = reset ? 0 : offset;

      // Get friend IDs (accepted friendships)
      const { data: friendships } = await supabase
        .from('user_friends')
        .select('friend_id, user_id')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');

      const friendIds = new Set<string>();
      (friendships ?? []).forEach(f => {
        if (f.user_id === user.id) friendIds.add(f.friend_id);
        else friendIds.add(f.user_id);
      });

      // Get followed user IDs
      const { data: following } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const followedIds = new Set((following ?? []).map(f => f.following_id));

      // Combine: community = friends + following (excluding self)
      const communityIds = new Set([...friendIds, ...followedIds]);
      communityIds.delete(user.id);

      setCommunityCount({ friends: friendIds.size, following: followedIds.size });

      if (communityIds.size === 0) {
        setItems([]);
        setHasMore(false);
        setLoading(false);
        return;
      }

      // Build query
      let query = supabase
        .from('posts')
        .select(`
          id, content, created_at, user_id,
          post_media (id, media_type, media_url, duration_seconds, width, height, filter_id, studio_edits)
        `)
        .in('user_id', Array.from(communityIds));

      // Apply media type filter
      // Note: We'll filter on duration client-side for shorts since post_media is a relation

      // Apply sort order
      switch (sortOption) {
        case 'most-liked':
          query = query.order('like_count', { ascending: false }).order('created_at', { ascending: false });
          break;
        case 'most-discussed':
          query = query.order('comment_count', { ascending: false }).order('created_at', { ascending: false });
          break;
        case 'newest':
        case 'friends-first':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      // Fetch more items than needed for client-side filtering
      const fetchSize = pageSize * 2;
      const { data: posts, error } = await query.range(nextOffset, nextOffset + fetchSize - 1);

      if (error) throw error;

      // Get user profiles
      const userIds = [...new Set((posts ?? []).map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .in('id', userIds);

      // Get like counts
      const postIds = (posts ?? []).map(p => p.id);
      const { data: likeCounts } = await supabase
        .from('post_likes')
        .select('post_id')
        .in('post_id', postIds);
      
      const likeMap = new Map<string, number>();
      (likeCounts ?? []).forEach((l: { post_id: string }) => {
        likeMap.set(l.post_id, (likeMap.get(l.post_id) || 0) + 1);
      });

      // Get comment counts
      const { data: commentCounts } = await supabase
        .from('post_comments')
        .select('post_id')
        .in('post_id', postIds);
      
      const commentMap = new Map<string, number>();
      (commentCounts ?? []).forEach((c: { post_id: string }) => {
        commentMap.set(c.post_id, (commentMap.get(c.post_id) || 0) + 1);
      });

      // Map and filter posts
      let mappedItems = (posts ?? [])
        .map((post): CommunityContentItem | null => {
          const m = post.post_media?.[0];
          if (!m) return null;

          const kind = m.media_type === 'video' ? 'video' : 'image';
          const durationSeconds = m.duration_seconds ?? 0;

          // Apply media filter
          if (mediaFilter === 'photos' && kind !== 'image') return null;
          if (mediaFilter === 'videos' && kind !== 'video') return null;
          if (mediaFilter === 'shorts') {
            if (kind !== 'video') return null;
            if (durationSeconds > 180) return null;
          }

          const isValid =
            (kind === 'image' && isValidImageUrl(m.media_url)) ||
            (kind === 'video' && !!m.media_url);

          if (!isValid) return null;

          const userProfile = profiles?.find(p => p.id === post.user_id);
          const isFriend = friendIds.has(post.user_id);

          return {
            id: post.id,
            type: kind,
            src: m.media_url,
            duration: durationSeconds ? `${durationSeconds}s` : undefined,
            durationSeconds: durationSeconds,
            createdAt: post.created_at,
            user: {
              id: post.user_id,
              name: userProfile?.display_name || userProfile?.username || 'User',
              username: userProfile?.username || undefined,
              avatar: userProfile?.profile_photo_url || undefined,
            },
            title: post.content || '',
            likes: likeMap.get(post.id) || 0,
            comments: commentMap.get(post.id) || 0,
            shares: 0,
            isFollowing: true,
            relationshipType: isFriend ? 'friend' : 'following',
            likeCount: likeMap.get(post.id) || 0,
            commentCount: commentMap.get(post.id) || 0,
          };
        })
        .filter(Boolean) as CommunityContentItem[];

      // Special sort for "friends first"
      if (sortOption === 'friends-first') {
        const friendPosts = mappedItems.filter(i => i.relationshipType === 'friend');
        const followedPosts = mappedItems.filter(i => i.relationshipType === 'following');
        mappedItems = [...friendPosts, ...followedPosts];
      }

      // Trim to pageSize
      const finalItems = mappedItems.slice(0, pageSize);

      setItems(prev => reset ? finalItems : [...prev, ...finalItems]);
      setHasMore(finalItems.length === pageSize);
      setOffset(nextOffset + fetchSize);
      setLoading(false);
    } catch (error) {
      console.error('Error loading community feed:', error);
      setLoading(false);
    }
  }, [offset, pageSize, mediaFilter, sortOption]);

  // Reload when filters change
  useEffect(() => {
    setItems([]);
    setOffset(0);
    setHasMore(true);
    load(true);
  }, [mediaFilter, sortOption]);

  return {
    items,
    loading,
    hasMore,
    communityCount,
    loadMore: () => load(false),
    reset: () => {
      setItems([]);
      setOffset(0);
      setHasMore(true);
      load(true);
    },
  };
}
