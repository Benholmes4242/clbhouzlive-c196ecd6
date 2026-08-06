import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { setWantToPlayRequest } from '@/hooks/shortlist/wantToPlayMutation';

/**
 * useWantToPlayToggle — ONE mutation for many courses (Discover cards).
 *
 * Shares `setWantToPlayRequest` with the course page's CourseStatusToggle, so
 * there is a single shortlist write path. Optimistic state lives with the
 * caller (the lens needs it anyway); this hook owns the write and the
 * invalidation of ['user-want-to-play', userId] so the FOR YOU lens recomputes
 * on the next render.
 */
export function useWantToPlayToggle() {
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ courseId, want }: { courseId: string; want: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');
      await setWantToPlayRequest(user.id, courseId, want);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-want-to-play', user?.id] });
      queryClient.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'course-personal-status',
      });
    },
  });

  return {
    toggle: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    canShortlist: !!user?.id,
  };
}
