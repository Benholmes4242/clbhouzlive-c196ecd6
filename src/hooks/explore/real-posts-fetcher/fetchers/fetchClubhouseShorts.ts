import { supabase } from '@/integrations/supabase/client';
import type { ExploreContentItem } from '@/components/explore/types';
import type { RawPostData, ClubhouseFetchOptions } from '../types';
import { buildHydrationContext } from '../utils/postHydration';
import { formatPost } from '../utils/postFormatter';
import { passesVerticalFilter } from '../utils/verticalFilter';
import { categorizePosts, curateFeed } from '../utils/curationAlgorithm';
import { CLUBHOUSE_FETCH_MULTIPLIER, MAX_FETCH_ITERATIONS, CLUBHOUSE_PAGE_SIZE } from '../constants';

/**
 * Clubhouse explore feed — short videos only (<120s) with curation algorithm
 */
export async function fetchClubhouseExploreShorts(
  limit: number = 30,
  cursor: string | null = null
): Promise<ExploreContentItem[]> {
  try {
    // Get current user for relationship lookups
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const currentUserId = currentUser?.id;

    // Suggested feed = pure global discovery. No relationship prioritisation.
    // Friends tab (fetchFriendsPosts) handles followed content.
    const friendIds = new Set<string>();
    const followedIds = new Set<string>();

    // Fetch posts with pagination
    const TARGET_COUNT = limit;
    const CURATION_TARGET = TARGET_COUNT * CLUBHOUSE_FETCH_MULTIPLIER;
    const PAGE_SIZE = Math.max(limit * CLUBHOUSE_FETCH_MULTIPLIER, CLUBHOUSE_PAGE_SIZE);
    
    let validPosts: RawPostData[] = [];
    let currentCursor = cursor;
    let fetchCount = 0;
    let totalRawFetched = 0;
    
    // Rejection counters for debugging
    const rejectionReasons: Record<string, number> = {
      no_media: 0,
      not_video: 0,
      duration_missing: 0,
      duration_ge_120: 0,
      ar_outside_band: 0,
      meta_pending: 0,
      passed: 0
    };
    
    while (validPosts.length < CURATION_TARGET && fetchCount < MAX_FETCH_ITERATIONS) {
      fetchCount++;
      
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
          source_review_id,
          post_media!inner (
            id,
            media_type,
            media_url,
            duration_seconds,
            aspect_ratio,
            orientation,
            width,
            height,
            poster_url,
            created_at,
            display_order,
            studio_edits,
            filter_id
          ),
          post_tags (
            id,
            tagged_entity_id,
            start_index,
            end_index,
            taggable_entities (
              id,
              entity_type,
              entity_id,
              name,
              username
            )
          ),
          post_likes(count),
          post_comments!post_comments_post_id_fkey(count)
        `)
        .order('display_order', { ascending: true, foreignTable: 'post_media', nullsFirst: false })
        .order('created_at', { ascending: true, foreignTable: 'post_media' })
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (currentCursor) {
        query = query.lt('created_at', currentCursor);
      }

      query = query.limit(PAGE_SIZE);

      const { data: postsData, error } = await query;

      if (error) {
        console.error('[fetchClubhouseShorts] Query error:', error);
        if (fetchCount === 1 && validPosts.length === 0) {
          throw new Error(`Posts query failed: ${error.message}`);
        }
        break;
      }

      if (!postsData || postsData.length === 0) break;
      
      totalRawFetched += postsData.length;

      // Apply vertical filter
      for (const post of postsData) {
        const result = passesVerticalFilter(post as unknown as RawPostData);
        if (result.passes) {
          validPosts.push(post as unknown as RawPostData);
          rejectionReasons.passed++;
          if (result.reason === 'meta_pending') {
            rejectionReasons.meta_pending++;
          }
        } else if (result.reason) {
          rejectionReasons[result.reason] = (rejectionReasons[result.reason] || 0) + 1;
        }
      }

      // Update cursor for next iteration
      currentCursor = postsData[postsData.length - 1].created_at;
    }

    // Apply curation algorithm
    const buckets = categorizePosts(validPosts, friendIds, followedIds);
    const curatedPosts = curateFeed(buckets, TARGET_COUNT);

    // Hydrate curated posts
    const context = await buildHydrationContext(curatedPosts);

    // Format posts with relationship flags
    const formattedPosts = curatedPosts.map(post => {
      return formatPost(post, context, {
        isFollowing: false,
        isFriend: false,
        includeAudioTrack: true,
      });
    }).filter((item): item is ExploreContentItem => item !== null);

    console.log('[fetchClubhouseShorts] Summary:', {
      totalRawFetched,
      validPostsAfterFilter: validPosts.length,
      curatedPostsCount: curatedPosts.length,
      formattedPostsCount: formattedPosts.length,
      rejectionReasons,
    });

    return formattedPosts;
  } catch (error) {
    console.error('[fetchClubhouseShorts] Error:', error);
    return [];
  }
}
