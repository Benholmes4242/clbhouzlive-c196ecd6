import { supabase } from '@/integrations/supabase/client';

export interface EchoSummary {
  period: string;
  conversations_created: number;
  starred_toggles: number;
  shares_created: number;
  exports_started: number;
  bulk_exports: number;
}

export interface TimeseriesPoint {
  d: string;
  n: number;
}

export interface TopTag {
  name: string;
  threads: number;
}

export async function getSummary(periodDays: number): Promise<EchoSummary | null> {
  const { data, error } = await supabase.rpc('admin_echo_summary' as any, { days: periodDays });
  if (error) throw error;
  return (data?.[0] as EchoSummary) || null;
}

export async function getTimeseries(names: string[], days: number): Promise<TimeseriesPoint[]> {
  const { data, error } = await supabase.rpc('admin_echo_timeseries' as any, { 
    event_names: names, 
    days 
  });
  if (error) throw error;
  return (data as TimeseriesPoint[]) || [];
}

export async function getTopTags(days: number, limit = 10): Promise<TopTag[]> {
  const { data, error } = await supabase.rpc('admin_echo_top_tags' as any, { 
    days, 
    limit_n: limit 
  });
  if (error) throw error;
  return (data as TopTag[]) || [];
}
