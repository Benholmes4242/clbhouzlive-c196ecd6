import { useQuery } from '@tanstack/react-query';
import { useTop100ProgressForUser } from './useTop100ProgressForUser';
import { getTop100PrestigeRing, getTop100MilestoneLabel, Top100PrestigeRing } from '@/lib/top100Prestige';

export interface Top100Overview {
  total_played: number;
  regions_count: number;
  milestone_label: string | null;
  prestige_ring?: Top100PrestigeRing;
}

function getCurrentMilestoneLabel(count: number): string | null {
  if (count >= 100) return '100 Century Club';
  if (count >= 50) return '50 Club';
  if (count >= 20) return '20 Club';
  return null;
}

export function useTop100Overview(userId?: string | null) {
  const { data: progress, isLoading, error } = useTop100ProgressForUser(userId);

  return useQuery<Top100Overview>({
    queryKey: ['top100-overview', userId],
    enabled: !!userId && !isLoading,
    queryFn: async () => {
      if (!progress) {
        return {
          total_played: 0,
          regions_count: 0,
          milestone_label: null,
        };
      }

      return {
        total_played: progress.total_played_top100,
        regions_count: progress.regions_count,
        milestone_label: getCurrentMilestoneLabel(progress.total_played_top100),
        prestige_ring: getTop100PrestigeRing(progress.total_played_top100),
      };
    },
    initialData: progress ? {
      total_played: progress.total_played_top100,
      regions_count: progress.regions_count,
      milestone_label: getCurrentMilestoneLabel(progress.total_played_top100),
      prestige_ring: getTop100PrestigeRing(progress.total_played_top100),
    } : undefined,
    staleTime: 60 * 1000,
  });
}
