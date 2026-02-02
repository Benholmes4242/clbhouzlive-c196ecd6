import { supabase } from '@/integrations/supabase/client';
import type { ExploreContentItem } from '@/components/explore/types';
import { FILTER_TYPES, MEDIA_TYPES } from '@/components/explore/types';
import type { RawPostData, FetchOptions } from '../types';
import { buildHydrationContext } from '../utils/postHydration';
import { formatPosts } from '../utils/postFormatter';
import { buildVisibilityFilter } from '@/utils/visibilityFilter';
import { fetchFriendsFirstPosts } from './fetchFriendsFirstPosts';

/**
 * Main explore feed fetcher with filtering and sorting
 */
export async function fetchRealPosts(
  currentOffset: number,
  postsPerPage: number,
  mediaFilter?: string,
  subFilter?: string,
  durationFilter?: { from: number; to: number | null },
  sortOption?: string
): Promise<ExploreContentItem[]> {
  try {
    // Get current user to filter out their personal posts
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const currentUserId = currentUser?.id;

    // For friends-first, use RPC for global ordering
    if (sortOption === 'friends-first' && currentUserId) {
      return await fetchFriendsFirstPosts(currentOffset, postsPerPage, mediaFilter, durationFilter);
    }

    // Build the base query
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
      `);

    // Filter out current user's PERSONAL posts
    if (currentUserId) {
      query = query.or(`user_id.neq.${currentUserId},actor_type.eq.business`);
    }
    
    // Apply visibility filter
    const visibilityFilter = buildVisibilityFilter(currentUserId);
    query = query.or(visibilityFilter).eq('status', 'published');

    // Apply media type filters
    if (mediaFilter === FILTER_TYPES.SHORTS) {
      query = query
        .eq('post_media.media_type', MEDIA_TYPES.VIDEO)
        .not('post_media.duration_seconds', 'is', null)
        .lte('post_media.duration_seconds', 180);
    } else if (mediaFilter === FILTER_TYPES.VIDEOS) {
      query = query.eq('post_media.media_type', MEDIA_TYPES.VIDEO);
      
      if (durationFilter) {
        query = query.not('post_media.duration_seconds', 'is', null);
        if (durationFilter.from > 0) {
          query = query.gte('post_media.duration_seconds', durationFilter.from);
        }
        if (durationFilter.to !== null) {
          query = query.lte('post_media.duration_seconds', durationFilter.to);
        }
      }
    } else if (mediaFilter === FILTER_TYPES.PHOTOS) {
      query = query.eq('post_media.media_type', MEDIA_TYPES.IMAGE);
      
      if (subFilter === 'portraits') {
        query = query.eq('post_media.image_orientation', 'portrait');
      } else if (subFilter === 'landscapes') {
        query = query.eq('post_media.image_orientation', 'landscape');
      }
    }

    // Apply ordering
    if (sortOption === 'most-liked') {
      query = query
        .order('like_count', { ascending: false })
        .order('created_at', { ascending: false });
    } else if (sortOption === 'most-discussed') {
      query = query
        .order('comment_count', { ascending: false })
        .order('created_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }
    
    // Apply pagination
    query = query.range(currentOffset, currentOffset + postsPerPage - 1);

    const { data: postsData, error } = await query;

    if (error) {
      console.error('Error fetching posts:', error);
      return [];
    }

    if (!postsData || postsData.length === 0) {
      return [];
    }

    // Hydrate and format
    const context = await buildHydrationContext(postsData as unknown as RawPostData[]);
    let formattedPosts = formatPosts(postsData as unknown as RawPostData[], context);

    // Apply client-side duration filter fallback
    if (durationFilter) {
      formattedPosts = formattedPosts.filter(post => {
        if (post.durationSeconds == null) return true;
        if (durationFilter.to !== null && post.durationSeconds > durationFilter.to) return false;
        if (durationFilter.from > 0 && post.durationSeconds < durationFilter.from) return false;
        return true;
      });
    }

    // Apply tag-based subfilter for Shorts
    if (mediaFilter === FILTER_TYPES.SHORTS && subFilter && ['golf-swing', 'hole-in-one', 'long-drive', 'fail'].includes(subFilter)) {
      const tagKeywords: Record<string, string[]> = {
        'golf-swing': ['swing', 'golf swing', 'technique'],
        'hole-in-one': ['hole in one', 'ace', 'holeinone'],
        'long-drive': ['long drive', 'distance', 'bomber'],
        'fail': ['fail', 'miss', 'bloopers', 'oops']
      };
      
      const keywords = tagKeywords[subFilter] || [];
      
      formattedPosts = formattedPosts.filter(post => {
        const content = post.title?.toLowerCase() || '';
        const courseName = post.golfCourse?.name?.toLowerCase() || '';
        return keywords.some(keyword => 
          content.includes(keyword.toLowerCase()) || 
          courseName.includes(keyword.toLowerCase())
        );
      });
    }

    // Apply Photos subfilters
    if (mediaFilter === FILTER_TYPES.PHOTOS && subFilter === 'courses') {
      formattedPosts = formattedPosts.filter(post => post.golfCourse !== null && post.golfCourse !== undefined);
    }

    return formattedPosts;
  } catch (error) {
    console.error('Error fetching real posts:', error);
    return [];
  }
}
