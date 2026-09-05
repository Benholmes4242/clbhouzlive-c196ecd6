/**
 * useCoursePersonalStatus - Hook for user's personal status on a course
 * Manages: Played (via ratings), Want to Play (via shortlist)
 * Simplified: Removed wishlist, only Played and Want to Play remain
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';
import { toast } from '@/lib/toast';
import { setWantToPlayRequest } from '@/hooks/shortlist/wantToPlayMutation';
import { useCourseStatsDetail } from '@/hooks/feed/useCourseStatsDetail';


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

  // DISPLAYED COUNT: the exact same cached RPC field used by the course hero.
  // It is the member's 18-hole sample; do not independently recount it here.
  const roundsCountQuery = useCourseStatsDetail(courseId, Boolean(user?.id && courseId));

  // HAS PLAYED: deliberately an existence test, not another count. Unlike the
  // hero's display sample, any tracked round qualifies, including nine holes.
  const anyTrackedRoundQuery = useQuery({
    queryKey: ['course-personal-status', 'any-tracked-round', courseId, user?.id],
    enabled: Boolean(courseId && user?.id),
    queryFn: async (): Promise<boolean> => {
      if (!courseId || !user?.id) return false;
      const { data, error } = await supabase
        .from('gam_round_stats')
        .select('id')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data != null;
    },
    staleTime: 5 * 60 * 1000,
  });

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

  // Toggle want to play status — shares THE single shortlist write path with
  // Discover's card control (BRIEF_DISCOVER_RELEVANCE B2).
  const setWantToPlayMutation = useMutation({
    mutationFn: async (wantToPlay: boolean) => {
      if (!user?.id || !courseId) throw new Error('Not authenticated');
      await setWantToPlayRequest(user.id, courseId, wantToPlay);
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
    // Loading is NOT representable as data. A null status forces every consumer
    // to handle the in-flight case instead of being told 'none' and being wrong.
    status: query.data ?? null,
    isLoading: query.isLoading,
    hasTrackedRounds: anyTrackedRoundQuery.data ?? false,
    trackedRoundCount: roundsCountQuery.data?.your_rounds ?? 0,
    // Absence is safe to render only after BOTH round questions succeeded.
    roundsSettled: anyTrackedRoundQuery.isSuccess && roundsCountQuery.isSuccess,
    setWantToPlay: (want: boolean) => setWantToPlayMutation.mutate(want),
    isUpdating: setWantToPlayMutation.isPending,
  };
}
