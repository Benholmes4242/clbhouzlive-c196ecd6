
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ActivityPost } from '../types/ActivityTypes';

export const actorPostsKey = (actorType: 'personal' | 'business', actorId?: string) =>
  ['actor-posts', actorType, actorId] as const;

export const useActivityPosts = (actorId?: string) => {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: actorPostsKey('personal', actorId),
    enabled: !!actorId,
    queryFn: async (): Promise<ActivityPost[]> => {
      if (!actorId) return [];

      const [postsRes, profileRes] = await Promise.all([
        supabase
          .from('posts')
          .select(`
            id,
            content,
            created_at,
            user_id,
            actor_type,
            actor_id,
            post_media (
              id,
              media_type,
              media_url,
              poster_url,
              aspect_ratio,
              duration_seconds,
              filter_id,
              studio_edits
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
            )
          `)
          .eq('actor_type', 'personal')
          .eq('actor_id', actorId)
          .order('created_at', { ascending: false }),
        supabase
          .from('user_profiles')
          .select('id, display_name, username, profile_photo_url')
          .eq('id', actorId)
          .single(),
      ]);

      if (postsRes.error) {
        console.error('ActivityPosts - Error with posts query:', postsRes.error);
        return [];
      }

      const postsData = postsRes.data ?? [];
      const userProfile = profileRes.data;

      return postsData
        .filter((post: any) => {
          const hasContent = post.content && post.content.trim().length > 0;
          const hasMedia = post.post_media && post.post_media.length > 0;
          return hasContent || hasMedia;
        })
        .map((post: any) => {
          const tags =
            post.post_tags?.map((tag: any) => ({
              id: tag.id,
              post_id: post.id,
              tagged_entity_id: tag.tagged_entity_id,
              entity_type: tag.taggable_entities?.entity_type,
              entity_id: tag.taggable_entities?.entity_id,
              name: tag.taggable_entities?.name,
              username: tag.taggable_entities?.username,
              tagged_entity: tag.taggable_entities,
            })) || [];

          return {
            id: post.id,
            type: 'post' as const,
            content: post.content || '',
            likes: 0,
            comments: 0,
            shares: 0,
            timeAgo: new Date(post.created_at).toLocaleDateString(),
            created_at: post.created_at,
            post_media: (post.post_media || []).map((media: any) => ({
              id: media.id,
              media_type: media.media_type as 'image' | 'video',
              media_url: media.media_url,
              poster_url: media.poster_url,
              aspect_ratio: media.aspect_ratio,
              duration_seconds: media.duration_seconds,
              filter_id: media.filter_id,
              studio_edits: media.studio_edits,
            })),
            post_tags: tags,
            user: {
              id: actorId,
              display_name: userProfile?.display_name || null,
              username: userProfile?.username || null,
              profile_photo_url: userProfile?.profile_photo_url || null,
            },
            image: post.post_media?.find((m: any) => m.media_type === 'image')?.media_url,
          };
        });
    },
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
  });

  // Also respond to legacy event-driven refreshes
  useEffect(() => {
    const handlePostCompleted = (e: any) => {
      const realPost = e?.detail?.realPost;
      if (!actorId) return;

      // If we have actor identity in the event, only refresh when it matches.
      if (realPost?.actor_type && realPost?.actor_id) {
        if (realPost.actor_type === 'personal' && realPost.actor_id === actorId) {
          qc.invalidateQueries({ queryKey: actorPostsKey('personal', actorId) });
        }
        return;
      }

      // Fallback: refetch
      query.refetch();
    };

    window.addEventListener('postCompleted', handlePostCompleted as EventListener);
    return () => window.removeEventListener('postCompleted', handlePostCompleted as EventListener);
  }, [actorId, qc, query]);

  return {
    posts: query.data ?? [],
    loading: query.isLoading,
    fetchUserPosts: query.refetch,
  };
};

