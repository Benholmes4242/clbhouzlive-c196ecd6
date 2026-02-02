import { supabase } from '@/integrations/supabase/client';
import type { ExploreContentItem } from '@/components/explore/types';
import type { RawPostData } from '../types';
import { buildHydrationContext } from '../utils/postHydration';
import { formatPosts, deduplicatePosts } from '../utils/postFormatter';
import { passesVerticalMediaFilter, getPrimaryVideoMedia } from '../utils/verticalFilter';
import { buildVisibilityFilter } from '@/utils/visibilityFilter';
import { FEATURE_FLAGS } from '@/config/featureFlags';

/**
 * Fetch posts from friends and followed users/businesses
 */
export async function fetchFriendsPosts(
  currentOffset: number,
  postsPerPage: number
): Promise<ExploreContentItem[]> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get users that the current user follows (personal follows)
    const { data: followedUsers, error: followError } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', user.id);

    if (followError) {
      console.error('Error fetching followed users:', followError);
      return [];
    }

    const followedUserIds = followedUsers?.map(f => f.following_id) || [];
    
    // Get businesses that the current user follows
    const { data: followedBusinesses, error: businessFollowError } = await supabase
      .from('business_follows')
      .select('business_id')
      .eq('follower_id', user.id);
      
    if (businessFollowError) {
      console.error('Error fetching followed businesses:', businessFollowError);
    }
    
    const followedBusinessIds = followedBusinesses?.map(f => f.business_id) || [];
    
    if (followedUserIds.length === 0 && followedBusinessIds.length === 0) {
      return [];
    }

    // Build query filters for polymorphic following
    const orFilters: string[] = [];
    if (followedUserIds.length > 0) {
      orFilters.push(`and(or(actor_type.eq.personal,actor_type.is.null),user_id.in.(${followedUserIds.join(',')}))`);
    }
    if (followedBusinessIds.length > 0) {
      orFilters.push(`and(actor_type.eq.business,actor_id.in.(${followedBusinessIds.join(',')}))`);
    }

    // Build the query
    let query = supabase
      .from('posts')
      .select(`
        id,
        content,
        created_at,
        user_id,
        actor_type,
        actor_id,
        course_id,
        categories,
        badges,
        post_media!inner (
          id,
          media_type,
          media_url,
          poster_url,
          width,
          height,
          aspect_ratio,
          orientation,
          duration_seconds,
          filter_id,
          studio_edits
        ),
        post_tags (
          id,
          tagged_entity_id,
          taggable_entities (
            id,
            entity_type,
            entity_id,
            name
          )
        )
      `);

    // Add visibility filter
    const visibilityFilter = buildVisibilityFilter(user.id);
    
    query = query
      .or(orFilters.join(','))
      .or(visibilityFilter)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(currentOffset, currentOffset + postsPerPage - 1)
      .limit(postsPerPage);

    const { data: postsData, error } = await query;

    if (error) {
      console.error('Error fetching friends posts:', error);
      return [];
    }

    if (!postsData || postsData.length === 0) {
      return [];
    }

    // Apply vertical filter if needed
    let filteredPosts = postsData as unknown as RawPostData[];
    if (FEATURE_FLAGS.CLUBHOUSE_VERTICAL_ONLY) {
      filteredPosts = filteredPosts.filter(post => {
        const primaryMedia = getPrimaryVideoMedia(post);
        if (!primaryMedia) return false;
        return passesVerticalMediaFilter(primaryMedia, true);
      });
    }

    // Hydrate and format using shared utilities
    const context = await buildHydrationContext(filteredPosts);
    const formattedPosts = formatPosts(filteredPosts, context, { isFollowing: true });

    return deduplicatePosts(formattedPosts);
  } catch (error) {
    console.error('Error fetching friends posts:', error);
    return [];
  }
}
