/**
 * Hook to fetch posts that tag a business via post_tags/taggable_entities
 */
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { postEventBus } from '@/events/postEventBus';

export interface TaggedPost {
  id: string;
  content: string | null;
  created_at: string;
  user_id: string;
  is_pinned: boolean;
  pinned_until: string | null;
  pinned_at: string | null;
  post_media: Array<{
    id: string;
    media_url: string;
    media_type: string;
    poster_url: string | null;
    duration_seconds: number | null;
  }>;
  user_profiles: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  } | null;
  // Course context (if tagged)
  tagged_course?: {
    id: string;
    name: string;
  } | null;
}

export function useBusinessTaggedPosts(businessId: string | undefined) {
  const queryClient = useQueryClient();

  // Listen for post:created events to refresh tagged posts in real-time
  useEffect(() => {
    if (!businessId) return;

    const off = postEventBus.on('post:created', () => {
      // Invalidate tagged posts - new post may have tagged this business
      queryClient.invalidateQueries({ queryKey: ['business-tagged-posts', businessId] });
    });

    return () => off();
  }, [businessId, queryClient]);

  return useQuery({
    queryKey: ['business-tagged-posts', businessId],
    queryFn: async (): Promise<TaggedPost[]> => {
      if (!businessId) return [];

      // Step 1: Find the taggable_entity for this business
      const { data: taggableEntity, error: entityError } = await supabase
        .from('taggable_entities')
        .select('id')
        .eq('entity_type', 'business')
        .eq('entity_id', businessId)
        .maybeSingle();

      if (entityError) {
        console.error('Error finding taggable entity:', entityError);
        return [];
      }

      if (!taggableEntity) {
        // No taggable entity exists for this business yet
        return [];
      }

      // Step 2: Get post_ids from post_tags where tagged_entity_id matches
      const { data: postTags, error: tagsError } = await supabase
        .from('post_tags')
        .select('post_id')
        .eq('tagged_entity_id', taggableEntity.id);

      if (tagsError) {
        console.error('Error fetching post tags:', tagsError);
        return [];
      }

      if (!postTags || postTags.length === 0) {
        return [];
      }

      const postIds = postTags.map(t => t.post_id);

      // Step 3: Fetch posts by IDs (filter business's own posts client-side)
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          is_pinned,
          pinned_until,
          pinned_at,
          actor_type,
          actor_id,
          post_media (
            id,
            media_url,
            media_type,
            poster_url,
            duration_seconds
          )
        `)
        .in('id', postIds)
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Error fetching tagged posts:', postsError);
        return [];
      }

      if (!posts || posts.length === 0) {
        return [];
      }

      // Step 3b: Filter out business's own posts (actor_type='business' AND actor_id=businessId)
      const externalPosts = posts.filter(
        p => !(p.actor_type === 'business' && p.actor_id === businessId)
      );

      // Step 4: Check visibility - exclude hidden posts
      const { data: hiddenPosts } = await supabase
        .from('business_tag_visibility')
        .select('post_id')
        .eq('business_id', businessId)
        .eq('is_hidden', true);

      const hiddenPostIds = new Set(hiddenPosts?.map(h => h.post_id) || []);
      const visiblePosts = externalPosts.filter(p => !hiddenPostIds.has(p.id));

      // Step 5: Fetch user profiles for authors
      const userIds = [...new Set(visiblePosts.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return visiblePosts.map(post => ({
        ...post,
        user_profiles: profileMap.get(post.user_id) || null,
      })) as TaggedPost[];
    },
    enabled: !!businessId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useHideTaggedPost(businessId: string) {
  const hidePost = async (postId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('business_tag_visibility')
      .upsert({
        business_id: businessId,
        post_id: postId,
        is_hidden: true,
        hidden_by: user.id,
        hidden_at: new Date().toISOString(),
      }, {
        onConflict: 'business_id,post_id',
      });

    if (error) throw error;
  };

  return { hidePost };
}
