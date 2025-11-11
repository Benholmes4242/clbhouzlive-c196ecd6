import { supabase } from '@/integrations/supabase/client';

export type DateRange = { from: string; to: string };

export async function getOverview(params: { range: DateRange; event?: string; userId?: string; tag?: string }) {
  const { from, to } = params.range;
  const { data, error } = await supabase.rpc('echo_analytics_overview_guarded', {
    p_from: from,
    p_to: to,
    p_event: params.event ?? null,
    p_user: params.userId ?? null,
    p_tag: params.tag ?? null,
  });
  if (error) throw error;
  return (data && data[0]) || { total_threads: 0, total_exports: 0, total_shares: 0, avg_latency_ms: null, active_users: 0 };
}

export async function getTimeseries(params: { range: DateRange; event?: string; userId?: string; tag?: string }) {
  const { from, to } = params.range;
  const { data, error } = await supabase.rpc('echo_analytics_timeseries_guarded', {
    p_from: from,
    p_to: to,
    p_event: params.event ?? null,
    p_user: params.userId ?? null,
    p_tag: params.tag ?? null,
  });
  if (error) throw error;
  return data ?? [];
}

export async function getTopTags(range: DateRange, userId?: string) {
  const { data, error } = await supabase.rpc('echo_analytics_top_tags_guarded', {
    p_from: range.from,
    p_to: range.to,
    p_user: userId ?? null,
  });
  if (error) throw error;
  return data ?? [];
}

export async function getExportFormats(range: DateRange) {
  const { data, error } = await supabase.rpc('echo_analytics_export_formats_guarded', {
    p_from: range.from,
    p_to: range.to,
  });
  if (error) throw error;
  return data ?? [];
}

export async function getTopThreads(range: DateRange) {
  const { data, error } = await supabase.rpc('echo_analytics_top_threads_guarded', {
    p_from: range.from,
    p_to: range.to,
  });
  if (error) throw error;
  return data ?? [];
}
