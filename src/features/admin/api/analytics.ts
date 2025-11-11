import { supabase } from '@/integrations/supabase/client';

export async function getSummary(days: number) {
  const { data, error } = await supabase.rpc('admin_echo_summary' as any, { days });
  if (error) throw error;
  return data ?? {};
}

export async function getTimeseries(event_names: string[], days: number) {
  const { data, error } = await supabase.rpc('admin_echo_timeseries' as any, { event_names, days });
  if (error) throw error;
  // map groups to named series expected by page
  const byName: Record<string, { x: string; y: number }[]> = {};
  for (const row of data ?? []) {
    const k = row.name as string;
    (byName[k] ||= []).push({ x: row.bucket, y: row.count });
  }
  return {
    inline: byName['echo_history_open_inline'] ?? [],
    full: byName['echo_history_open_full'] ?? [],
    exports: byName['echo_history_export_started'] ?? [],
    shares: byName['echo_share_created'] ?? [],
  };
}

export async function getTopTags(days: number, limit_n = 12) {
  const { data, error } = await supabase.rpc('admin_echo_top_tags' as any, { days, limit_n });
  if (error) throw error;
  return data ?? [];
}
