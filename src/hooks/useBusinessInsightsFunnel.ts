/**
 * The Insights headline and "from seen to acted" funnel (CB82).
 *
 * Reads `get_business_insights_funnel` (hand-applied INSIGHTS_FUNNEL_V1, not
 * yet in generated types). Every count is distinct golfers with the business's
 * own team excluded; the server owns that rule. Previous-period data stays on
 * screen while a new period loads, so switching range never collapses the card.
 */
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FunnelStage { value: number; prev: number }
export interface BusinessInsightsFunnel {
  period_days: number;
  saw: FunnelStage;
  opened: FunnelStage & { visits: number };
  followed: FunnelStage & { total: number };
  tapped: FunnelStage;
  top_post: { post_id: string; preview: string; reached: number } | null;
}

const num = (v: unknown) => Number(v) || 0;
const stage = (raw: any): FunnelStage => ({ value: num(raw?.value), prev: num(raw?.prev) });

export function parseFunnel(raw: any, days: number): BusinessInsightsFunnel {
  const p = typeof raw === 'string' ? JSON.parse(raw) : (raw ?? {});
  const tp = p.top_post;
  return {
    period_days: num(p.period_days) || days,
    saw: stage(p.saw),
    opened: { ...stage(p.opened), visits: num(p.opened?.visits) },
    followed: { ...stage(p.followed), total: num(p.followed?.total) },
    tapped: stage(p.tapped),
    top_post: tp && tp.post_id
      ? { post_id: String(tp.post_id), preview: String(tp.preview ?? ''), reached: num(tp.reached) }
      : null,
  };
}

export function useBusinessInsightsFunnel(businessId: string | undefined, days: number) {
  return useQuery({
    queryKey: ['business-insights-funnel', businessId, days],
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<BusinessInsightsFunnel> => {
      const { data, error } = await (supabase.rpc as any)('get_business_insights_funnel', {
        p_business_id: businessId,
        p_days: days,
      });
      if (error) throw error;
      return parseFunnel(data, days);
    },
  });
}
