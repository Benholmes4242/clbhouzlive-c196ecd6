/**
 * useCoursePersonalStatus - Hook for user's personal status on a course
 * Manages: Played (via ratings), Want to Play (via shortlist), Next Up (via shortlist)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';
import { toast } from 'sonner';

export type CourseStatus = 'played' | 'want_to_play' | 'wishlist' | 'none';

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

      // Check shortlist status
      const { data: shortlist } = await supabase
        .from('course_shortlists')
        .select('id, list_key, created_at')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (shortlist) {
        const status = shortlist.list_key === 'wishlist' ? 'wishlist' : 'want_to_play';
        return {
          status,
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
      toast.success(wantToPlay ? 'Added to Want to Play' : 'Removed from list');
      queryClient.invalidateQueries({ queryKey: ['course-personal-status', courseId] });
    },
    onError: () => {
      toast.error('Failed to update');
    },
  });

  // Set wishlist (private)
  const setWishlistMutation = useMutation({
    mutationFn: async (wishlist: boolean) => {
      if (!user?.id || !courseId) throw new Error('Not authenticated');

      if (wishlist) {
        // Remove any existing shortlist first
        await supabase
          .from('course_shortlists')
          .delete()
          .eq('course_id', courseId)
          .eq('user_id', user.id);

        // Add as wishlist
        const { error } = await supabase
          .from('course_shortlists')
          .insert({
            user_id: user.id,
            course_id: courseId,
            list_key: 'wishlist',
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
    onSuccess: (_, wishlist) => {
      toast.success(wishlist ? 'Added to Wishlist' : 'Removed from Wishlist');
      queryClient.invalidateQueries({ queryKey: ['course-personal-status', courseId] });
    },
    onError: () => {
      toast.error('Failed to update');
    },
  });

  return {
    status: query.data ?? { status: 'none' as const },
    isLoading: query.isLoading,
    setWantToPlay: (want: boolean) => setWantToPlayMutation.mutate(want),
    setWishlist: (wish: boolean) => setWishlistMutation.mutate(wish),
    isUpdating: setWantToPlayMutation.isPending || setWishlistMutation.isPending,
  };
}
