import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  fetchWhsConnection,
  fetchHandicapTrend,
  fetchLastRound,
  fetchCounters,
  fetchAllScores,
  fetchHandicapHistory,
  
  fetchFriendsActivity,
  fetchFriendCourseBests,
  fetchSentInvites,
  fetchCourseForm,
  fetchRoundDetail,
  fetchFriendRoundDetail,
  fetchFriendWindowRankings,
  fetchFriendFeaturedRound,
  fetchFriendRivalries,
  fetchFriendLeaderboard,
  fetchUserRivalOverrides,
  upsertUserRivalOverride,
  deleteUserRivalOverride,
  fetchSharedRounds,
  fetchTrophyAggregates,
} from './api';

export const whsKeys = {
  connection: (userId: string) => ['whs-connection', userId] as const,
  trend: (connectionId: string) => ['whs-handicap-trend', connectionId] as const,
  lastRound: (connectionId: string) => ['whs-last-round', connectionId] as const,
  counters: (connectionId: string) => ['whs-counters', connectionId] as const,
  allScores: (connectionId: string) => ['whs-all-scores', connectionId] as const,
  history: (connectionId: string, daysBack: number | 'all') =>
    ['whs-handicap-history', connectionId, daysBack] as const,
  
  friendWindowRankings: (ownerUserId: string) =>
    ['whs-friend-window-rankings', ownerUserId] as const,
  friendsActivity: (userId: string) => ['whs-friends-activity', userId] as const,
  friendCourseBests: (ownerUserId: string) =>
    ['whs-friend-course-bests', ownerUserId] as const,
  sentInvites: () => ['whs-sent-invites'] as const,
  courseForm: (connectionId: string, currentHandicap: number) =>
    ['whs-course-form', connectionId, currentHandicap] as const,
  roundDetail: (scoreId: string) =>
    ['whs-round-detail', scoreId] as const,
  friendFeaturedRound: (userId: string) => ['whs-friend-featured-round', userId] as const,
  friendRivalries: (userId: string) => ['whs-friend-rivalries', userId] as const,
  friendLeaderboard: (userId: string) => ['whs-friend-leaderboard', userId] as const,
  userRivalOverrides: (userId: string) => ['whs-user-rival-overrides', userId] as const,
  percentile: (userId: string) => ['whs', 'percentile', userId] as const,
};

export function useRoundDetail(
  scoreId: string | null | undefined,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: whsKeys.roundDetail(scoreId ?? ''),
    queryFn: () => fetchRoundDetail(scoreId as string),
    enabled: !!scoreId && enabled,
    staleTime: 60_000,
  });
}

export function useFriendRoundDetail(
  scoreId: string | null | undefined,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: ['whs-friend-round-detail', scoreId ?? ''],
    queryFn: () => fetchFriendRoundDetail(scoreId as string),
    enabled: !!scoreId && enabled,
    staleTime: 60_000,
  });
}

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



export function useAllScores(connectionId: string | undefined) {
  return useQuery({
    queryKey: whsKeys.allScores(connectionId ?? ''),
    queryFn: () => fetchAllScores(connectionId as string),
    enabled: !!connectionId,
    staleTime: 60_000,
  });
}

export function useHandicapHistory(
  connectionId: string | undefined,
  daysBack: number | 'all',
) {
  return useQuery({
    queryKey: whsKeys.history(connectionId ?? '', daysBack),
    queryFn: () => fetchHandicapHistory(connectionId as string, daysBack),
    enabled: !!connectionId,
    staleTime: 60_000,
  });
}

export function useFriendWindowRankings(ownerUserId: string | undefined) {
  return useQuery({
    queryKey: whsKeys.friendWindowRankings(ownerUserId ?? ''),
    queryFn: () => fetchFriendWindowRankings(ownerUserId as string),
    enabled: !!ownerUserId,
    staleTime: 60_000,
  });
}

export function useFriendsActivity(ownerUserId: string | undefined) {
  return useQuery({
    queryKey: whsKeys.friendsActivity(ownerUserId ?? ''),
    queryFn: () => fetchFriendsActivity(ownerUserId as string, 20),
    enabled: !!ownerUserId,
    staleTime: 30_000,
  });
}

export function useFriendCourseBests(ownerUserId: string | undefined) {
  return useQuery({
    queryKey: whsKeys.friendCourseBests(ownerUserId ?? ''),
    queryFn: () => fetchFriendCourseBests(ownerUserId as string),
    enabled: !!ownerUserId,
    staleTime: 60_000,
  });
}

export function useSentInvites() {
  return useQuery({
    queryKey: whsKeys.sentInvites(),
    queryFn: fetchSentInvites,
    staleTime: 30_000,
  });
}

