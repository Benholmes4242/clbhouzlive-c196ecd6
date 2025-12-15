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
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['quest-courses', userId],
    queryFn: async () => {
      if (!userId) return [];

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

      // Map list slug to region name
      const listToRegion: Record<string, string> = {
        'world': 'Worldwide',
        'worldwide': 'Worldwide',
        'gbi': 'GB & Ireland',
        'usa': 'USA',
        'europe': 'Continental Europe',
      };

      // Deduplicate courses by course_id (a course can be on multiple lists)
      const courseMap = new Map<string, QuestCourse>();
      
      for (const m of memberships || []) {
        const rating = ratingsMap.get(m.course_id);
        
        // RATINGS-ONLY: isPlayed = has a rating
        const isRated = !!rating;
        const isPlayed = isRated;
        
        // Get region from list slug
        const listSlug = (m.list as any)?.slug || 'world';
        const region = listToRegion[listSlug] || 'Worldwide';

        const dateAdded = rating?.created_at;

        // Only add if not already in map, or if this is a more specific region
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
            dateAdded: dateAdded ? new Date(dateAdded).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : undefined,
            rating: rating?.rating,
            imageUrl: (m.course as any)?.thumbnail_image || undefined,
          });
        }
      }
      
      return Array.from(courseMap.values());
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // Calculate region progress (RATINGS-ONLY counts)
  const regionProgress: RegionProgress[] = [
    {
      id: 'gbi',
      name: 'GB & Ireland',
      shortName: 'GB&I',
      played: courses.filter(c => c.region === 'GB & Ireland' && c.isRated).length,
      total: courses.filter(c => c.region === 'GB & Ireland').length,
    },
    {
      id: 'europe',
      name: 'Continental Europe',
      shortName: 'EUR',
      played: courses.filter(c => c.region === 'Continental Europe' && c.isRated).length,
      total: courses.filter(c => c.region === 'Continental Europe').length,
    },
    {
      id: 'usa',
      name: 'USA',
      shortName: 'USA',
      played: courses.filter(c => c.region === 'USA' && c.isRated).length,
      total: courses.filter(c => c.region === 'USA').length,
    },
    {
      id: 'world',
      name: 'Worldwide',
      shortName: 'WLD',
      played: courses.filter(c => c.region === 'Worldwide' && c.isRated).length,
      total: courses.filter(c => c.region === 'Worldwide').length,
    },
  ];

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
