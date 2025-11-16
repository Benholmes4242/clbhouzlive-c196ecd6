import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TopTenCourse {
  id: string;
  position: number;
  course_id: string;
  name: string;
  country: string;
  sub_country?: string | null;
  region?: string | null;
  thumbnail_image?: string | null;
  global_rank?: number | null;
  regional_rank?: number | null;
  usa_rank?: number | null;
}

export function useUserTopTenCourses(userId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: topTen = [], isLoading } = useQuery({
    queryKey: ['user-top-ten-courses', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_top_ten_courses_view' as any)
        .select('*')
        .eq('user_id', userId)
        .order('position', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as TopTenCourse[];
    },
    staleTime: 30_000,
  });

  const addCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      if (!userId) throw new Error('No user ID');

      // Find next available position
      const positions = new Set(topTen.map(c => c.position));
      let nextPosition = 1;
      while (positions.has(nextPosition) && nextPosition <= 10) {
        nextPosition++;
      }

      if (nextPosition > 10) {
        throw new Error('Top 10 is full');
      }

      const { error } = await supabase
        .from('user_top_ten_courses')
        .insert({
          user_id: userId,
          course_id: courseId,
          position: nextPosition,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-top-ten-courses', userId] });
    },
  });

  const removeCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      if (!userId) throw new Error('No user ID');

      const { error } = await supabase
        .from('user_top_ten_courses')
        .delete()
        .eq('user_id', userId)
        .eq('course_id', courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-top-ten-courses', userId] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (newOrder: { course_id: string; position: number }[]) => {
      if (!userId) throw new Error('No user ID');

      // Update all positions in a transaction-like manner
      const updates = newOrder.map(({ course_id, position }) =>
        supabase
          .from('user_top_ten_courses')
          .update({ position, updated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('course_id', course_id)
      );

      const results = await Promise.all(updates);
      const error = results.find(r => r.error)?.error;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-top-ten-courses', userId] });
    },
  });

  return {
    topTen,
    isLoading,
    addCourse: addCourseMutation.mutate,
    removeCourse: removeCourseMutation.mutate,
    reorderTopTen: reorderMutation.mutate,
    isAdding: addCourseMutation.isPending,
    isRemoving: removeCourseMutation.isPending,
    isReordering: reorderMutation.isPending,
  };
}
