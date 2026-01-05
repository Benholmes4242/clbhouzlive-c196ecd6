/**
 * useUserWantToPlay - Hook to fetch user's Want to Play courses
 * 
 * Sources from course_shortlists with list_key='want_to_play'
 * A course can only be in ONE state: played, want_to_play, or neither.
 * 
 * CRITICAL: "Played" = has a course_ratings row.
 * When marking as played, we create a rating row (minimal rating) AND remove from shortlist.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export interface WantToPlayCourse {
  id: string;
  course_id: string;
  course_name: string;
  country: string;
  sub_country: string | null;
  thumbnail_image: string | null;
  added_at: string;
  // Top 100 ranks
  global_rank?: number | null;
  regional_rank?: number | null;
  usa_rank?: number | null;
}

export function useUserWantToPlay(userId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useSupabaseSession();
  const currentUserId = user?.id;

  const { data: wantToPlay = [], isLoading, error } = useQuery({
    queryKey: ['user-want-to-play', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];

      // Get shortlisted courses with list_key='want_to_play'
      const { data: shortlists, error: shortlistError } = await supabase
        .from('course_shortlists')
        .select('id, course_id, created_at, list_key')
        .eq('user_id', userId)
        .eq('list_key', 'want_to_play')
        .order('created_at', { ascending: false });

      if (shortlistError) throw shortlistError;
      if (!shortlists || shortlists.length === 0) return [];

      const courseIds = shortlists.map(s => s.course_id);

      // Also check if any of these are already played (have ratings)
      // This enforces mutual exclusivity at query time
      const { data: existingRatings } = await supabase
        .from('course_ratings')
        .select('course_id')
        .eq('user_id', userId)
        .in('course_id', courseIds);

      const playedCourseIds = new Set((existingRatings || []).map(r => r.course_id));

      // Filter out any courses that are already played (should not be in Want to Play)
      const validShortlists = shortlists.filter(s => !playedCourseIds.has(s.course_id));

      if (validShortlists.length === 0) return [];

      const validCourseIds = validShortlists.map(s => s.course_id);

      // Get course details
      const { data: courses, error: courseError } = await supabase
        .from('golf_courses')
        .select('id, name, country, sub_country, thumbnail_image')
        .in('id', validCourseIds);

      if (courseError) throw courseError;

      // Get Top 100 memberships for these courses
      const { data: memberships } = await supabase
        .from('course_top100_memberships')
        .select('course_id, list_id, rank')
        .in('course_id', validCourseIds);

      // Get list details to determine rank types
      const listIds = [...new Set((memberships || []).map(m => m.list_id))];
      const { data: lists } = listIds.length > 0 
        ? await supabase.from('top100_lists').select('id, slug').in('id', listIds)
        : { data: [] };

      const listSlugMap = new Map((lists || []).map(l => [l.id, l.slug]));

      // Build rank map
      const rankMap = new Map<string, { global?: number; regional?: number; usa?: number }>();
      (memberships || []).forEach(m => {
        const slug = listSlugMap.get(m.list_id);
        const existing = rankMap.get(m.course_id) || {};
        
        if (slug === 'top-100-worldwide') {
          existing.global = m.rank;
        } else if (slug === 'top-100-usa') {
          existing.usa = m.rank;
        } else if (slug === 'top-100-gb-i' || slug === 'top-100-europe') {
          existing.regional = m.rank;
        }
        
        rankMap.set(m.course_id, existing);
      });

      // Build result array
      const courseMap = new Map((courses || []).map(c => [c.id, c]));
      
      return validShortlists.map(s => {
        const course = courseMap.get(s.course_id);
        const ranks = rankMap.get(s.course_id) || {};
        
        return {
          id: s.id,
          course_id: s.course_id,
          course_name: course?.name || 'Unknown Course',
          country: course?.country || '',
          sub_country: course?.sub_country || null,
          thumbnail_image: course?.thumbnail_image || null,
          added_at: s.created_at,
          global_rank: ranks.global,
          regional_rank: ranks.regional,
          usa_rank: ranks.usa,
        } as WantToPlayCourse;
      });
    },
    staleTime: 60_000,
  });

  /**
   * Mark as played mutation
   * CRITICAL: Creates a course_rating row (canonical "played" state) AND removes from shortlist.
   * This ensures the course moves from "want_to_play" to "played" atomically.
   */
  const markAsPlayedMutation = useMutation({
    mutationFn: async (courseId: string) => {
      if (!currentUserId) throw new Error('Not authenticated');

      // 1. Check if rating already exists (shouldn't, but safety check)
      const { data: existingRating } = await supabase
        .from('course_ratings')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('course_id', courseId)
        .maybeSingle();

      // 2. If no rating exists, create a placeholder rating (user will edit later)
      if (!existingRating) {
        const { error: insertError } = await supabase
          .from('course_ratings')
          .insert({
            user_id: currentUserId,
            course_id: courseId,
            rating: 0, // Placeholder - user should rate properly
            is_mock: false,
          });

        if (insertError) throw insertError;
      }

      // 3. Remove from shortlist (want_to_play)
      const { error: deleteError } = await supabase
        .from('course_shortlists')
        .delete()
        .eq('course_id', courseId)
        .eq('user_id', currentUserId);

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['user-want-to-play', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-course-activity'] });
      queryClient.invalidateQueries({ queryKey: ['user-course-summary'] });
      queryClient.invalidateQueries({ queryKey: ['course-personal-status'] });
    },
  });

  // Remove from want to play mutation (does NOT mark as played)
  const removeMutation = useMutation({
    mutationFn: async (courseId: string) => {
      if (!currentUserId) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('course_shortlists')
        .delete()
        .eq('course_id', courseId)
        .eq('user_id', currentUserId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-want-to-play', userId] });
      queryClient.invalidateQueries({ queryKey: ['course-personal-status'] });
    },
  });

  return {
    wantToPlay,
    isLoading,
    error,
    markAsPlayed: markAsPlayedMutation.mutate,
    remove: removeMutation.mutate,
    isUpdating: markAsPlayedMutation.isPending || removeMutation.isPending,
  };
}
