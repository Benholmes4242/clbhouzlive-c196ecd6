import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { postKeys } from '@/queryKeys/posts';
import { buildVisibilityFilter } from '@/utils/visibilityFilter';

export interface CreatorPostTag {
  id: string;
  post_id: string;
  tagged_entity_id: string;
  start_index: number | null;
  end_index: number | null;
  taggable_entities: {
    id: string;
    entity_type: 'user' | 'business' | 'golf_club';
    entity_id: string;
    name: string;
    username: string | null;
  } | null;
}

export interface CreatorPost {
  id: string;
  content: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  actor_type: string | null;
  actor_id: string | null;
  course_id: string | null;
  is_pinned: boolean | null;
  pinned_until: string | null;
  pinned_at: string | null;
  badges?: string[];
  categories?: string[];
  post_media: Array<{
    id: string;
    media_url: string;
    media_type: string;
    poster_url: string | null;
    aspect_ratio: number | null;
    duration_seconds: number | null;
    studio_edits: any;
    filter_id: string | null;
  }>;
  post_tags: CreatorPostTag[];
  course?: {
    id: string;
    name: string;
    country: string | null;
    sub_country: string | null;
    region: string | null;
  } | null;
}

/**
 * Fetches posts for a creator page.
 * Uses actor_type='creator' and actor_id=creator_page.id
 */
export function useCreatorPosts(creatorPageId?: string) {
  return useQuery({
    queryKey: postKeys.actorPosts('creator', creatorPageId ?? ''),
    enabled: !!creatorPageId,
    queryFn: async () => {
      // Get current user for visibility filtering
      const { data: { user } } = await supabase.auth.getUser();
      const visibilityFilter = buildVisibilityFilter(user?.id ?? null);
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          updated_at,
          user_id,
          actor_type,
          actor_id,
          course_id,
          is_pinned,
          pinned_until,
          pinned_at,
          badges,
          categories,
          post_media (
            id,
            media_url,
            media_type,
            poster_url,
            aspect_ratio,
            duration_seconds,
            studio_edits,
            filter_id
          ),
          post_tags (
            id,
            post_id,
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
          course:golf_courses!course_id (
            id,
            name,
            country,
            sub_country,
            region
          )
        `)
        .eq('actor_type', 'creator')
        .eq('actor_id', creatorPageId!)
        .eq('status', 'published') // Only show published posts
        .or(visibilityFilter)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useCreatorPosts] error', error);
        throw error;
      }

      return (data ?? []) as CreatorPost[];
    },
    staleTime: 5_000,
  });
}

/**
 * Fetches post count for a creator page.
 */
export function useCreatorPostsCount(creatorPageId?: string) {
  return useQuery({
    queryKey: postKeys.actorPostsCount('creator', creatorPageId ?? ''),
    enabled: !!creatorPageId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('actor_type', 'creator')
        .eq('actor_id', creatorPageId!);

      if (error) {
        console.error('[useCreatorPostsCount] error', error);
        throw error;
      }

      return count ?? 0;
    },
    staleTime: 60_000,
  });
}
