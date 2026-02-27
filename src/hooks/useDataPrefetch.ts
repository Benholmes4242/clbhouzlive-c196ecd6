/**
 * Phase 5 Perf: Data prefetching on hover
 * Prefetches profile/post data when user hovers over links
 * Uses React Query's prefetch capability
 */

import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Phase 2 Perf: Specific column selects
const PROFILE_PREFETCH_SELECT = `
  id,
  username,
  display_name,
  profile_photo_url,
  bio,
  is_verified_golfer
`;

/**
 * Hook for prefetching user profile data on hover
 * 
 * Usage:
 * ```tsx
 * const { onMouseEnter, onMouseLeave } = useProfilePrefetch(userId);
 * <Link to={`/profile/${username}`} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
 *   {username}
 * </Link>
 * ```
 */
export function useProfilePrefetch(userId: string | undefined) {
  const queryClient = useQueryClient();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const prefetch = useCallback(() => {
    if (!userId) return;

    // Prefetch user profile
    queryClient.prefetchQuery({
      queryKey: ['user-profile', userId],
      queryFn: async () => {
        const { data } = await supabase
          .from('user_profiles')
          .select(PROFILE_PREFETCH_SELECT)
          .eq('id', userId)
          .single();
        return data;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Prefetch user's recent posts
    queryClient.prefetchQuery({
      queryKey: ['user-posts-preview', userId],
      queryFn: async () => {
        const { data } = await supabase
          .from('posts')
          .select('id, created_at, post_media(id, media_url, media_type, studio_edits, filter_id)')
          .eq('user_id', userId)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(9);
        return data;
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  }, [userId, queryClient]);

  const onMouseEnter = useCallback(() => {
    // 150ms delay to avoid prefetching on quick scroll-by hovers
    timeoutRef.current = setTimeout(prefetch, 150);
  }, [prefetch]);

  const onMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return {
    onMouseEnter,
    onMouseLeave,
    prefetch,
  };
}

/**
 * Hook for prefetching post detail data on hover
 */
export function usePostPrefetch(postId: string | undefined) {
  const queryClient = useQueryClient();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const prefetch = useCallback(() => {
    if (!postId) return;

    // Prefetch post data
    queryClient.prefetchQuery({
      queryKey: ['post-detail', postId],
      queryFn: async () => {
        const { data } = await supabase
          .from('posts')
          .select(`
            id,
            user_id,
            content,
            created_at,
            status,
            post_media(id, media_url, media_type, width, height, studio_edits, filter_id)
          `)
          .eq('id', postId)
          .single();
        return data;
      },
      staleTime: 2 * 60 * 1000,
    });

    // Prefetch comments
    queryClient.prefetchQuery({
      queryKey: ['post-comments-with-replies', postId],
      queryFn: async () => {
        const { data } = await supabase
          .from('post_comments')
          .select('id, user_id, content, created_at, parent_id')
          .eq('post_id', postId)
          .is('deleted_at', null)
          .order('created_at', { ascending: true })
          .limit(20);
        return data;
      },
      staleTime: 30 * 1000,
    });
  }, [postId, queryClient]);

  const onMouseEnter = useCallback(() => {
    timeoutRef.current = setTimeout(prefetch, 150);
  }, [prefetch]);

  const onMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return {
    onMouseEnter,
    onMouseLeave,
    prefetch,
  };
}

/**
 * Hook for prefetching course detail data on hover
 */
export function useCoursePrefetch(courseId: string | undefined) {
  const queryClient = useQueryClient();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const prefetch = useCallback(() => {
    if (!courseId) return;

    queryClient.prefetchQuery({
      queryKey: ['golf-course', courseId],
      queryFn: async () => {
        const { data } = await supabase
          .from('golf_courses')
          .select(`
            id,
            name,
            slug,
            city,
            region,
            country,
            thumbnail_image,
            header_image
          `)
          .eq('id', courseId)
          .single();
        return data;
      },
      staleTime: 10 * 60 * 1000, // Courses change rarely
    });
  }, [courseId, queryClient]);

  const onMouseEnter = useCallback(() => {
    timeoutRef.current = setTimeout(prefetch, 150);
  }, [prefetch]);

  const onMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return {
    onMouseEnter,
    onMouseLeave,
    prefetch,
  };
}

export default useProfilePrefetch;
