import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LaunchSheetPayload {
  launch_seen_at: string | null;
  achievements_earned: number;
  active_streaks: number;
  shared_rounds: number;
}

const QUERY_KEY = (userId: string) => ['gam-launch-payload', userId] as const;

/**
 * One-shot launch sheet state.
 *
 * Single roundtrip: get_gam_launch_payload(p_user_id) returns
 * { launch_seen_at, achievements_earned, active_streaks, shared_rounds }
 * in one atomic snapshot.
 */
export function useLaunchSheetState(userId: string | null) {
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: userId ? QUERY_KEY(userId) : ['gam-launch-payload', 'anon'],
    queryFn: async (): Promise<LaunchSheetPayload | null> => {
      if (!userId) return null;
      const { data, error } = await supabase.rpc('get_gam_launch_payload', {
        p_user_id: userId,
      });
      if (error) throw error;
      return (data as unknown as LaunchSheetPayload) ?? null;
    },
    enabled: !!userId,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  });

  const dismiss = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      const stamp = new Date().toISOString();
      const { error } = await supabase
        .from('user_profiles')
        .update({ gam_launch_seen_at: stamp })
        .eq('id', userId);
      if (error) throw error;
      return stamp;
    },
    onSuccess: (stamp) => {
      if (!userId || !stamp) return;
      // Optimistically reflect the dismissal so the sheet stays closed
      // for the rest of this session without an extra roundtrip.
      qc.setQueryData<LaunchSheetPayload | null>(
        QUERY_KEY(userId),
        (prev) => (prev ? { ...prev, launch_seen_at: stamp } : prev),
      );
    },
  });

  const shouldShow = !isLoading && !isError && !!data && data.launch_seen_at === null;
  const hasAnyData =
    !!data &&
    (data.achievements_earned > 0 ||
      data.active_streaks > 0 ||
      data.shared_rounds > 0);

  return { payload: data ?? null, shouldShow, hasAnyData, dismiss };
}
