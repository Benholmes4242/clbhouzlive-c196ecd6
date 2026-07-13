/**
 * useCoursePersonalStatus - Hook for user's personal status on a course
 * Manages: Played (via ratings), Want to Play (via shortlist)
 * Simplified: Removed wishlist, only Played and Want to Play remain
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';
import { toast } from '@/lib/toast';

export type CourseStatus = 'played' | 'want_to_play' | 'none';

export interface CoursePersonalStatus {
  status: CourseStatus;
  rating?: number;
  review?: string;
  shortlistId?: string;
  ratingId?: string;
  createdAt?: string;
}

export function useCoursePersonalStatus(courseId: string | undefined) {
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['course-personal-status', courseId, user?.id],
    enabled: !!courseId && !!user?.id,
    queryFn: async (): Promise<CoursePersonalStatus> => {
      if (!courseId || !user?.id) {
        return { status: 'none' };
      }

      // Check if played (has rating)
      const { data: rating } = await supabase
        .from('course_ratings')
        .select('id, rating, review, created_at')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .eq('is_mock', false)
        .maybeSingle();

      if (rating) {
        return {
          status: 'played',
          rating: rating.rating,
          review: rating.review ?? undefined,
          ratingId: rating.id,
          createdAt: rating.created_at,
        };
      }

      // Check shortlist status (want_to_play only now, treat legacy wishlist as want_to_play)
      const { data: shortlist } = await supabase
        .from('course_shortlists')
        .select('id, list_key, created_at')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (shortlist) {
        // Treat both 'want_to_play' and legacy 'wishlist' as want_to_play
        return {
          status: 'want_to_play',
          shortlistId: shortlist.id,
          createdAt: shortlist.created_at,
        };
      }

      return { status: 'none' };
    },
    staleTime: 3 * 60 * 1000,
  });

  // Toggle want to play status
  const setWantToPlayMutation = useMutation({
    mutationFn: async (wantToPlay: boolean) => {
      if (!user?.id || !courseId) throw new Error('Not authenticated');

      if (wantToPlay) {
        // Remove any existing shortlist first
        await supabase
          .from('course_shortlists')
          .delete()
          .eq('course_id', courseId)
          .eq('user_id', user.id);

        // Add to want to play
        const { error } = await supabase
          .from('course_shortlists')
          .insert({
            user_id: user.id,
            course_id: courseId,
            list_key: 'want_to_play',
          });
        if (error && error.code !== '23505') throw error;
      } else {
        const { error } = await supabase
          .from('course_shortlists')
          .delete()
          .eq('course_id', courseId)
          .eq('user_id', user.id);
        if (error) throw error;
      }
    },
    onSuccess: (_, wantToPlay) => {
      toast.success(wantToPlay ? 'Added to bucket list' : 'Removed from bucket list');
      // Invalidate all related queries using predicate
      queryClient.invalidateQueries({ 
        predicate: q => Array.isArray(q.queryKey) && q.queryKey[0] === 'course-personal-status' 
      });
      queryClient.invalidateQueries({ 
        predicate: q => Array.isArray(q.queryKey) && q.queryKey[0] === 'top100-map-courses' 
      });
      queryClient.invalidateQueries({ 
        predicate: q => Array.isArray(q.queryKey) && q.queryKey[0] === 'user-journey-courses' 
      });
    },
    onError: () => {
      toast.error('Failed to update');
    },
  });

  return {
    status: query.data ?? { status: 'none' as const },
    isLoading: query.isLoading,
    setWantToPlay: (want: boolean) => setWantToPlayMutation.mutate(want),
    isUpdating: setWantToPlayMutation.isPending,
  };
}
