import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabaseSession } from './useSupabaseSession';
import { toast } from 'sonner';

interface ToggleMediaLikeParams {
  mediaId: string;
  isLiked: boolean;
}

/**
 * Media like hook - placeholder implementation
 * TODO: Once Supabase types regenerate with course_media_likes table,
 * implement full like/unlike functionality using:
 * - supabase.from('course_media_likes').insert() for likes
 * - supabase.from('course_media_likes').delete() for unlikes
 */
export const useMediaLike = (courseId: string) => {
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ mediaId, isLiked }: ToggleMediaLikeParams) => {
      if (!user) {
        throw new Error('Must be logged in to like media');
      }

      // Placeholder - will be implemented once types regenerate
      console.log('Media like toggled:', { mediaId, isLiked, userId: user.id });
      
      return { action: isLiked ? 'unliked' : 'liked' };
    },
    onError: (error) => {
      toast.error('Failed to update like');
      console.error('Media like error:', error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['course-media', courseId] });
    },
  });

  return mutation;
};
