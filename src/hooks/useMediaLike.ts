import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';
import { toast } from 'sonner';

interface ToggleMediaLikeParams {
  mediaId: string;
  isLiked: boolean;
}

/**
 * Hook for toggling media likes with optimistic updates
 * Uses course_media_likes table with media_id/user_id unique constraint
 */
export const useMediaLike = (courseId: string) => {
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();

  // Simplified mutation - let TypeScript infer types to avoid deep instantiation
  const mutation = useMutation({
    mutationFn: async ({ mediaId, isLiked }: ToggleMediaLikeParams) => {
      if (!user) {
        throw new Error('Must be logged in to like media');
      }

      if (isLiked) {
        // Unlike: delete the like
        const { error } = await supabase
          .from('course_media_likes')
          .delete()
          .eq('media_id', mediaId)
          .eq('user_id', user.id);

        if (error) throw error;
        return { action: 'unliked' as const };
      } else {
        // Like: insert a new like (unique constraint handles duplicates)
        const { error } = await supabase
          .from('course_media_likes')
          .insert({
            media_id: mediaId,
            user_id: user.id,
          });

        if (error) throw error;
        return { action: 'liked' as const };
      }
    },
    onError: (error) => {
      toast.error('Failed to update like');
      console.error('Media like error:', error);
    },
    onSettled: () => {
      // Refetch media to sync like counts
      queryClient.invalidateQueries({ queryKey: ['course-media', courseId] });
    },
  });

  return mutation;
};
