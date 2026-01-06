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

  // Fetch Top 100 courses via course_top100_memberships (same source as My Progress page)
  const { data: questData, isLoading } = useQuery({
    queryKey: ['quest-courses', userId],
    queryFn: async () => {
      if (!userId) return { courses: [], listProgress: {} };

      // Get all Top 100 courses with their list memberships (single source of truth)
      const { data: memberships, error: membershipError } = await supabase
        .from('course_top100_memberships')
        .select(`
          course_id,
          rank,
          list:top100_lists!inner(id, slug, name),
          course:golf_courses!inner(id, name, country, region, continent, thumbnail_image)
        `);

      if (membershipError) throw membershipError;

      // Get user's ratings (SINGLE SOURCE OF TRUTH for "played")
      const { data: ratingsData } = await supabase
        .from('course_ratings')
        .select('course_id, rating, created_at')
        .eq('user_id', userId)
        .eq('is_mock', false);

      // Get user's shortlisted courses (wishlist)
      const { data: shortlistData } = await supabase
        .from('course_shortlists')
        .select('course_id, created_at')
        .eq('user_id', userId);

      const ratingsMap = new Map(
        (ratingsData || []).filter(r => r.rating !== null).map(r => [r.course_id, r])
      );
      const shortlistSet = new Set(
        (shortlistData || []).map(s => s.course_id)
      );

      // Map list slug to region name (must match actual slugs from top100_lists table)
      const listToRegion: Record<string, string> = {
        'global': 'Worldwide',
        'gb-i': 'GB & Ireland',
        'usa': 'USA',
        'europe': 'Continental Europe',
      };

      // Calculate list progress FIRST (before deduplication)
      // This ensures each list gets its own accurate count
      const listProgress: Record<string, { played: number; total: number }> = {
        'global': { played: 0, total: 0 },
        'gb-i': { played: 0, total: 0 },
        'usa': { played: 0, total: 0 },
        'europe': { played: 0, total: 0 },
      };

      // Count per list (courses can be on multiple lists)
      const listCourses: Record<string, Set<string>> = {
        'global': new Set(),
        'gb-i': new Set(),
        'usa': new Set(),
        'europe': new Set(),
      };

      for (const m of memberships || []) {
        const listSlug = (m.list as any)?.slug;
        if (!listSlug || !listProgress[listSlug]) continue;

        // Only count each course once per list
        if (!listCourses[listSlug].has(m.course_id)) {
          listCourses[listSlug].add(m.course_id);
          listProgress[listSlug].total++;
          
          const rating = ratingsMap.get(m.course_id);
          if (rating) {
            listProgress[listSlug].played++;
          }
        }
      }

      // Deduplicate courses for the flat list (for totalPlayed and recently played)
      // Store raw ISO date for proper sorting, format display date separately
      const courseMap = new Map<string, QuestCourse & { rawDate?: string }>();
      
      for (const m of memberships || []) {
        const rating = ratingsMap.get(m.course_id);
        const isRated = !!rating;
        const isPlayed = isRated;
        const listSlug = (m.list as any)?.slug || 'global';
        const region = listToRegion[listSlug] || 'Worldwide';
        const rawDate = rating?.created_at;

        if (!courseMap.has(m.course_id)) {
          courseMap.set(m.course_id, {
            id: m.course_id,
            name: (m.course as any)?.name || 'Unknown Course',
            region,
            country: (m.course as any)?.country || '',
            rank: m.rank,
            isPlayed,
            isRated,
            isWishlist: shortlistSet.has(m.course_id) && !isPlayed,
            dateAdded: rawDate ? new Date(rawDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : undefined,
            rating: rating?.rating,
            imageUrl: (m.course as any)?.thumbnail_image || undefined,
            rawDate, // Keep raw ISO date for sorting
          });
        }
      }
      
      return {
        courses: Array.from(courseMap.values()),
        listProgress,
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const courses = questData?.courses || [];
  const listProgress = questData?.listProgress || {};

  // Calculate region progress from pre-calculated listProgress (matches Top 100 list page exactly)
  const regionProgress: RegionProgress[] = [
    {
      id: 'gb-i',
      name: 'GB & Ireland',
      shortName: 'GB&I',
      played: listProgress['gb-i']?.played || 0,
      total: listProgress['gb-i']?.total || 0,
    },
    {
      id: 'europe',
      name: 'Continental Europe',
      shortName: 'EUR',
      played: listProgress['europe']?.played || 0,
      total: listProgress['europe']?.total || 0,
    },
    {
      id: 'usa',
      name: 'USA',
      shortName: 'USA',
      played: listProgress['usa']?.played || 0,
      total: listProgress['usa']?.total || 0,
    },
    {
      id: 'global',
      name: 'Worldwide',
      shortName: 'WLD',
      played: listProgress['global']?.played || 0,
      total: listProgress['global']?.total || 0,
    },
  ];

  const totalPlayed = courses.filter(c => c.isRated).length;
  const recentlyPlayed = courses
    .filter(c => c.isRated && (c as any).rawDate)
    .sort((a, b) => {
      const aDate = (a as any).rawDate;
      const bDate = (b as any).rawDate;
      if (!aDate || !bDate) return 0;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    })
    .slice(0, 10);

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
