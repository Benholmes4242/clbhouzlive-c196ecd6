import { useQuery } from '@tanstack/react-query';
import {
  fetchWhsConnection,
  fetchHandicapTrend,
  fetchLastRound,
  fetchCounters,
  fetchRecentRounds,
} from './api';

export const whsKeys = {
  connection: (userId: string) => ['whs-connection', userId] as const,
  trend: (connectionId: string) => ['whs-handicap-trend', connectionId] as const,
  lastRound: (connectionId: string) => ['whs-last-round', connectionId] as const,
  counters: (connectionId: string) => ['whs-counters', connectionId] as const,
  recent: (connectionId: string) => ['whs-recent-rounds', connectionId] as const,
};

export function useWhsConnection(userId: string | undefined) {
  return useQuery({
    queryKey: whsKeys.connection(userId ?? ''),
    queryFn: () => fetchWhsConnection(userId as string),
    enabled: !!userId,
    staleTime: 30_000,
  });
}

export function useHandicapTrend(connectionId: string | undefined) {
  return useQuery({
    queryKey: whsKeys.trend(connectionId ?? ''),
    queryFn: () => fetchHandicapTrend(connectionId as string),
    enabled: !!connectionId,
    staleTime: 60_000,
  });
}

export function useLastRound(connectionId: string | undefined) {
  return useQuery({
    queryKey: whsKeys.lastRound(connectionId ?? ''),
    queryFn: () => fetchLastRound(connectionId as string),
    enabled: !!connectionId,
    staleTime: 60_000,
  });
}

export function useCounters(connectionId: string | undefined) {
  return useQuery({
    queryKey: whsKeys.counters(connectionId ?? ''),
    queryFn: () => fetchCounters(connectionId as string),
    enabled: !!connectionId,
    staleTime: 60_000,
  });
}

export function useRecentRounds(connectionId: string | undefined) {
  return useQuery({
    queryKey: whsKeys.recent(connectionId ?? ''),
    queryFn: () => fetchRecentRounds(connectionId as string),
    enabled: !!connectionId,
    staleTime: 60_000,
  });
}
