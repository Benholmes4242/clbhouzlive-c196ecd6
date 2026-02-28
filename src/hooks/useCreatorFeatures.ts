import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FeaturedPost {
  id: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  content?: string;
  durationSeconds?: number | null;
}

interface PinnedPost {
  id: string;
  thumbnailUrl?: string;
  mediaType?: 'image' | 'video';
}

/**
 * Hook for managing creator features: featured video and pinned posts
 */
export function useCreatorFeatures(userId?: string) {
  const queryClient = useQueryClient();

  // Fetch creator profile data (featured post and pinned posts)
  const { data: creatorData, isLoading } = useQuery({
    queryKey: ['creator-features', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('featured_post_id, pinned_post_ids, is_creator')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return profile;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch featured post details (including duration)
  const { data: featuredPost } = useQuery({
    queryKey: ['featured-post', creatorData?.featured_post_id],
    queryFn: async () => {
      if (!creatorData?.featured_post_id) return null;

      const { data: post, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          post_media (
            id,
            media_url,
            media_type,
            poster_url,
            duration_seconds
          )
        `)
        .eq('id', creatorData.featured_post_id)
        .single();

      if (error) throw error;

      const media = post?.post_media?.[0];
      return {
        id: post.id,
        thumbnailUrl: media?.poster_url || media?.media_url,
        videoUrl: media?.media_type === 'video' ? media?.media_url : undefined,
        content: post.content,
        durationSeconds: (media as any)?.duration_seconds ?? null,
      } as FeaturedPost;
    },
    enabled: !!creatorData?.featured_post_id,
  });

  // Fetch pinned posts details
  const { data: pinnedPosts } = useQuery({
    queryKey: ['pinned-posts', creatorData?.pinned_post_ids],
    queryFn: async () => {
      const pinnedIds = creatorData?.pinned_post_ids as string[] | undefined;
      if (!pinnedIds || pinnedIds.length === 0) return [];

      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          id,
          post_media (
            id,
            media_url,
            media_type,
            poster_url
          )
        `)
        .in('id', pinnedIds);

      if (error) throw error;

      return posts.map(post => {
        const media = post?.post_media?.[0];
        return {
          id: post.id,
          thumbnailUrl: media?.poster_url || media?.media_url,
          mediaType: (media?.media_type as 'image' | 'video') || 'image',
        } as PinnedPost;
      });
    },
    enabled: !!(creatorData?.pinned_post_ids as string[] | undefined)?.length,
  });

  // Set featured post
  const setFeaturedPost = useMutation({
    mutationFn: async (postId: string | null) => {
      if (!userId) throw new Error('User ID required');

      const { error } = await supabase
        .from('user_profiles')
        .update({ featured_post_id: postId })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-features', userId] });
      queryClient.invalidateQueries({ queryKey: ['featured-post'] });
      toast.success('Featured video updated');
    },
    onError: () => {
      toast.error("Couldn't update featured video");
    },
  });

  // Pin a post
  const pinPost = useMutation({
    mutationFn: async (postId: string) => {
      if (!userId) throw new Error('User ID required');

      const currentPinned = (creatorData?.pinned_post_ids as string[] | undefined) || [];
      
      // Check if already pinned
      if (currentPinned.includes(postId)) {
        throw new Error('Post is already pinned');
      }

      // Check max 3 pinned
      if (currentPinned.length >= 3) {
        throw new Error('Maximum 3 posts can be pinned');
      }

      const newPinned = [...currentPinned, postId];

      const { error } = await supabase
        .from('user_profiles')
        .update({ pinned_post_ids: newPinned })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-features', userId] });
      queryClient.invalidateQueries({ queryKey: ['pinned-posts'] });
      toast.success('Post pinned');
    },
    onError: (error: Error) => {
      toast.error(error.message || "Couldn't pin post");
    },
  });

  // Unpin a post
  const unpinPost = useMutation({
    mutationFn: async (postId: string) => {
      if (!userId) throw new Error('User ID required');

      const currentPinned = (creatorData?.pinned_post_ids as string[] | undefined) || [];
      const newPinned = currentPinned.filter(id => id !== postId);

      const { error } = await supabase
        .from('user_profiles')
        .update({ pinned_post_ids: newPinned })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-features', userId] });
      queryClient.invalidateQueries({ queryKey: ['pinned-posts'] });
      toast.success('Post unpinned');
    },
    onError: () => {
      toast.error("Couldn't unpin post");
    },
  });

  return {
    isCreator: creatorData?.is_creator || false,
    featuredPost: featuredPost ?? null,
    pinnedPosts: pinnedPosts || [],
    isLoading,
    setFeaturedPost: (postId: string | null) => setFeaturedPost.mutate(postId),
    pinPost: pinPost.mutate,
    unpinPost: unpinPost.mutate,
    canPin: ((creatorData?.pinned_post_ids as string[] | undefined)?.length || 0) < 3,
  };
}

export default useCreatorFeatures;
