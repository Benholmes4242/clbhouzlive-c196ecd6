import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Typed from get_admin_inbox_flow's real output (12 Oct 2026). */
export interface InboxFlow {
  window_days: number;
  came_in: number;
  cleared: number;
  /** One decimal, or null when nothing has cleared in the window. */
  median_wait_hours: number | null;
  daily: { date: string; came_in: number; cleared: number }[];
  computed_at: string;
}

export const INBOX_FLOW_KEY = (days: number) => ['admin', 'inbox-flow', days] as const;

async function fetchInboxFlow(days: number): Promise<InboxFlow> {
  const { data, error } = await supabase.rpc('get_admin_inbox_flow' as never, { p_days: days } as never);
  if (error) throw error;
  return data as unknown as InboxFlow;
}

/** 14 for the Flow panel, 7 for the DONE 7D tile. Errors propagate: callers render empty shells. */
export function useInboxFlow(days: number) {
  const qc = useQueryClient();
  // Outside ['admin-v2'], so listen for the page-wide refetch event directly.
  useEffect(() => {
    const handler = () => qc.invalidateQueries({ queryKey: ['admin', 'inbox-flow'] });
    window.addEventListener('admin-v2:refetch', handler);
    return () => window.removeEventListener('admin-v2:refetch', handler);
  }, [qc]);

  return useQuery({
    queryKey: INBOX_FLOW_KEY(days),
    queryFn: () => fetchInboxFlow(days),
    staleTime: 60_000,
  });
}

/**
 * The RPC returns only days with activity; the chart needs exactly `days`
 * columns ending today, so missing dates are filled with zeros.
 */
export function flowColumns(flow: InboxFlow | undefined, days: number, today = new Date()): InboxFlow['daily'] {
  const byDate = new Map((flow?.daily ?? []).map(d => [d.date, d]));
  const out: InboxFlow['daily'] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    const key = d.toISOString().slice(0, 10);
    out.push(byDate.get(key) ?? { date: key, came_in: 0, cleared: 0 });
  }
  return out;
}

/** "{h}h", or "{d}d" past 48h; null renders as an em dash. */
export function formatWaitHours(h: number | null | undefined): string {
  if (h == null || !Number.isFinite(h)) return '\u2014';
  if (h > 48) return `${Math.floor(h / 24)}d`;
  return `${Math.round(h)}h`;
}
