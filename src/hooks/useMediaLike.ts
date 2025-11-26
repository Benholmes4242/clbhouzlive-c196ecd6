import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';
import { toast } from 'sonner';

interface ToggleMediaLikeParams {
  mediaId: string;
  isLiked: boolean;
}

export const useMediaLike = (courseId: string) => {
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();

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
        return { action: 'unliked' };
      } else {
        // Like: insert a new like
        const { error } = await supabase
          .from('course_media_likes')
          .insert({
            media_id: mediaId,
            user_id: user.id,
          });

        if (error) throw error;
        return { action: 'liked' };
      }
    },
    onMutate: async ({ mediaId, isLiked }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['course-media', courseId] });

      const previousData = queryClient.getQueryData(['course-media', courseId]);

      // Update cache optimistically (simplified - actual structure may vary)
      // This is a placeholder for the optimistic update logic
      
      return { previousData };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['course-media', courseId], context.previousData);
      }
      toast.error('Failed to update like');
      console.error('Media like error:', error);
    },
    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ['course-media', courseId] });
    },
  });

  return mutation;
};