export function useCourseForm(
  connectionId: string | undefined,
  currentHandicap: number | null | undefined,
) {
  return useQuery({
    queryKey: whsKeys.courseForm(connectionId ?? '', currentHandicap ?? NaN),
    // minRounds=1 — return ALL courses; CourseFormCard applies view-specific filtering.
    queryFn: () => fetchCourseForm(connectionId as string, currentHandicap as number, 1),
    enabled: !!connectionId && currentHandicap !== undefined && currentHandicap !== null,
    staleTime: 60_000,
  });
}

export type TryNextCourse = {
  id: string;
  name: string;
  region: string | null;
  country: string;
  country_rank: number | null;
  regional_rank: number | null;
  course_type: string | null;
};

async function fetchTryNextCourses(
  userId: string,
  countryCode: string,
  limit: number,
): Promise<TryNextCourse[]> {
  const { data: playedRows, error: playedErr } = await supabase
    .from('user_courses')
    .select('course_id')
    .eq('user_id', userId)
    .eq('played', true);
  if (playedErr) throw playedErr;
  const playedIds = new Set((playedRows ?? []).map((r: any) => r.course_id));

  const { data: courses, error } = await supabase
    .from('golf_courses')
    .select('id, name, region, country, country_rank, regional_rank, course_type')
    .eq('country_code', countryCode)
    .not('country_rank', 'is', null)
    .order('country_rank', { ascending: true })
    .limit(50);
  if (error) throw error;

  const filtered = (courses ?? [])
    .filter((c: any) => !playedIds.has(c.id))
    .slice(0, limit);
  return filtered as TryNextCourse[];
}

export function useTryNextCourses(
  userId: string | undefined,
  countryCode: string | null | undefined = 'GB',
  limit: number = 5,
) {
  return useQuery({
    queryKey: ['try-next-courses', userId ?? '', countryCode ?? 'GB', limit],
    queryFn: () => fetchTryNextCourses(userId as string, countryCode ?? 'GB', limit),
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
}
// ─── Phase 0 (Friends Tab Redesign): hooks ──────────────────────────────

export function useFriendFeaturedRound(userId: string | undefined) {
  return useQuery({
    queryKey: whsKeys.friendFeaturedRound(userId ?? ''),
    queryFn: () => fetchFriendFeaturedRound(userId as string),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export function useFriendRivalries(userId: string | undefined) {
  return useQuery({
    queryKey: whsKeys.friendRivalries(userId ?? ''),
    queryFn: () => fetchFriendRivalries(userId as string),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export function useFriendLeaderboard(userId: string | undefined) {
  return useQuery({
    queryKey: whsKeys.friendLeaderboard(userId ?? ''),
    queryFn: () => fetchFriendLeaderboard(userId as string),
    enabled: !!userId,
    staleTime: 30_000,
  });
}

export function useUserRivalOverrides(userId: string | undefined) {
  return useQuery({
    queryKey: whsKeys.userRivalOverrides(userId ?? ''),
    queryFn: () => fetchUserRivalOverrides(userId as string),
    enabled: !!userId,
    staleTime: 0,
  });
}

export function useUpsertRivalOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      userId: string;
      slotIndex: number;
      rival_user_id?: string;
      rival_friend_row_id?: string;
    }) =>
      upsertUserRivalOverride(params.userId, params.slotIndex, {
        rival_user_id: params.rival_user_id,
        rival_friend_row_id: params.rival_friend_row_id,
      }),
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: whsKeys.userRivalOverrides(params.userId) });
      queryClient.invalidateQueries({ queryKey: whsKeys.friendRivalries(params.userId) });
    },
  });
}

export function useDeleteRivalOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { userId: string; slotIndex: number }) =>
      deleteUserRivalOverride(params.userId, params.slotIndex),
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: whsKeys.userRivalOverrides(params.userId) });
      queryClient.invalidateQueries({ queryKey: whsKeys.friendRivalries(params.userId) });
    },
  });
}

export function useSharedRounds(
  userId: string | undefined,
  rivalUserId: string | null,
) {
  return useQuery({
    queryKey: ['whs-shared-rounds', userId ?? '', rivalUserId ?? ''],
    queryFn: () => fetchSharedRounds(userId as string, rivalUserId),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

// ─── Trophy aggregates (Sprint 3) ───────────────────────────────────────
export function useTrophyAggregates(
  userId: string | undefined,
  connectionId: string | undefined,
) {
  return useQuery({
    queryKey: ['trophy-aggregates', userId, connectionId],
    enabled: !!userId && !!connectionId,
    queryFn: () => fetchTrophyAggregates(userId!, connectionId!),
    staleTime: 5 * 60 * 1000,
  });
}
