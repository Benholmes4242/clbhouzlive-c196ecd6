import { useQuery } from '@tanstack/react-query';
import { getOverview, getTimeseries, getTopTags, getExportFormats, getTopThreads, getOverviewDelta, DateRange } from '../api/analytics';

export function useAnalyticsOverview(range: DateRange, filters: { event?: string; userId?: string; tag?: string }) {
  return useQuery({
    queryKey: ['admin.analytics.overview', range, filters],
    queryFn: () => getOverview({ range, ...filters }),
    staleTime: 30_000,
  });
}

export function useAnalyticsTimeseries(range: DateRange, filters: { event?: string; userId?: string; tag?: string }) {
  return useQuery({
    queryKey: ['admin.analytics.timeseries', range, filters],
    queryFn: () => getTimeseries({ range, ...filters }),
    staleTime: 30_000,
  });
}

export function useAnalyticsTopTags(range: DateRange, userId?: string) {
  return useQuery({
    queryKey: ['admin.analytics.topTags', range, userId],
    queryFn: () => getTopTags(range, userId),
    staleTime: 30_000,
  });
}

export function useAnalyticsExportFormats(range: DateRange) {
  return useQuery({
    queryKey: ['admin.analytics.exportFormats', range],
    queryFn: () => getExportFormats(range),
    staleTime: 30_000,
  });
}

export function useAnalyticsTopThreads(range: DateRange) {
  return useQuery({
    queryKey: ['admin.analytics.topThreads', range],
    queryFn: () => getTopThreads(range),
    staleTime: 30_000,
  });
}

export function useAnalyticsOverviewDelta(range: DateRange) {
  return useQuery({
    queryKey: ['admin.analytics.overviewDelta', range],
    queryFn: () => getOverviewDelta(range),
    staleTime: 30_000,
  });
}
