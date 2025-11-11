import { useQuery } from '@tanstack/react-query';
import { fetchAdminInsights, AdminInsights } from '../api/insights';

export function useAdminInsights(days = 30) {
  return useQuery<AdminInsights>({
    queryKey: ['echo.admin.insights', days],
    queryFn: () => fetchAdminInsights(days),
    staleTime: 60_000,
  });
}
