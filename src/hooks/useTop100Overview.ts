import { useQuery } from '@tanstack/react-query';
import { useTop100ProgressForUser } from './useTop100ProgressForUser';
import { getTop100Club } from '@/lib/top100Club';
import type { Top100Ring } from '@/lib/top100Club';

export interface Top100Overview {
  total_played: number;
  total_rated: number; // NEW: ratings-based count
  regions_count: number;
  club_label: string | null; // NEW: e.g. "50 Club"
  club_ring: Top100Ring; // NEW: ring tier
}

// Removed: old getCurrentMilestoneLabel - now using getTop100Club

export function useTop100Overview(userId?: string | null) {
  const { data: progress, isLoading, error } = useTop100ProgressForUser(userId);

  return useQuery<Top100Overview>({
    queryKey: ['top100-overview', userId],
    enabled: !!userId && !isLoading,
    queryFn: async () => {
      if (!progress) {
        return {
          total_played: 0,
          total_rated: 0,
          regions_count: 0,
          club_label: null,
          club_ring: 'none' as Top100Ring,
        };
      }

      const totalRated = progress.total_top100_rated ?? progress.total_played_top100 ?? 0;
      const club = getTop100Club(totalRated);

      return {
        total_played: progress.total_played_top100, // kept for compatibility
        total_rated: totalRated,
        regions_count: progress.regions_count,
        club_label: club?.label ?? null,
        club_ring: club?.ring ?? 'none',
      };
    },
    initialData: progress ? (() => {
      const totalRated = progress.total_top100_rated ?? progress.total_played_top100 ?? 0;
      const club = getTop100Club(totalRated);
      return {
        total_played: progress.total_played_top100,
        total_rated: totalRated,
        regions_count: progress.regions_count,
        club_label: club?.label ?? null,
        club_ring: club?.ring ?? 'none',
      };
    })() : undefined,
    staleTime: 60 * 1000,
  });
}
