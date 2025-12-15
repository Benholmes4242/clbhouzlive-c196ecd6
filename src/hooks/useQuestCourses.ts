/**
 * useQuestCourses - Hook for Quest Top 100 courses with actions
 * RATINGS-ONLY: A course counts only if course_ratings.rating IS NOT NULL
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';
import { toast } from 'sonner';

export interface QuestCourse {
  id: string;
  name: string;
  region: string;
  country: string;
  rank?: number;
  isPlayed: boolean;  // Now derived ONLY from course_ratings (has rating = played)
  isRated: boolean;   // Same as isPlayed in ratings-only system
  isWishlist: boolean;
  dateAdded?: string;
  rating?: number;
  imageUrl?: string;
}

export interface RegionProgress {
  id: string;
  name: string;
  shortName: string;
  played: number;
  total: number;
}

export function useQuestCourses() {
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  const userId = user?.id;

  // Fetch Top 100 courses and region progress (same source as My Progress page)
  const { data, isLoading } = useQuery({
    queryKey: ['quest-courses', userId],
    queryFn: async () => {
      if (!userId) return { courses: [], regionProgress: [] };

      // Get all active Top 100 lists with their course counts
      const { data: lists, error: listsError } = await supabase
        .from('top100_lists')
        .select('id, slug, name')
        .eq('is_active', true)
        .order('sort_order');

      if (listsError) throw listsError;

      // Get user's ratings (SINGLE SOURCE OF TRUTH for "played")
      const { data: ratingsData } = await supabase
        .from('course_ratings')
        .select('course_id, rating, created_at')
        .eq('user_id', userId)
        .eq('is_mock', false);

      const ratingsMap = new Map(
        (ratingsData || []).filter(r => r.rating !== null).map(r => [r.course_id, r])
      );
      const ratedCourseIds = new Set(ratingsMap.keys());

      // Get user's shortlisted courses (wishlist)
      const { data: shortlistData } = await supabase
        .from('course_shortlists')
        .select('course_id')
        .eq('user_id', userId);

      const shortlistSet = new Set((shortlistData || []).map(s => s.course_id));

      // Build region progress per-list (same approach as useTop100ProgressForUser)
      const regionProgress: RegionProgress[] = [];
      const allCourses: QuestCourse[] = [];
      const seenCourseIds = new Set<string>();

      // Map list slug to display names
      const slugToNames: Record<string, { name: string; shortName: string }> = {
        'gb-i': { name: 'GB & Ireland', shortName: 'GB&I' },
        'europe': { name: 'Continental Europe', shortName: 'EUR' },
        'usa': { name: 'USA', shortName: 'USA' },
        'global': { name: 'Worldwide', shortName: 'WLD' },
      };

      for (const list of lists || []) {
        // Get total courses in this list
        const { count: totalInList } = await supabase
          .from('course_top100_memberships')
          .select('*', { count: 'exact', head: true })
          .eq('list_id', list.id);

        // Get all courses in this list with details
        const { data: memberships } = await supabase
          .from('course_top100_memberships')
          .select(`
            course_id,
            rank,
            golf_courses!inner(id, name, country, thumbnail_image)
          `)
          .eq('list_id', list.id);

        // Count rated courses in this list
        let ratedInList = 0;
        for (const m of memberships || []) {
          if (ratedCourseIds.has(m.course_id)) {
            ratedInList++;
          }

          // Add to courses list (dedupe across lists)
          if (!seenCourseIds.has(m.course_id)) {
            seenCourseIds.add(m.course_id);
            const rating = ratingsMap.get(m.course_id);
            const isRated = !!rating;
            const displayNames = slugToNames[list.slug] || { name: 'Worldwide', shortName: 'WLD' };

            allCourses.push({
              id: m.course_id,
              name: (m.golf_courses as any)?.name || 'Unknown Course',
              region: displayNames.name,
              country: (m.golf_courses as any)?.country || '',
              rank: m.rank,
              isPlayed: isRated,
              isRated,
              isWishlist: shortlistSet.has(m.course_id) && !isRated,
              dateAdded: rating?.created_at 
                ? new Date(rating.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) 
                : undefined,
              rating: rating?.rating,
              imageUrl: (m.golf_courses as any)?.thumbnail_image || undefined,
            });
          }
        }

        const displayNames = slugToNames[list.slug];
        if (displayNames) {
          regionProgress.push({
            id: list.slug,
            name: displayNames.name,
            shortName: displayNames.shortName,
            played: ratedInList,
            total: totalInList || 0,
          });
        }
      }

      return { courses: allCourses, regionProgress };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const courses = data?.courses || [];

  const regionProgress = data?.regionProgress || [];

  const totalPlayed = courses.filter(c => c.isRated).length;
  const recentlyPlayed = courses
    .filter(c => c.isRated && c.dateAdded)
    .sort((a, b) => {
      if (!a.dateAdded || !b.dateAdded) return 0;
      return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
    })
    .slice(0, 5);

  // Toggle wishlist (shortlist) - unchanged
  const toggleWishlistMutation = useMutation({
    mutationFn: async ({ courseId, wishlist }: { courseId: string; wishlist: boolean }) => {
      if (!userId) throw new Error('Not authenticated');

      if (wishlist) {
        const { error } = await supabase
          .from('course_shortlists')
          .insert({
            user_id: userId,
            course_id: courseId,
          });
        if (error && error.code !== '23505') throw error;
      } else {
        const { error } = await supabase
          .from('course_shortlists')
          .delete()
          .eq('user_id', userId)
          .eq('course_id', courseId);
        if (error) throw error;
      }
    },
    onMutate: async ({ courseId, wishlist }) => {
      await queryClient.cancelQueries({ queryKey: ['quest-courses', userId] });
      const previousCourses = queryClient.getQueryData(['quest-courses', userId]);
      
      queryClient.setQueryData(['quest-courses', userId], (old: QuestCourse[] | undefined) =>
        old?.map(c =>
          c.id === courseId ? { ...c, isWishlist: wishlist } : c
        )
      );

      return { previousCourses };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['quest-courses', userId], context?.previousCourses);
      toast.error('Failed to update');
    },
    onSuccess: (_, { wishlist }) => {
      toast.success(wishlist ? 'Added to Wishlist' : 'Removed from Wishlist');
      queryClient.invalidateQueries({ queryKey: ['quest-courses', userId] });
    },
  });

  return {
    courses,
    isLoading,
    totalPlayed,
    regionProgress,
    recentlyPlayed,
    toggleWishlist: (courseId: string, wishlist: boolean) => toggleWishlistMutation.mutate({ courseId, wishlist }),
  };
}
