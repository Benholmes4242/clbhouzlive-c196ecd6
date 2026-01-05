/**
 * useUserWantToPlay - Hook to fetch user's Want to Play courses
 * 
 * Sources from course_shortlists with list_key='want_to_play'
 * A course can only be in ONE state: played, want_to_play, or neither.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

      // Get course details
      const { data: courses, error: courseError } = await supabase
        .from('golf_courses')
        .select('id, name, country, sub_country, thumbnail_image')
        .in('id', courseIds);

      if (courseError) throw courseError;

      // Get Top 100 memberships for these courses
      const { data: memberships } = await supabase
        .from('course_top100_memberships')
        .select('course_id, list_id, rank')
        .in('course_id', courseIds);

      // Get list details to determine rank types
      const listIds = [...new Set((memberships || []).map(m => m.list_id))];
      const { data: lists } = await supabase
        .from('top100_lists')
        .select('id, slug')
        .in('id', listIds);

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
      
      return shortlists.map(s => {
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

  // Mark as played mutation (removes from want_to_play)
  const markAsPlayedMutation = useMutation({
    mutationFn: async (courseId: string) => {
      // Just remove from shortlists - the user will rate the course separately
      const { error } = await supabase
        .from('course_shortlists')
        .delete()
        .eq('course_id', courseId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-want-to-play', userId] });
      queryClient.invalidateQueries({ queryKey: ['course-personal-status'] });
    },
  });

  // Remove from want to play mutation
  const removeMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase
        .from('course_shortlists')
        .delete()
        .eq('course_id', courseId)
        .eq('user_id', userId);

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
