import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ExploreContentItem } from '@/components/explore/types';
import { isValidImageUrl } from '@/hooks/explore/urlValidation';

export type CommunityMediaFilter = 'all' | 'shorts' | 'videos' | 'photos';
export type CommunitySortOption = 'newest' | 'most-liked' | 'most-discussed' | 'friends-first';

// Match section pages - 10 per load
const PAGE_SIZE = 10;

export interface CommunityContentItem extends ExploreContentItem {
  relationshipType: 'friend' | 'following';
  createdAt: string;
  likeCount: number;
  commentCount: number;
}

interface UseCommunityFeedOptions {
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

      console.log('[useCommunityFeed] 🔍 QUERY:', {
        pageSize: PAGE_SIZE,
        offset: nextOffset,
        communityIdsCount: communityIds.size,
        mediaFilter,
        sortOption
      });

      if (communityIds.size === 0) {
        console.log('[useCommunityFeed] 📊 RESULT: No community members found');
        setItems([]);
        setHasMore(false);
        setLoading(false);
        return;
      }

      // Build query with aggregated counts
      let query = supabase
        .from('posts')
        .select(`
          id, content, created_at, user_id, badges,
          post_media (id, media_type, media_url, duration_seconds, width, height),
          post_likes (count),
          post_comments (count)
        `)
        .in('user_id', Array.from(communityIds))
        .eq('visibility', 'anyone'); // ✅ Only public posts

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

      // Fetch exact PAGE_SIZE (no overfetch)
      const { data: posts, error } = await query.range(nextOffset, nextOffset + PAGE_SIZE - 1);

      console.log('[useCommunityFeed] 📊 RESULT:', {
        postsReturned: posts?.length || 0,
        hasMore: (posts?.length || 0) === PAGE_SIZE,
        error: error?.message
      });

      if (error) throw error;

      // Get user profiles
      const userIds = [...new Set((posts ?? []).map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .in('id', userIds);

      // Map and filter posts - use aggregated counts from query
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

          // ✅ Use aggregated counts from main query (no N+1)
          const likeCount = (post.post_likes as any)?.[0]?.count ?? 0;
          const commentCount = (post.post_comments as any)?.[0]?.count ?? 0;

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
            likes: likeCount,
            comments: commentCount,
            shares: 0,
            isFollowing: true,
            relationshipType: isFriend ? 'friend' : 'following',
            likeCount,
            commentCount,
            badges: post.badges || [],
          };
        })
        .filter(Boolean) as CommunityContentItem[];

      // Special sort for "friends first"
      if (sortOption === 'friends-first') {
        const friendPosts = mappedItems.filter(i => i.relationshipType === 'friend');
        const followedPosts = mappedItems.filter(i => i.relationshipType === 'following');
        mappedItems = [...friendPosts, ...followedPosts];
      }

      // ✅ hasMore based on PAGE_SIZE
      const newHasMore = (posts?.length || 0) === PAGE_SIZE;

      setItems(prev => reset ? mappedItems : [...prev, ...mappedItems]);
      setHasMore(newHasMore);
      setOffset(nextOffset + PAGE_SIZE);
      setLoading(false);
    } catch (error) {
      console.error('[useCommunityFeed] ❌ Error loading community feed:', error);
      setLoading(false);
    }
  }, [offset, mediaFilter, sortOption]);

  // Reload when filters change
  useEffect(() => {
    setItems([]);
    setOffset(0);
    setHasMore(true);
    load(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
