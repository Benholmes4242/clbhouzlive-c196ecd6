import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Phase 1 Fix #2: Shared hook for club media to prevent triple API calls
 * Single source of truth for all media queries across CourseMediaTab and AboutMediaStrip
 */
export const useClubMedia = (clubId: string, limit: number = 30) => {
  return useQuery({
    queryKey: ['club-media', clubId], // Unified key - limit is ignored for caching
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-club-media', {
        body: { clubId, limit: 30 } // Always fetch 30, slice in component
      });

      if (error) throw error;
      return data?.edges ?? [];
    },
    enabled: !!clubId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
