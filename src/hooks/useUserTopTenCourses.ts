import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TenBlockData } from '@/components/topTen/topTenModel';

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
  is_pinned: boolean;
  rating?: number | null;
}

/**
 * Reads resolved positions from get_top_ten_block; never ranks a truncated ratings page.
 * One course-id batch adds legacy header/Manage ranks without choosing or compacting slots.
 * Mutations retain their original snapshot/exclusion writes; the server resolves the refetch.
 */
export function useUserTopTenCourses(userId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: topTen = [], isLoading } = useQuery({
    queryKey: ['user-top-ten-courses', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase.rpc('get_top_ten_block', { p_owner: userId });
      if (error) throw error;
      const block = data as unknown as TenBlockData | null;
      if (!block) return [];

      const courses: TopTenCourse[] = block.courses.map(course => ({
        id: course.course_id,
        position: course.position,
        course_id: course.course_id,
        name: course.name,
        country: course.country ?? '',
        sub_country: course.sub_country,
        region: course.region,
        thumbnail_image: course.thumbnail_image,
        is_pinned: course.is_pinned,
        rating: course.member_score,
      }));
      if (courses.length === 0) return courses;

      const { data: ranks, error: rankError } = await supabase
        .from('golf_courses')
        .select('id, global_rank, regional_rank, usa_rank')
        .in('id', courses.map(course => course.course_id));
      if (rankError) throw rankError;
      const ranksById = new Map((ranks ?? []).map(course => [course.id, course]));
      return courses.map(course => {
        const rank = ranksById.get(course.course_id);
        return {
          ...course,
          global_rank: rank?.global_rank ?? null,
          regional_rank: rank?.regional_rank ?? null,
          usa_rank: rank?.usa_rank ?? null,
        };
      }).sort((a, b) => a.position - b.position);
    },
    staleTime: 5_000,
  });

  const invalidateTopTenQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['user-top-ten-courses'], exact: false }),
      queryClient.invalidateQueries({ queryKey: ['userTopTenCourses'], exact: false }),
      queryClient.invalidateQueries({ queryKey: ['user_top_ten_courses_view'], exact: false }),
      queryClient.invalidateQueries({ queryKey: ['top-ten-block'], exact: false }),
      queryClient.invalidateQueries({ queryKey: ['top-ten-post-blocks'], exact: false }),
    ]);
    // Use type: 'all' instead of 'active' so inactive queries also refetch on remount
    await queryClient.refetchQueries({ queryKey: ['user-top-ten-courses', userId], exact: true, type: 'all' });
  };

  // Add a course as pinned at next available position
  const addCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      if (!userId) throw new Error('No user ID');

      // Remove from exclusions if present
      await supabase
        .from('user_top10_exclusions')
        .delete()
        .eq('user_id', userId)
        .eq('course_id', courseId);

      // Find next available position
      const positions = new Set(topTen.filter(c => c.is_pinned).map(c => c.position));
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
          is_pinned: true,
        });

      if (error) throw error;
    },
    onSuccess: invalidateTopTenQueries,
  });

  // Remove a course - adds to exclusions so it won't auto-appear
  const removeCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      if (!userId) throw new Error('No user ID');

      const course = topTen.find(c => c.course_id === courseId);
      if (!course) return;

      // Step 1 — Snapshot all OTHER current courses as pinned at their current positions.
      // This converts any auto-populated entries into real DB rows so gaps are preserved.
      const otherCourses = topTen.filter(c => c.course_id !== courseId);

      if (otherCourses.length > 0) {
        // Delete all existing rows for this user first (clean slate)
        await supabase
          .from('user_top_ten_courses')
          .delete()
          .eq('user_id', userId);

        // Re-insert all other courses as pinned at their exact positions
        // Filter to valid positions only (1-10) to satisfy DB constraint
        const validCourses = otherCourses.filter(c => c.position >= 1 && c.position <= 10);
        
        if (validCourses.length > 0) {
          const { error: snapshotError } = await supabase
            .from('user_top_ten_courses')
            .insert(
              validCourses.map(c => ({
                user_id: userId,
                course_id: c.course_id,
                position: c.position,
                is_pinned: true,
              }))
            );
          if (snapshotError) throw snapshotError;
        }
      } else {
        // No other courses — just delete if it was pinned
        await supabase
          .from('user_top_ten_courses')
          .delete()
          .eq('user_id', userId)
          .eq('course_id', courseId);
      }

      // Step 2 — Add removed course to exclusions with its vacated position
      const { error: excludeError } = await supabase
        .from('user_top10_exclusions')
        .upsert({
          user_id: userId,
          course_id: courseId,
          position: course.position,
        }, {
          onConflict: 'user_id,course_id',
        });

      if (excludeError) throw excludeError;
    },
    onSuccess: invalidateTopTenQueries,
  });

  // Reorder - preserves is_pinned status per course
  const reorderMutation = useMutation({
    mutationFn: async (updates: { course_id: string; position: number; is_pinned: boolean }[]) => {
      if (!userId) throw new Error('No user ID');

      // Sort by position
      const sorted = [...updates].sort((a, b) => a.position - b.position);

      // Delete all existing pinned entries
      await supabase
        .from('user_top_ten_courses')
        .delete()
        .eq('user_id', userId);

      // Insert only pinned courses (auto-populated ones don't need DB rows)
      const pinnedEntries = sorted
        .filter(u => u.is_pinned)
        .map(u => ({
          user_id: userId,
          course_id: u.course_id,
          position: u.position,
          is_pinned: true,
        }));

      if (pinnedEntries.length > 0) {
        const { error } = await supabase
          .from('user_top_ten_courses')
          .insert(pinnedEntries);
        if (error) throw error;
      }

      // Remove any of these from exclusions
      const courseIds = sorted.map(u => u.course_id);
      await supabase
        .from('user_top10_exclusions')
        .delete()
        .eq('user_id', userId)
        .in('course_id', courseIds);
    },
    onSuccess: invalidateTopTenQueries,
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
