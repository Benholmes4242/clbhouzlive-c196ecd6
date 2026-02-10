import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ExploreContentItem } from '@/components/explore/types';
import { isValidImageUrl } from '@/hooks/explore/urlValidation';
import { useActiveActor } from '@/context/ActiveActorContext';

export type CommunityMediaFilter = 'all' | 'shorts' | 'videos' | 'photos';
export type CommunitySortOption = 'newest' | 'most-liked' | 'most-discussed' | 'friends-first';

// Match section pages - 10 per load
const PAGE_SIZE = 10;

export interface CommunityContentItem extends ExploreContentItem {
  relationshipType: 'friend' | 'following';
  createdAt: string;
  likeCount: number;
  commentCount: number;
  categories?: string[]; // Category IDs from posts.categories[]
  // Review-specific fields
  isReview?: boolean;
  sourceReviewId?: string | null;
  reviewRating?: number | null;
  reviewTitle?: string | null;
}

interface UseCommunityFeedOptions {
  mediaFilter?: CommunityMediaFilter;
  sortOption?: CommunitySortOption;
}

/**
 * useCommunityFeed - Returns posts from the active actor's community
 * 
 * For personal actors:
 * - Friends (mutual)
 * - Users they follow
 * - Businesses they follow
 * 
 * For business actors:
 * - Entities they follow via business_outbound_follows
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
  const [error, setError] = useState<Error | null>(null);
  const [communityCount, setCommunityCount] = useState({ friends: 0, following: 0 });
  const { activeActor } = useActiveActor();

  const actorType = activeActor?.type || 'personal';
  const actorId = activeActor?.id || '';

  const load = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const nextOffset = reset ? 0 : offset;

      let friendIds = new Set<string>();
      let followedUserIds = new Set<string>();
      let followedBusinessIds = new Set<string>();

      if (actorType === 'business' && actorId) {
        // Business actor: get outbound follows
        const { data: outboundFollows } = await supabase
          .from('business_outbound_follows')
          .select('following_type, following_id')
          .eq('follower_business_id', actorId);

        outboundFollows?.forEach(f => {
          if (f.following_type === 'personal') {
            followedUserIds.add(f.following_id);
          } else if (f.following_type === 'business') {
            followedBusinessIds.add(f.following_id);
          }
        });

        // Business actors don't have friends
      } else {
        // Personal actor: get friends, followed users, followed businesses
        
        // Get friend IDs (accepted friendships)
        const { data: friendships } = await supabase
          .from('user_friends')
          .select('friend_id, user_id')
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
          .eq('status', 'accepted');

        (friendships ?? []).forEach(f => {
          if (f.user_id === user.id) friendIds.add(f.friend_id);
          else friendIds.add(f.user_id);
        });

        // Get followed user IDs
        const { data: following } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id);

        (following ?? []).map(f => followedUserIds.add(f.following_id));

        // Get followed business IDs
        const { data: businessFollows } = await supabase
          .from('business_follows')
          .select('business_id')
          .eq('follower_id', user.id);

        (businessFollows ?? []).map(f => followedBusinessIds.add(f.business_id));
      }

      // Combine personal community = friends + following users (excluding self)
      const communityUserIds = new Set([...friendIds, ...followedUserIds]);
      communityUserIds.delete(user.id);

      setCommunityCount({ friends: friendIds.size, following: followedUserIds.size + followedBusinessIds.size });

      console.log('[useCommunityFeed] 🔍 QUERY:', {
        pageSize: PAGE_SIZE,
        offset: nextOffset,
        communityUserIdsCount: communityUserIds.size,
        communityBusinessIdsCount: followedBusinessIds.size,
        actorType,
        mediaFilter,
        sortOption
      });

      if (communityUserIds.size === 0 && followedBusinessIds.size === 0) {
        console.log('[useCommunityFeed] 📊 RESULT: No community members found');
        setItems([]);
        setHasMore(false);
        setLoading(false);
        return;
      }

      // Build query with aggregated counts - include categories for filtering
      // Also fetch review data via source_review_id and course data via course_id
      let query = supabase
        .from('posts')
        .select(`
          id, content, created_at, user_id, badges, categories, actor_type, actor_id, source_review_id, course_id, visibility,
          post_media (id, media_type, media_url, duration_seconds, width, height, display_order),
          post_likes (count),
          post_comments!post_comments_post_id_fkey (count),
          course_ratings:source_review_id (
            id,
            rating,
            title,
            review,
            course_review_media (id, media_type, media_url, duration_seconds, width, height)
          ),
          golf_courses!posts_course_id_fkey (id, name, country, sub_country, region)
        `);

      // Fix 1: Include friends-only posts from friends + public posts from all followed
      // Build the actor + visibility filter
      const orConditions: string[] = [];
      
      if (communityUserIds.size > 0) {
        // Public posts from anyone we follow/are friends with
        orConditions.push(`and(actor_type.eq.personal,actor_id.in.(${Array.from(communityUserIds).join(',')}),visibility.eq.anyone)`);
      }
      
      if (friendIds.size > 0) {
        // Friends-only posts from friends specifically
        orConditions.push(`and(actor_type.eq.personal,actor_id.in.(${Array.from(friendIds).join(',')}),visibility.eq.friends)`);
      }
      
      if (followedBusinessIds.size > 0) {
        // Posts from business profiles we follow (always public)
        orConditions.push(`and(actor_type.eq.business,actor_id.in.(${Array.from(followedBusinessIds).join(',')}),visibility.eq.anyone)`);
      }

      if (orConditions.length > 0) {
        query = query.or(orConditions.join(','));
      }

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
      const { data: posts, error: queryError } = await query.range(nextOffset, nextOffset + PAGE_SIZE - 1);

      console.log('[useCommunityFeed] 📊 RESULT:', {
        postsReturned: posts?.length || 0,
        hasMore: (posts?.length || 0) === PAGE_SIZE,
        error: queryError?.message
      });

      if (queryError) throw queryError;

      // Get user profiles for personal actors
      const userActorIds = [...new Set((posts ?? [])
        .filter(p => p.actor_type === 'personal')
        .map(p => p.actor_id))];
      
      let profileMap = new Map<string, { display_name: string | null; username: string | null; profile_photo_url: string | null }>();
      if (userActorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, display_name, username, profile_photo_url')
          .in('id', userActorIds);
        
        profileMap = new Map((profiles || []).map(p => [p.id, p]));
      }

      // Get business profiles for business actors
      const businessActorIds = [...new Set((posts ?? [])
        .filter(p => p.actor_type === 'business')
        .map(p => p.actor_id))];
      
      let businessMap = new Map<string, { name: string; logo_url: string | null }>();
      if (businessActorIds.length > 0) {
        const { data: businesses } = await supabase
          .from('business_accounts')
          .select('id, name, logo_url')
          .in('id', businessActorIds);
        
        businessMap = new Map((businesses || []).map(b => [b.id, b]));
      }

      // Map and filter posts - use aggregated counts from query
      let mappedItems = (posts ?? [])
        .map((post): CommunityContentItem | null => {
          // Combine post_media and course_review_media for reviews
          const courseRating = (post as any).course_ratings;
          const reviewMedia = courseRating?.course_review_media || [];
          const postMedia = post.post_media || [];
          
          // For reviews, prioritize review media; otherwise use post media
          const allMedia = reviewMedia.length > 0 ? reviewMedia : postMedia;
          const m = allMedia[0];
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

          // Get actor profile based on actor_type
          let displayName = 'User';
          let username: string | undefined;
          let avatar: string | undefined;

          if (post.actor_type === 'business') {
            const business = businessMap.get(post.actor_id);
            if (business) {
              displayName = business.name;
              avatar = business.logo_url || undefined;
            }
          } else {
            const profile = profileMap.get(post.actor_id);
            if (profile) {
              displayName = profile.display_name || profile.username || 'User';
              username = profile.username || undefined;
              avatar = profile.profile_photo_url || undefined;
            }
          }

          const isFriend = friendIds.has(post.actor_id);

          // ✅ Use aggregated counts from main query (no N+1)
          const likeCount = (post.post_likes as any)?.[0]?.count ?? 0;
          const commentCount = (post.post_comments as any)?.[0]?.count ?? 0;

          // Review detection and data extraction
          const isReview = !!(post as any).source_review_id;
          const reviewRating = courseRating?.rating ?? null;
          const reviewTitle = courseRating?.title ?? null;
          
          // Golf course data from join
          const golfCourseData = (post as any).golf_courses;
          const golfCourse = golfCourseData ? {
            id: golfCourseData.id,
            name: golfCourseData.name,
            country: golfCourseData.country,
            sub_country: golfCourseData.sub_country,
            region: golfCourseData.region,
          } : undefined;

          // Build full media array for carousel (all items)
          const mediaArray = allMedia.map((mediaItem: any) => ({
            id: mediaItem.id,
            media_type: (mediaItem.media_type === 'video' ? 'video' : 'image') as 'image' | 'video',
            media_url: mediaItem.media_url,
            width: mediaItem.width ?? undefined,
            height: mediaItem.height ?? undefined,
            display_order: mediaItem.display_order ?? undefined,
          }));

          return {
            id: post.id,
            type: kind,
            src: m.media_url,
            duration: durationSeconds ? `${durationSeconds}s` : undefined,
            durationSeconds: durationSeconds,
            createdAt: post.created_at,
            user: {
              id: post.actor_id,
              name: displayName,
              username: username,
              avatar: avatar,
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
            categories: post.categories || [], // Include categories for client-side filtering
            // Include full media array for carousel
            media: mediaArray,
            // Review fields
            isReview,
            sourceReviewId: (post as any).source_review_id ?? null,
            reviewRating,
            reviewTitle,
            golfCourse,
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
    } catch (err) {
      console.error('[useCommunityFeed] ❌ Error loading community feed:', err);
      setError(err instanceof Error ? err : new Error('Failed to load feed'));
      setLoading(false);
    }
  }, [offset, mediaFilter, sortOption, actorType, actorId]);

  // Reload when filters or actor change
  useEffect(() => {
    setItems([]);
    setOffset(0);
    setHasMore(true);
    setError(null);
    load(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaFilter, sortOption, actorType, actorId]);

  return {
    items,
    loading,
    hasMore,
    error,
    communityCount,
    loadMore: () => load(false),
    reset: () => {
      setItems([]);
      setOffset(0);
      setHasMore(true);
      setError(null);
      load(true);
    },
  };
}
