/**
 * useQuestCourses - Hook for Quest Top 100 courses with actions
 * Handles played status, ratings, and real-time updates
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
  isPlayed: boolean;  // Canonical: from user_top100_courses.played ONLY
  isRated: boolean;   // Separate: has a course_ratings entry
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

  // Fetch all Top 100 courses with user status
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['quest-courses', userId],
    queryFn: async () => {
      if (!userId) return [];

      // Get all Top 100 courses
      const { data: allCourses, error: coursesError } = await supabase
        .from('golf_courses')
        .select('id, name, country, region, continent, global_rank, regional_rank, usa_rank, thumbnail_image')
        .or('global_rank.not.is.null,regional_rank.not.is.null')
        .order('global_rank', { nullsFirst: false });

      if (coursesError) throw coursesError;

      // Get user's played courses
      const { data: playedData } = await supabase
        .from('user_top100_courses')
        .select('course_id, played, played_date')
        .eq('user_id', userId);

      // Get user's ratings
      const { data: ratingsData } = await supabase
        .from('course_ratings')
        .select('course_id, rating, created_at')
        .eq('user_id', userId);

      // Get user's shortlisted courses (wishlist)
      const { data: shortlistData } = await supabase
        .from('course_shortlists')
        .select('course_id, created_at')
        .eq('user_id', userId);

      const playedMap = new Map(
        (playedData || []).map(p => [p.course_id, p])
      );
      const ratingsMap = new Map(
        (ratingsData || []).map(r => [r.course_id, r])
      );
      const shortlistSet = new Set(
        (shortlistData || []).map(s => s.course_id)
      );

      // Map to QuestCourse format
      return (allCourses || []).map((course): QuestCourse => {
        const played = playedMap.get(course.id);
        const rating = ratingsMap.get(course.id);
        
        // STRICT SEPARATION: played = explicit flag only, rated = has rating
        const isPlayed = !!played?.played;  // Canonical: played flag ONLY
        const isRated = !!rating;           // Separate: has rating
        
        // Determine region based on country/ranking
        let region = 'Worldwide';
        if (course.country === 'USA' || course.usa_rank) {
          region = 'USA';
        } else if (['England', 'Scotland', 'Wales', 'Ireland', 'Northern Ireland'].includes(course.country)) {
          region = 'GB & Ireland';
        } else if (course.continent === 'Europe') {
          region = 'Continental Europe';
        }

        const dateAdded = played?.played_date || rating?.created_at;

        return {
          id: course.id,
          name: course.name,
          region,
          country: course.country,
          rank: course.global_rank || course.regional_rank,
          isPlayed,
          isRated,
          isWishlist: shortlistSet.has(course.id) && !isPlayed,
          dateAdded: dateAdded ? new Date(dateAdded).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : undefined,
          rating: rating?.rating,
          imageUrl: course.thumbnail_image || undefined,
        };
      });
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // Calculate region progress
  const regionProgress: RegionProgress[] = [
    {
      id: 'gbi',
      name: 'GB & Ireland',
      shortName: 'GB&I',
      played: courses.filter(c => c.region === 'GB & Ireland' && c.isPlayed).length,
      total: courses.filter(c => c.region === 'GB & Ireland').length,
    },
    {
      id: 'europe',
      name: 'Continental Europe',
      shortName: 'EUR',
      played: courses.filter(c => c.region === 'Continental Europe' && c.isPlayed).length,
      total: courses.filter(c => c.region === 'Continental Europe').length,
    },
    {
      id: 'usa',
      name: 'USA',
      shortName: 'USA',
      played: courses.filter(c => c.region === 'USA' && c.isPlayed).length,
      total: courses.filter(c => c.region === 'USA').length,
    },
    {
      id: 'world',
      name: 'Worldwide',
      shortName: 'WLD',
      played: courses.filter(c => c.region === 'Worldwide' && c.isPlayed).length,
      total: courses.filter(c => c.region === 'Worldwide').length,
    },
  ];

  const totalPlayed = courses.filter(c => c.isPlayed).length;
  const recentlyPlayed = courses
    .filter(c => c.isPlayed && c.dateAdded)
    .sort((a, b) => {
      if (!a.dateAdded || !b.dateAdded) return 0;
      return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
    })
    .slice(0, 5);

  // Mark course as played
  const markPlayedMutation = useMutation({
    mutationFn: async ({ courseId, played }: { courseId: string; played: boolean }) => {
      if (!userId) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_top100_courses')
        .upsert({
          user_id: userId,
          course_id: courseId,
          played,
          played_date: played ? new Date().toISOString().split('T')[0] : null,
        }, {
          onConflict: 'user_id,course_id',
        });

      if (error) throw error;

      // If marking as played, remove from shortlist
      if (played) {
        await supabase
          .from('course_shortlists')
          .delete()
          .eq('user_id', userId)
          .eq('course_id', courseId);
      }
    },
    onMutate: async ({ courseId, played }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['quest-courses', userId] });
      const previousCourses = queryClient.getQueryData(['quest-courses', userId]);
      
      queryClient.setQueryData(['quest-courses', userId], (old: QuestCourse[] | undefined) =>
        old?.map(c =>
          c.id === courseId
            ? { ...c, isPlayed: played, isWishlist: played ? false : c.isWishlist, dateAdded: played ? 'Today' : undefined }
            : c
        )
      );

      return { previousCourses };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['quest-courses', userId], context?.previousCourses);
      toast.error('Failed to update');
    },
    onSuccess: (_, { played }) => {
      toast.success(played ? 'Added to Played' : 'Removed from Played');
      queryClient.invalidateQueries({ queryKey: ['quest-courses', userId] });
      queryClient.invalidateQueries({ queryKey: ['top100'] });
    },
  });

  // Toggle wishlist (shortlist)
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
        if (error && error.code !== '23505') throw error; // Ignore duplicate key
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
    markPlayed: (courseId: string, played: boolean) => markPlayedMutation.mutate({ courseId, played }),
    toggleWishlist: (courseId: string, wishlist: boolean) => toggleWishlistMutation.mutate({ courseId, wishlist }),
  };
}
