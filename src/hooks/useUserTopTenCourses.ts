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
  is_pinned: boolean;
  rating?: number | null;
}

/**
 * Fetches user's Top 10 courses with auto-population logic:
 * 1. Pinned courses (manually positioned) are shown at their set positions
 * 2. Remaining slots are filled with highest-rated courses (auto-populated)
 * 3. Excluded courses are never shown
 */
export function useUserTopTenCourses(userId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: topTen = [], isLoading } = useQuery({
    queryKey: ['user-top-ten-courses', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];

      // 1. Get pinned entries (manually positioned)
      const { data: pinnedData, error: pinnedError } = await supabase
        .from('user_top_ten_courses')
        .select(`
          id,
          position,
          course_id,
          is_pinned,
          golf_courses!inner (
            name,
            country,
            sub_country,
            region,
            thumbnail_image,
            global_rank,
            regional_rank,
            usa_rank
          )
        `)
        .eq('user_id', userId)
        .eq('is_pinned', true)
        .order('position', { ascending: true });

      if (pinnedError) throw pinnedError;

      const pinnedCourses: TopTenCourse[] = (pinnedData || []).map((p: any) => ({
        id: p.id,
        position: p.position,
        course_id: p.course_id,
        is_pinned: true,
        name: p.golf_courses?.name || '',
        country: p.golf_courses?.country || '',
        sub_country: p.golf_courses?.sub_country,
        region: p.golf_courses?.region,
        thumbnail_image: p.golf_courses?.thumbnail_image,
        global_rank: p.golf_courses?.global_rank,
        regional_rank: p.golf_courses?.regional_rank,
        usa_rank: p.golf_courses?.usa_rank,
        rating: null,
      }));

      const pinnedIds = pinnedCourses.map(p => p.course_id);

      // 2. Get exclusions
      const { data: exclusionsData } = await supabase
        .from('user_top10_exclusions')
        .select('course_id')
        .eq('user_id', userId);

      const excludedIds = (exclusionsData || []).map(e => e.course_id);

      // 3. Calculate how many auto slots we need
      const autoSlotsNeeded = 10 - pinnedCourses.length;

      // 4. Get top rated courses (excluding pinned and excluded)
      let autoCourses: TopTenCourse[] = [];
      
      if (autoSlotsNeeded > 0) {
        const excludeList = [...pinnedIds, ...excludedIds];
        
        // Build query for rated courses
        let query = supabase
          .from('course_ratings')
          .select(`
            course_id,
            rating,
            golf_courses!inner (
              id,
              name,
              country,
              sub_country,
              region,
              thumbnail_image,
              global_rank,
              regional_rank,
              usa_rank
            )
          `)
          .eq('user_id', userId)
          .eq('is_mock', false)
          .order('rating', { ascending: false })
          .limit(autoSlotsNeeded + excludeList.length); // Fetch extra to filter

        const { data: ratedData, error: ratedError } = await query;

        if (ratedError) throw ratedError;

        // Filter out excluded/pinned and take what we need
        const filteredRated = (ratedData || [])
          .filter((r: any) => !excludeList.includes(r.course_id))
          .slice(0, autoSlotsNeeded);

        // Calculate positions for auto courses (fill gaps after pinned)
        const usedPositions = new Set(pinnedCourses.map(p => p.position));
        let nextAutoPosition = 1;

        autoCourses = filteredRated.map((r: any) => {
          // Find next available position
          while (usedPositions.has(nextAutoPosition) && nextAutoPosition <= 10) {
            nextAutoPosition++;
          }
          const position = nextAutoPosition;
          usedPositions.add(position);
          nextAutoPosition++;

          return {
            id: `auto-${r.course_id}`,
            position,
            course_id: r.course_id,
            is_pinned: false,
            name: r.golf_courses?.name || '',
            country: r.golf_courses?.country || '',
            sub_country: r.golf_courses?.sub_country,
            region: r.golf_courses?.region,
            thumbnail_image: r.golf_courses?.thumbnail_image,
            global_rank: r.golf_courses?.global_rank,
            regional_rank: r.golf_courses?.regional_rank,
            usa_rank: r.golf_courses?.usa_rank,
            rating: r.rating,
          };
        });
      }

      // 5. Merge and sort by position
      const combined = [...pinnedCourses, ...autoCourses]
        .sort((a, b) => a.position - b.position)
        .slice(0, 10);

      return combined;
    },
    staleTime: 5_000,
  });

  const invalidateTopTenQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['user-top-ten-courses'], exact: false }),
      queryClient.invalidateQueries({ queryKey: ['userTopTenCourses'], exact: false }),
      queryClient.invalidateQueries({ queryKey: ['user_top_ten_courses_view'], exact: false }),
    ]);
    await queryClient.refetchQueries({ queryKey: ['user-top-ten-courses', userId], exact: true, type: 'active' });
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

      // Delete from pinned if it was pinned
      if (course?.is_pinned) {
        const { error: deleteError } = await supabase
          .from('user_top_ten_courses')
          .delete()
          .eq('user_id', userId)
          .eq('course_id', courseId);

        if (deleteError) throw deleteError;

        // Repack remaining pinned positions
        const remainingPinned = topTen
          .filter(c => c.course_id !== courseId && c.is_pinned)
          .sort((a, b) => a.position - b.position);

        if (remainingPinned.length > 0) {
          const { error: reorderError } = await supabase.rpc('reorder_after_removal', {
            p_user_id: userId,
            p_course_ids: remainingPinned.map(c => c.course_id),
          });
          if (reorderError) throw reorderError;
        }
      }

      // Add to exclusions so it won't auto-populate
      const { error: excludeError } = await supabase
        .from('user_top10_exclusions')
        .upsert({
          user_id: userId,
          course_id: courseId,
        }, {
          onConflict: 'user_id,course_id',
          ignoreDuplicates: true,
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
