// C4 — share prompt. Surfaces a "Share this round" action on notifications the
// GAM evaluator already decided were notable. All gating (master switch,
// contested-only, per-category enable, window, daily cap) lives in the
// public.get_share_prompt_candidates RPC, which reads public.feed_config.
// Nothing is hardcoded here and nothing auto-posts.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export interface SharePromptCandidate {
  notif_id: string;
  notif_type: string;
  category: string | null;
  whs_score_id: string;
  course_id: string;
  course_name: string | null;
  course_country: string | null;
  created_at: string;
}

type RpcResult<T> = { data: T | null; error: { message: string } | null };
const rpcSharePrompt = supabase.rpc.bind(supabase) as unknown as (
  name: string,
  args: Record<string, unknown>,
) => Promise<RpcResult<SharePromptCandidate[]>>;

/** Start of the member's LOCAL day, as an ISO instant. */
function localDayStartIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
}

export function useSharePromptCandidates() {
  const { user } = useSupabaseSession();
  const dayStart = localDayStartIso();

  return useQuery({
    queryKey: ['share-prompt-candidates', user?.id ?? null, dayStart],
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await rpcSharePrompt('get_share_prompt_candidates', {
        p_day_start: dayStart,
      });
      if (error) throw error;
      return (data ?? []) as SharePromptCandidate[];
    },
  });
}

/** The candidate for one notification row, if that row won the daily cap. */
export function useSharePromptFor(notifId: string): SharePromptCandidate | null {
  const { data } = useSharePromptCandidates();
  return data?.find((c) => c.notif_id === notifId) ?? null;
}
