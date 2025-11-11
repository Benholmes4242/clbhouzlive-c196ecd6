import { supabase } from '@/integrations/supabase/client';

export interface EchoKPIs {
  users_active_7d: number;
  threads_total: number;
  msgs_total: number;
  exports_7d: number;
  shares_active: number;
}

export interface EchoTimeseriesPoint {
  ts: string;
  threads: number;
}

export interface EchoTopTag {
  tag: string;
  uses: number;
}

export interface EchoRates {
  period: string;
  pct_starred: number;
  pct_with_response: number;
}

export async function getAdminEchoKPIs(): Promise<EchoKPIs> {
  const { data, error } = await supabase.rpc('admin_echo_kpis');
  if (error) throw error;
  const row = (data && data[0]) || {} as any;
  return {
    users_active_7d: row.users_active_7d || 0,
    threads_total: row.threads_total || 0,
    msgs_total: row.msgs_total || 0,
    exports_7d: row.exports_7d || 0,
    shares_active: row.shares_active || 0,
  };
}

export async function getAdminEchoTimeseries(): Promise<EchoTimeseriesPoint[]> {
  const { data, error } = await supabase.rpc('admin_echo_threads_timeseries');
  if (error) throw error;
  return data || [];
}

export async function getAdminEchoTopTags(): Promise<EchoTopTag[]> {
  const { data, error } = await supabase.rpc('admin_echo_top_tags');
  if (error) throw error;
  return data || [];
}

export async function getAdminEchoRates(): Promise<EchoRates | null> {
  const { data, error } = await supabase.rpc('admin_echo_rates');
  if (error) throw error;
  if (!data || data.length === 0) return null;
  return data[0];
}
