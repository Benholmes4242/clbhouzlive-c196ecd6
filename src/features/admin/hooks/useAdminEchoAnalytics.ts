import { useQuery } from '@tanstack/react-query';
import {
  getAdminEchoKPIs,
  getAdminEchoTimeseries,
  getAdminEchoTopTags,
  getAdminEchoRates,
} from '../api/adminEchoAnalytics';

export function useAdminEchoKPIs() {
  return useQuery({
    queryKey: ['admin', 'echo', 'kpis'],
    queryFn: getAdminEchoKPIs,
    staleTime: 60_000,
  });
}

export function useAdminEchoTimeseries() {
  return useQuery({
    queryKey: ['admin', 'echo', 'timeseries'],
    queryFn: getAdminEchoTimeseries,
    staleTime: 60_000,
  });
}

export function useAdminEchoTopTags() {
  return useQuery({
    queryKey: ['admin', 'echo', 'topTags'],
    queryFn: getAdminEchoTopTags,
    staleTime: 60_000,
  });
}

export function useAdminEchoRates() {
  return useQuery({
    queryKey: ['admin', 'echo', 'rates'],
    queryFn: getAdminEchoRates,
    staleTime: 60_000,
  });
}
