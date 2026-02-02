import { supabase } from '@/integrations/supabase/client';
import type { ExploreContentItem } from '@/components/explore/types';
import { FILTER_TYPES } from '@/components/explore/types';
import type { RawPostData } from '../types';
import { buildHydrationContext } from '../utils/postHydration';
import { formatPost } from '../utils/postFormatter';
import { getStreamPoster } from '@/utils/stream';
import { isValidImageUrl } from '../../urlValidation';

/**
 * Fetch posts with Friends First global ordering using RPC
 * Friends' posts appear before non-friends' posts globally
 */
export async function fetchFriendsFirstPosts(
  currentOffset: number,
  postsPerPage: number,
  mediaFilter?: string,
  durationFilter?: { from: number; to: number | null }
): Promise<ExploreContentItem[]> {
  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser?.id) return [];

    // Determine media type for RPC
    let mediaType: string | null = null;
    if (mediaFilter === FILTER_TYPES.VIDEOS || mediaFilter === FILTER_TYPES.SHORTS) {
      mediaType = 'video';
    } else if (mediaFilter === FILTER_TYPES.PHOTOS) {
      mediaType = 'image';
    }

    // Determine duration filters
    let maxDuration: number | null = null;
    let minDuration: number | null = null;
    
    if (mediaFilter === FILTER_TYPES.SHORTS) {
      maxDuration = 180;
    } else if (durationFilter) {
      if (durationFilter.from > 0) minDuration = durationFilter.from;
      if (durationFilter.to !== null) maxDuration = durationFilter.to;
    }

    // Call RPC to get ordered post IDs
    const { data: orderedIds, error: rpcError } = await supabase.rpc('get_friends_first_post_ids', {
      p_current_user_id: currentUser.id,
      p_limit: postsPerPage,
      p_offset: currentOffset,
      p_media_type: mediaType,
      p_max_duration: maxDuration,
      p_min_duration: minDuration,
    });

    if (rpcError) {
      console.error('Error calling friends-first RPC:', rpcError);
      return [];
    }

    if (!orderedIds || orderedIds.length === 0) {
      return [];
    }

    const postIds = orderedIds.map((row: { post_id: string }) => row.post_id);
    const isFriendMap = new Map(orderedIds.map((row: { post_id: string; is_friend: boolean }) => [row.post_id, row.is_friend]));

    // Fetch full post data for these IDs
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select(`
        id,
        content,
        created_at,
        user_id,
        actor_type,
        actor_id,
        course_id,
        like_count,
        comment_count,
        categories,
        post_media!inner (
          id,
          media_type,
          media_url,
          poster_url,
          duration_seconds,
          width,
          height,
          aspect_ratio,
          media_width,
          media_height,
          image_orientation,
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
        ),
        post_likes(count),
        post_comments!post_comments_post_id_fkey(count)
      `)
      .in('id', postIds)
      .eq('status', 'published');

    if (postsError) {
      console.error('Error fetching posts by IDs:', postsError);
      return [];
    }

    if (!postsData || postsData.length === 0) {
      return [];
    }

    // Re-sort posts to match RPC order
    const postMap = new Map(postsData.map(p => [p.id, p]));
    const sortedPosts = postIds.map((id: string) => postMap.get(id)).filter(Boolean) as RawPostData[];

    // Hydrate using shared utilities
    const context = await buildHydrationContext(sortedPosts);

    // Format posts with isFollowing from RPC
    const formattedPosts = sortedPosts.map(post => {
      const formatted = formatPost(post, context, {
        isFollowing: isFriendMap.get(post.id) ?? false,
      });
      return formatted;
    }).filter((item): item is ExploreContentItem => item !== null);

    return formattedPosts;
  } catch (error) {
    console.error('Error fetching friends-first posts:', error);
    return [];
  }
}
