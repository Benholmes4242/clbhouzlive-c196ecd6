import { useQuery } from '@tanstack/react-query';
import { fetchSwingHistory, SwingItem } from '../data/history.fetchers';

export function useSwingHistory(opts?: { limit?: number; enabled?: boolean }) {
  const limit = opts?.limit ?? 20;
  return useQuery<SwingItem[]>({
    queryKey: ['swingHistory', limit],
    queryFn: () => fetchSwingHistory(limit),
    enabled: opts?.enabled ?? true,
    staleTime: 30_000,
  });
}
