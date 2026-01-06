/**
 * @deprecated This hook uses the legacy JSON-based storage (user_top_ten_lists table).
 * Use `useUserTopTenCourses` instead, which uses the normalized `user_top_ten_courses` table.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export type Course = {
  id: string;
  name: string;
  country?: string;
  sub_country?: string;
  region?: string;
  thumbnail_image?: string;
  global_rank?: number | null;
  regional_rank?: number | null;
  usa_rank?: number | null;
};

const normalize10 = (arr: any[]): (Course | undefined)[] =>
  Array.from({ length: 10 }, (_, i) => arr?.[i] ?? undefined);

export function useUserTopTen(profileOwnerId: string | undefined) {
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  
  // Check if current user can edit this Top 10 list
  const canEdit = user?.id === profileOwnerId;

  // Query to fetch Top 10 for the specific profile owner
  const { data: topTen = normalize10([]), isLoading, error } = useQuery({
    enabled: !!profileOwnerId,
    queryKey: ['user-top-ten', profileOwnerId], // Scoped cache key
    queryFn: async () => {
      console.log('useUserTopTen: Fetching Top 10 for user:', profileOwnerId);
      
      const { data, error } = await supabase
        .from('user_top_ten_lists')
        .select('courses')
        .eq('user_id', profileOwnerId) // CRITICAL: filter by profile owner
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching Top 10:', error);
        throw error;
      }
      
      console.log('useUserTopTen: Fetched data:', data);
      return normalize10((data?.courses as any[]) ?? []);
    },
    staleTime: 60_000, // Cache for 1 minute
  });

  // Mutation to save Top 10 (only for own profile)
  const saveMutation = useMutation({
    mutationFn: async (courses: (Course | undefined)[]) => {
      if (!canEdit || !profileOwnerId) {
        throw new Error('Cannot edit this Top 10 list');
      }

      console.log('useUserTopTen: Saving Top 10 for user:', profileOwnerId, courses);

      const payload = {
        user_id: profileOwnerId,
        courses: normalize10(courses),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('user_top_ten_lists')
        .upsert(payload, { onConflict: 'user_id' });
      
      if (error) {
        console.error('Error saving Top 10:', error);
        throw error;
      }

      return normalize10(courses);
    },
    onSuccess: (data) => {
      // Update the cache with the new data
      queryClient.setQueryData(['user-top-ten', profileOwnerId], data);
      console.log('useUserTopTen: Top 10 saved successfully');
    },
    onError: (error) => {
      console.error('useUserTopTen: Failed to save Top 10:', error);
    }
  });

  // Helper functions for manipulating the Top 10
  const isInTopTen = (courseId: string) => topTen.some((c) => c?.id === courseId);

  const addCourseAtIndex = (course: Course, index: number) => {
    if (!canEdit || isInTopTen(course.id)) return;
    
    const copy = [...topTen];
    copy[index] = course;
    saveMutation.mutate(copy);
  };

  const moveCourse = (fromIndex: number, toIndex: number) => {
    if (!canEdit || fromIndex === toIndex) return;
    
    const copy = [...topTen];
    const item = copy[fromIndex];
    copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, item);
    copy.length = 10; // Ensure exactly 10 items
    saveMutation.mutate(copy);
  };

  const removeCourse = (index: number) => {
    if (!canEdit) return;
    
    const copy = [...topTen];
    copy[index] = undefined;
    saveMutation.mutate(copy);
  };

  const clearAll = () => {
    if (!canEdit) return;
    
    saveMutation.mutate(normalize10([]));
  };

  return {
    topTen,
    loading: isLoading,
    error: error ? String(error) : null,
    canEdit,
    isInTopTen,
    addCourseAtIndex,
    moveCourse,
    removeCourse,
    clearAll,
    isSaving: saveMutation.isPending
  };
}